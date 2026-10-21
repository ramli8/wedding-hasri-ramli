import {
  type DeviceEvent,
  MIN_SUPPORTED_SYNC_VERSION,
  normalizeInstagram,
  normalizePhone,
  type PushData,
  type PushResponse,
  type SnapshotGuest,
  type SnapshotResponse,
  SYNC_PROTOCOL_VERSION,
  withinUndoWindow,
} from "@wedding/shared";
import { and, asc, eq, gt, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  checkinEvents,
  devices,
  groupSessions,
  guestEvents,
  guestGroups,
  guests,
} from "../db/schema.js";
import { generateCode } from "../domain/guest-code.js";
import {
  type Executor,
  findCheckin,
  getCheckinEvent,
  lockCheckinLog,
  toStoredEvent,
} from "./checkin-log.js";
import type { DeviceRow } from "./devices.js";

export async function buildSnapshot(
  db: Db,
  device: DeviceRow,
  since: { rev: number; seq: number },
): Promise<SnapshotResponse> {
  const event = await getCheckinEvent(db);

  const groupRows = await db.select().from(guestGroups);
  const sessionRows = await db
    .select()
    .from(groupSessions)
    .where(eq(groupSessions.eventId, event.id));

  // Unduhan penuh hanya memuat tamu yang diundang. Pembaruan (delta) juga memuat tamu yang
  // dihapus atau tidak lagi diundang, supaya perangkat bisa membuangnya.
  const guestRows = await db
    .select({
      guest: guests,
      invitedToEvent: sql<boolean>`${guestEvents.guestId} is not null`,
    })
    .from(guests)
    .leftJoin(
      guestEvents,
      and(eq(guestEvents.guestId, guests.id), eq(guestEvents.eventId, event.id)),
    )
    .where(
      and(
        gt(guests.rev, since.rev),
        since.rev === 0 ? isNull(guests.deletedAt) : undefined,
        since.rev === 0 ? isNotNull(guestEvents.guestId) : undefined,
      ),
    )
    .orderBy(asc(guests.rev));

  const [revRow] = await db
    .select({ rev: sql<number>`coalesce(max(${guests.rev}), 0)::float8` })
    .from(guests);
  const [seqRow] = await db
    .select({ seq: sql<number>`coalesce(max(${checkinEvents.seq}), 0)::float8` })
    .from(checkinEvents);

  const eventRows = await db
    .select()
    .from(checkinEvents)
    .where(and(eq(checkinEvents.eventId, event.id), gt(checkinEvents.seq, since.seq)))
    .orderBy(asc(checkinEvents.seq));

  const deviceIds = [
    ...new Set(eventRows.map((r) => r.deviceId).filter((id): id is string => !!id)),
  ];
  const deviceRows = deviceIds.length
    ? await db
        .select({ id: devices.id, name: devices.name })
        .from(devices)
        .where(inArray(devices.id, deviceIds))
    : [];

  const snapshotGuests: SnapshotGuest[] = guestRows.map(({ guest, invitedToEvent }) => ({
    id: guest.id,
    code: guest.code,
    displayName: guest.displayName,
    fullName: guest.fullName,
    groupId: guest.groupId,
    quota: guest.quota,
    usherNote: guest.usherNote,
    source: guest.source as SnapshotGuest["source"],
    invited: invitedToEvent && guest.deletedAt === null,
    rev: guest.rev,
  }));

  return {
    serverTime: new Date().toISOString(),
    protocol: { version: SYNC_PROTOCOL_VERSION, minSupported: MIN_SUPPORTED_SYNC_VERSION },
    deviceName: device.name,
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      startsAt: event.startsAt?.toISOString() ?? null,
      endsAt: event.endsAt?.toISOString() ?? null,
    },
    groups: groupRows.map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      isVip: g.isVip,
    })),
    sessions: sessionRows.map((s) => ({
      groupId: s.groupId,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    })),
    guests: snapshotGuests,
    guestRev: revRow?.rev ?? 0,
    events: eventRows.map(toStoredEvent),
    checkinSeq: seqRow?.seq ?? 0,
    devices: deviceRows,
  };
}

// --- Push ----------------------------------------------------------------------------------------

async function newGuestCode(tx: Executor): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const [taken] = await tx
      .select({ id: guests.id })
      .from(guests)
      .where(eq(guests.code, code))
      .limit(1);
    if (!taken) return code;
  }
  throw new Error("Gagal membuat kode tamu yang unik");
}

