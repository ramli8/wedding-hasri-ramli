import type { Group, GroupData } from "@wedding/shared";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isForeignKeyViolation, isUniqueViolation } from "../db/errors.js";
import {
  events,
  groupEvents,
  groupSessions,
  guestEvents,
  guestGroups,
  guests,
} from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { type Executor, lockGuestRev } from "./checkin-log.js";
import { guestTouch } from "./guests.js";

// Nama tabel ditulis eksplisit: Drizzle membuang awalan tabel pada query satu-tabel, dan
// `id` polos di dalam subquery akan terbaca sebagai kolom `g.id`.
const guestCount = sql<number>`(
  select count(*)::int from guests g where g.group_id = guest_groups.id and g.deleted_at is null
)`;

async function withSessions(
  db: Db,
  rows: { group: typeof guestGroups.$inferSelect; guestCount: number }[],
) {
  const ids = rows.map((r) => r.group.id);
  const invited = ids.length
    ? await db.select().from(groupEvents).where(inArray(groupEvents.groupId, ids))
    : [];
  const sessions = rows.length
    ? await db
        .select()
        .from(groupSessions)
        .where(
          inArray(
            groupSessions.groupId,
            rows.map((r) => r.group.id),
          ),
        )
    : [];
  return rows.map(
    ({ group, guestCount }): Group => ({
      id: group.id,
      name: group.name,
      color: group.color,
      isVip: group.isVip,
      guestCount,
      eventIds: invited.filter((e) => e.groupId === group.id).map((e) => e.eventId),
      sessions: sessions
        .filter((s) => s.groupId === group.id)
        .map((s) => ({
          eventId: s.eventId,
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt?.toISOString() ?? null,
        })),
    }),
  );
}

export async function listGroups(db: Db): Promise<Group[]> {
  const rows = await db
    .select({ group: guestGroups, guestCount })
    .from(guestGroups)
    .orderBy(asc(guestGroups.name));
  return withSessions(db, rows);
}

export async function getGroup(db: Db, id: string): Promise<Group> {
  const rows = await db
    .select({ group: guestGroups, guestCount })
    .from(guestGroups)
    .where(eq(guestGroups.id, id))
    .limit(1);
  const [group] = await withSessions(db, rows);
  if (!group) throw new AppError(404, "NOT_FOUND", "Kelompok tidak ditemukan");
  return group;
}

async function assertEventsExist(db: Pick<Db, "select">, eventIds: string[]) {
  if (eventIds.length === 0) return;
  const found = await db.select({ id: events.id }).from(events).where(inArray(events.id, eventIds));
  if (found.length !== new Set(eventIds).size) {
    throw new AppError(400, "VALIDATION_ERROR", "Ada acara yang tidak ditemukan");
  }
}

const nameTaken = () => new AppError(409, "CONFLICT", "Nama kelompok sudah dipakai");

function replaceSessions(tx: Pick<Db, "delete" | "insert">, groupId: string, input: GroupData) {
  return tx
    .delete(groupSessions)
    .where(eq(groupSessions.groupId, groupId))
    .then(() =>
      input.sessions.length
        ? tx.insert(groupSessions).values(
            input.sessions.map((s) => ({
              groupId,
              eventId: s.eventId,
              startsAt: new Date(s.startsAt),
              endsAt: s.endsAt ? new Date(s.endsAt) : null,
            })),
          )
        : undefined,
    );
}

/**
 * Menyimpan acara yang diundang untuk kelompok, lalu menyamakan undangan tamu kelompok itu:
 * acara yang baru dicentang ditambahkan ke semua tamunya, acara yang dilepas dicabut.
 * Undangan lain milik tamu (pengecualian per tamu) tidak disentuh.
 */
