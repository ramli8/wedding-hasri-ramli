import {
  type Dashboard,
  needsReview,
  type ResolveRequest,
  type ReviewItem,
  resolveCheckins,
  type StoredEvent,
  uuid7,
} from "@wedding/shared";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  checkinEvents,
  checkinReviews,
  devices,
  guestEvents,
  guestGroups,
  guests,
} from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { findCheckin, getCheckinEvent, loadEvents, lockCheckinLog } from "./checkin-log.js";
import { toDevice } from "./devices.js";

const NO_GROUP = { name: "Tanpa kelompok", color: "#737373" };

async function loadContext(db: Db, eventId: string) {
  const storedEvents = await loadEvents(db, eventId);
  const reviews = await db.select().from(checkinReviews).where(eq(checkinReviews.eventId, eventId));
  const states = resolveCheckins(
    storedEvents,
    reviews.map((r) => ({
      guestId: r.guestId,
      eventId: r.eventId,
      resolution: r.resolution as "keep_first" | "merge_pax",
    })),
  );
  const deviceRows = await db.select().from(devices);
  return { states, deviceRows, deviceName: new Map(deviceRows.map((d) => [d.id, d.name])) };
}

export async function buildDashboard(db: Db, eventId?: string): Promise<Dashboard> {
  const event = await getCheckinEvent(db, eventId);
  const { states, deviceRows, deviceName } = await loadContext(db, event.id);

  const invited = await db
    .select({
      id: guests.id,
      displayName: guests.displayName,
      groupId: guests.groupId,
      source: guests.source,
    })
    .from(guests)
    .innerJoin(
      guestEvents,
      and(eq(guestEvents.guestId, guests.id), eq(guestEvents.eventId, event.id)),
    )
    .where(isNull(guests.deletedAt));
  const groupRows = await db.select().from(guestGroups);
  const groupById = new Map(groupRows.map((g) => [g.id, g]));
  const guestById = new Map(invited.map((g) => [g.id, g]));
  const stateByGuest = new Map(states.map((s) => [s.guestId, s]));

  // Rekap per kelompok; tamu tanpa kelompok masuk satu baris tersendiri.
  const buckets = new Map<
    string | null,
    {
      id: string | null;
      name: string;
      color: string;
      isVip: boolean;
      invited: number;
      arrived: number;
      pax: number;
    }
  >();
  const bucketFor = (groupId: string | null) => {
    const existing = buckets.get(groupId);
    if (existing) return existing;
    const group = groupId ? groupById.get(groupId) : undefined;
    const bucket = {
      id: group?.id ?? null,
      name: group?.name ?? NO_GROUP.name,
      color: group?.color ?? NO_GROUP.color,
      isVip: group?.isVip ?? false,
      invited: 0,
      arrived: 0,
      pax: 0,
    };
    buckets.set(groupId, bucket);
    return bucket;
  };
  for (const group of groupRows) bucketFor(group.id);

  let arrivedPax = 0;
  let walkins = 0;
  for (const guest of invited) {
    const bucket = bucketFor(guest.groupId);
    bucket.invited += 1;
    if (guest.source === "walkin") walkins += 1;
    const state = stateByGuest.get(guest.id);
    if (state) {
      bucket.arrived += 1;
      bucket.pax += state.pax;
      arrivedPax += state.pax;
    }
  }

  const recent = [...states]
    .sort((a, b) => Date.parse(b.primary.scannedAt) - Date.parse(a.primary.scannedAt))
    .slice(0, 20)
    .flatMap((state) => {
      const guest = guestById.get(state.guestId);
      if (!guest) return [];
      const group = guest.groupId ? groupById.get(guest.groupId) : undefined;
      return [
        {
          checkinId: state.primary.id,
          guestId: guest.id,
          displayName: guest.displayName,
          groupName: group?.name ?? null,
          isVip: group?.isVip ?? false,
          pax: state.pax,
          method: state.primary.method,
          deviceName: state.primary.deviceId
            ? (deviceName.get(state.primary.deviceId) ?? null)
            : state.primary.adminId
              ? "Admin"
              : null,
          scannedAt: state.primary.scannedAt,
          outsideSession: state.primary.outsideSession,
          hasDuplicates: state.duplicates.length > 0,
        },
      ];
    });

  return {
    serverTime: new Date().toISOString(),
    event: { id: event.id, name: event.name },
    totals: {
      invited: invited.length,
      arrived: states.filter((s) => guestById.has(s.guestId)).length,
      arrivedPax,
      needsReview: states.filter(needsReview).length,
      outsideSession: states.filter((s) => s.primary.outsideSession).length,
      walkins,
    },
    groups: [...buckets.values()].filter((b) => b.invited > 0 || b.arrived > 0),
    recent,
    devices: deviceRows
      .map((row) => toDevice(row))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export async function reviewQueue(db: Db, eventId?: string): Promise<ReviewItem[]> {
  const event = await getCheckinEvent(db, eventId);
  const { states, deviceName } = await loadContext(db, event.id);
  const pending = states.filter(needsReview);
  if (pending.length === 0) return [];

  const guestRows = await db
    .select({
      id: guests.id,
      displayName: guests.displayName,
      groupId: guests.groupId,
    })
    .from(guests)
    .where(
      inArray(
        guests.id,
        pending.map((s) => s.guestId),
      ),
    );
  const groupRows = await db
    .select({ id: guestGroups.id, name: guestGroups.name })
    .from(guestGroups);
  const groupName = new Map(groupRows.map((g) => [g.id, g.name]));
  const guestById = new Map(guestRows.map((g) => [g.id, g]));

  const describe = (e: StoredEvent) => ({
    id: e.id,
    pax: e.pax ?? 1,
    method: e.method,
    deviceName: e.deviceId ? (deviceName.get(e.deviceId) ?? null) : e.adminId ? "Admin" : null,
    scannedAt: e.scannedAt,
  });

  return pending.flatMap((state) => {
    const guest = guestById.get(state.guestId);
    if (!guest) return [];
    return [
      {
        guestId: state.guestId,
        eventId: state.eventId,
        displayName: guest.displayName,
        groupName: guest.groupId ? (groupName.get(guest.groupId) ?? null) : null,
        primary: describe(state.primary),
        duplicates: state.duplicates.map(describe),
      },
    ];
  });
}

export async function resolveReview(db: Db, adminId: string, req: ResolveRequest) {
  const note = req.note || null;
  await db
    .insert(checkinReviews)
    .values({
      guestId: req.guestId,
      eventId: req.eventId,
      resolution: req.resolution,
      note,
      resolvedBy: adminId,
    })
    .onConflictDoUpdate({
      target: [checkinReviews.guestId, checkinReviews.eventId],
      set: { resolution: req.resolution, note, resolvedBy: adminId, resolvedAt: new Date() },
    });
}

/** Koreksi oleh admin: `undo` atau `set_pax` terhadap check-in mana pun, tanpa batas waktu. */
async function adminCorrection(
  db: Db,
  adminId: string,
  checkinId: string,
  build: (target: { guestId: string; eventId: string }) => {
    kind: "undo" | "set_pax";
    pax: number | null;
  },
) {
  return db.transaction(async (tx) => {
    await lockCheckinLog(tx);
    const target = await findCheckin(tx, checkinId, "checkin");
    if (!target) throw new AppError(404, "NOT_FOUND", "Check-in tidak ditemukan");

    const [undone] = await tx
      .select({ id: checkinEvents.id })
      .from(checkinEvents)
      .where(and(eq(checkinEvents.targetId, checkinId), eq(checkinEvents.kind, "undo")))
      .limit(1);
    if (undone) throw new AppError(409, "CONFLICT", "Check-in ini sudah dibatalkan");

    const { kind, pax } = build(target);
    await tx.insert(checkinEvents).values({
      id: uuid7(),
      kind,
      guestId: target.guestId,
      eventId: target.eventId,
      targetId: target.id,
      pax,
      adminId,
      scannedAt: new Date(),
    });
  });
}

export const adminUndo = (db: Db, adminId: string, checkinId: string) =>
  adminCorrection(db, adminId, checkinId, () => ({ kind: "undo", pax: null }));

export const adminSetPax = (db: Db, adminId: string, checkinId: string, pax: number) =>
  adminCorrection(db, adminId, checkinId, () => ({ kind: "set_pax", pax }));

export async function listLog(db: Db, query: { eventId?: string; page: number; pageSize: number }) {
  const event = await getCheckinEvent(db, query.eventId);
  const where = eq(checkinEvents.eventId, event.id);

  const [totalRow] = await db.select({ total: count() }).from(checkinEvents).where(where);
  const rows = await db
    .select({
      row: checkinEvents,
      displayName: guests.displayName,
      deviceName: devices.name,
    })
    .from(checkinEvents)
    .innerJoin(guests, eq(guests.id, checkinEvents.guestId))
    .leftJoin(devices, eq(devices.id, checkinEvents.deviceId))
    .where(where)
    .orderBy(desc(checkinEvents.seq))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return {
    items: rows.map(({ row, displayName, deviceName }) => ({
      seq: row.seq,
      id: row.id,
      kind: row.kind as StoredEvent["kind"],
      displayName,
      pax: row.pax,
      method: row.method as StoredEvent["method"],
      deviceName,
      byAdmin: row.adminId !== null,
      scannedAt: row.scannedAt.toISOString(),
      receivedAt: row.receivedAt.toISOString(),
      outsideSession: row.outsideSession,
    })),
    total: totalRow?.total ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
}