async function storeWalkins(tx: Executor, eventId: string, walkins: PushData["walkins"]) {
  const codes: { id: string; code: string }[] = [];
  if (walkins.length === 0) return codes;

  const knownGroups = new Set(
    (await tx.select({ id: guestGroups.id }).from(guestGroups)).map((g) => g.id),
  );

  for (const walkin of walkins) {
    const [existing] = await tx
      .select({ code: guests.code })
      .from(guests)
      .where(eq(guests.id, walkin.id))
      .limit(1);
    if (existing) {
      if (existing.code) codes.push({ id: walkin.id, code: existing.code });
      continue;
    }

    const code = await newGuestCode(tx);
    await tx.insert(guests).values({
      id: walkin.id,
      code,
      displayName: walkin.displayName,
      phone: walkin.phone ? normalizePhone(walkin.phone) : null,
      instagram: walkin.instagram ? normalizeInstagram(walkin.instagram) : null,
      groupId: walkin.groupId && knownGroups.has(walkin.groupId) ? walkin.groupId : null,
      quota: walkin.quota,
      usherNote: walkin.usherNote ?? null,
      source: "walkin",
    });
    await tx.insert(guestEvents).values({ guestId: walkin.id, eventId });
    codes.push({ id: walkin.id, code });
  }
  return codes;
}

type Rejection = { reason: string };

async function validateEvent(
  tx: Executor,
  device: DeviceRow,
  eventId: string,
  e: DeviceEvent,
): Promise<Rejection | null> {
  if (e.eventId !== eventId) return { reason: "Acara ini tidak memakai check-in" };

  const [guest] = await tx
    .select({ id: guests.id })
    .from(guests)
    .where(eq(guests.id, e.guestId))
    .limit(1);
  if (!guest) return { reason: "Tamu tidak dikenal" };

  if (e.kind === "checkin") return null;

  const target = await findCheckin(tx, e.targetId, "checkin");
  if (!target || target.guestId !== e.guestId || target.eventId !== e.eventId) {
    return { reason: "Check-in yang dikoreksi tidak ditemukan" };
  }
  if (target.deviceId !== device.id) {
    return { reason: "Hanya perangkat yang sama yang boleh mengoreksi check-in ini" };
  }
  if (!withinUndoWindow({ scannedAt: target.scannedAt.toISOString() }, e.scannedAt)) {
    return { reason: "Batas waktu koreksi (2 menit) sudah lewat. Minta admin." };
  }
  return null;
}

export async function pushEvents(
  db: Db,
  device: DeviceRow,
  syncVersion: number,
  req: PushData,
): Promise<PushResponse> {
  const event = await getCheckinEvent(db);

  return db.transaction(async (tx) => {
    await lockCheckinLog(tx);
    const now = new Date();

    await tx
      .update(devices)
      .set({
        lastSeenAt: now,
        lastSyncAt: now,
        pendingOutbox: req.pendingOutbox,
        appVersion: req.appVersion,
        protocolVersion: syncVersion,
      })
      .where(eq(devices.id, device.id));

    const walkinCodes = await storeWalkins(tx, event.id, req.walkins);

    // Jam sesi tiap kelompok, untuk menandai check-in di luar sesi (hanya untuk log).
    const sessions = new Map(
      (await tx.select().from(groupSessions).where(eq(groupSessions.eventId, event.id))).map(
        (s) => [s.groupId, s],
      ),
    );
    const guestIds = [...new Set(req.events.map((e) => e.guestId))];
    const groupOfGuest = new Map<string, string | null>();
    if (guestIds.length) {
      const rows = await tx
        .select({ id: guests.id, groupId: guests.groupId })
        .from(guests)
        .where(inArray(guests.id, guestIds));
      for (const row of rows) groupOfGuest.set(row.id, row.groupId);
    }

    const results: PushResponse["results"] = [];
    for (const e of req.events) {
      const [known] = await tx
        .select({ id: checkinEvents.id })
        .from(checkinEvents)
        .where(eq(checkinEvents.id, e.id))
        .limit(1);
      if (known) {
        results.push({ id: e.id, status: "noop" });
        continue;
      }

      const rejection = await validateEvent(tx, device, event.id, e);
      if (rejection) {
        results.push({ id: e.id, status: "invalid", reason: rejection.reason });
        continue;
      }

      const scannedAt = new Date(e.scannedAt);
      let outsideSession = false;
      if (e.kind === "checkin") {
        const groupId = groupOfGuest.get(e.guestId);
        const session = groupId ? sessions.get(groupId) : undefined;
        outsideSession = !!session && (scannedAt < session.startsAt || scannedAt > session.endsAt);
      }

      await tx.insert(checkinEvents).values({
        id: e.id,
        kind: e.kind,
        guestId: e.guestId,
        eventId: e.eventId,
        targetId: e.kind === "checkin" ? null : e.targetId,
        pax: e.kind === "undo" ? null : e.pax,
        method: e.kind === "checkin" ? e.method : null,
        deviceId: device.id,
        scannedAt,
        deviceTime: new Date(req.deviceTime),
        outsideSession,
      });
      results.push({ id: e.id, status: "stored" });
    }

    return { serverTime: new Date().toISOString(), results, walkinCodes };
  });
}