async function replaceInvitedEvents(tx: Executor, groupId: string, wanted: string[]) {
  const before = await tx
    .select({ eventId: groupEvents.eventId })
    .from(groupEvents)
    .where(eq(groupEvents.groupId, groupId));
  const have = new Set(before.map((e) => e.eventId));
  const want = new Set(wanted);
  const added = [...want].filter((id) => !have.has(id));
  const removed = [...have].filter((id) => !want.has(id));
  if (removed.length) {
    await tx
      .delete(groupEvents)
      .where(and(eq(groupEvents.groupId, groupId), inArray(groupEvents.eventId, removed)));
  }
  if (added.length) {
    await tx.insert(groupEvents).values(added.map((eventId) => ({ groupId, eventId })));
  }
  if (!added.length && !removed.length) return;

  // Undangan tamu ikut dikirim ke perangkat pintu, jadi rev tamunya harus naik (lihat lockGuestRev).
  await lockGuestRev(tx);
  const members = await tx
    .update(guests)
    .set(guestTouch())
    .where(eq(guests.groupId, groupId))
    .returning({ id: guests.id });
  const memberIds = members.map((m) => m.id);
  if (!memberIds.length) return;
  if (removed.length) {
    await tx
      .delete(guestEvents)
      .where(and(inArray(guestEvents.guestId, memberIds), inArray(guestEvents.eventId, removed)));
  }
  if (added.length) {
    await tx
      .insert(guestEvents)
      .values(memberIds.flatMap((guestId) => added.map((eventId) => ({ guestId, eventId }))))
      .onConflictDoNothing();
  }
}

export async function createGroup(db: Db, input: GroupData): Promise<Group> {
  await assertEventsExist(db, input.eventIds);
  try {
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(guestGroups)
        .values({
          name: input.name,
          color: input.color,
          isVip: input.isVip,
        })
        .returning({ id: guestGroups.id });
      if (!row) throw new Error("Gagal membuat kelompok");
      await replaceInvitedEvents(tx, row.id, input.eventIds);
      await replaceSessions(tx, row.id, input);
      return row.id;
    });
    return await getGroup(db, id);
  } catch (err) {
    if (isUniqueViolation(err, "guest_groups_name_unique")) throw nameTaken();
    throw err;
  }
}

export async function updateGroup(db: Db, id: string, input: GroupData): Promise<Group> {
  await assertEventsExist(db, input.eventIds);
  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(guestGroups)
        .set({
          name: input.name,
          color: input.color,
          isVip: input.isVip,
        })
        .where(eq(guestGroups.id, id))
        .returning({ id: guestGroups.id });
      if (updated.length === 0) throw new AppError(404, "NOT_FOUND", "Kelompok tidak ditemukan");
      await replaceInvitedEvents(tx, id, input.eventIds);
      await replaceSessions(tx, id, input);
    });
    return await getGroup(db, id);
  } catch (err) {
    if (isUniqueViolation(err, "guest_groups_name_unique")) throw nameTaken();
    throw err;
  }
}

/**
 * Menghapus kelompok. Dengan `moveTo` (id kelompok lain atau "none"), tamunya dipindah dulu dalam
 * transaksi yang sama, termasuk tamu di tempat sampah (agar kunci asing tidak menahan penghapusan).
 * Tanpa `moveTo`, kelompok yang masih dipakai tamu ditolak.
 */
export async function deleteGroup(db: Db, id: string, moveTo?: string): Promise<void> {
  if (moveTo === id) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Kelompok tujuan tidak boleh kelompok yang dihapus",
    );
  }
  try {
    await db.transaction(async (tx) => {
      if (moveTo !== undefined) {
        const target = moveTo === "none" ? null : moveTo;
        if (target) {
          const [group] = await tx
            .select({ id: guestGroups.id })
            .from(guestGroups)
            .where(eq(guestGroups.id, target))
            .limit(1);
          if (!group)
            throw new AppError(400, "VALIDATION_ERROR", "Kelompok tujuan tidak ditemukan");
        }
        await lockGuestRev(tx);
        await tx
          .update(guests)
          .set({ groupId: target, ...guestTouch() })
          .where(eq(guests.groupId, id));
      }
      const deleted = await tx
        .delete(guestGroups)
        .where(eq(guestGroups.id, id))
        .returning({ id: guestGroups.id });
      if (deleted.length === 0) throw new AppError(404, "NOT_FOUND", "Kelompok tidak ditemukan");
    });
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw new AppError(
        409,
        "CONFLICT",
        "Kelompok masih dipakai tamu (termasuk yang ada di tempat sampah). Pindahkan tamunya dulu.",
      );
    }
    throw err;
  }
}
