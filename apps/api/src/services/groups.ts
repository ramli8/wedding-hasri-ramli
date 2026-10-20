import type { Group, GroupData } from "@wedding/shared";
import { asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isForeignKeyViolation, isUniqueViolation } from "../db/errors.js";
import { events, groupSessions, guestGroups } from "../db/schema.js";
import { AppError } from "../http/errors.js";

// Nama tabel ditulis eksplisit: Drizzle membuang awalan tabel pada query satu-tabel, dan
// `id` polos di dalam subquery akan terbaca sebagai kolom `g.id`.
const guestCount = sql<number>`(
  select count(*)::int from guests g where g.group_id = guest_groups.id and g.deleted_at is null
)`;

async function withSessions(
  db: Db,
  rows: { group: typeof guestGroups.$inferSelect; guestCount: number }[],
) {
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
      gate: group.gate,
      sortOrder: group.sortOrder,
      guestCount,
      sessions: sessions
        .filter((s) => s.groupId === group.id)
        .map((s) => ({
          eventId: s.eventId,
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt.toISOString(),
        })),
    }),
  );
}

export async function listGroups(db: Db): Promise<Group[]> {
  const rows = await db
    .select({ group: guestGroups, guestCount })
    .from(guestGroups)
    .orderBy(asc(guestGroups.sortOrder), asc(guestGroups.name));
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
    throw new AppError(400, "VALIDATION_ERROR", "Ada acara pada jam sesi yang tidak ditemukan");
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
              endsAt: new Date(s.endsAt),
            })),
          )
        : undefined,
    );
}

export async function createGroup(db: Db, input: GroupData): Promise<Group> {
  await assertEventsExist(
    db,
    input.sessions.map((s) => s.eventId),
  );
  try {
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(guestGroups)
        .values({
          name: input.name,
          color: input.color,
          isVip: input.isVip,
          gate: input.gate,
          sortOrder: input.sortOrder,
        })
        .returning({ id: guestGroups.id });
      if (!row) throw new Error("Gagal membuat kelompok");
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
  await assertEventsExist(
    db,
    input.sessions.map((s) => s.eventId),
  );
  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(guestGroups)
        .set({
          name: input.name,
          color: input.color,
          isVip: input.isVip,
          gate: input.gate,
          sortOrder: input.sortOrder,
        })
        .where(eq(guestGroups.id, id))
        .returning({ id: guestGroups.id });
      if (updated.length === 0) throw new AppError(404, "NOT_FOUND", "Kelompok tidak ditemukan");
      await replaceSessions(tx, id, input);
    });
    return await getGroup(db, id);
  } catch (err) {
    if (isUniqueViolation(err, "guest_groups_name_unique")) throw nameTaken();
    throw err;
  }
}

export async function deleteGroup(db: Db, id: string): Promise<void> {
  try {
    const deleted = await db
      .delete(guestGroups)
      .where(eq(guestGroups.id, id))
      .returning({ id: guestGroups.id });
    if (deleted.length === 0) throw new AppError(404, "NOT_FOUND", "Kelompok tidak ditemukan");
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
