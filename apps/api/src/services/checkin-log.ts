import type { ResolverEvent, StoredEvent } from "@wedding/shared";
import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { checkinEvents, events } from "../db/schema.js";
import { AppError } from "../http/errors.js";

export type EventRow = typeof events.$inferSelect;
export type CheckinRow = typeof checkinEvents.$inferSelect;
/** Db atau transaksi. */
export type Executor = Pick<Db, "select" | "insert" | "update" | "delete" | "execute">;

/**
 * Semua penulisan ke log check-in dilakukan di bawah kunci ini. `seq` memakai bigserial, yang
 * bisa tidak berurutan dengan urutan commit bila beberapa transaksi menulis bersamaan; perangkat
 * yang menarik `seq > terakhir` lalu bisa melewatkan event yang commit belakangan. Dengan menulis
 * satu per satu, urutan `seq` = urutan commit. Beban kecil (beberapa HP, event pendek).
 */
export async function lockCheckinLog(tx: Executor) {
  await tx.execute(sql`select pg_advisory_xact_lock(7301)`);
}

/** Acara dengan check-in aktif (yang paling awal mulainya), atau `preferredId` bila diberikan. */
export async function getCheckinEvent(db: Executor, preferredId?: string): Promise<EventRow> {
  const rows = await db
    .select()
    .from(events)
    .where(preferredId ? eq(events.id, preferredId) : eq(events.checkinEnabled, true))
    .orderBy(asc(events.startsAt), asc(events.name))
    .limit(1);
  const row = rows[0];
  if (!row) {
    throw new AppError(
      409,
      "CONFLICT",
      "Belum ada acara dengan check-in aktif. Aktifkan di menu Acara.",
    );
  }
  return row;
}

export function toStoredEvent(row: CheckinRow): StoredEvent {
  return {
    seq: row.seq,
    id: row.id,
    kind: row.kind as StoredEvent["kind"],
    guestId: row.guestId,
    eventId: row.eventId,
    targetId: row.targetId,
    pax: row.pax,
    method: row.method as StoredEvent["method"],
    deviceId: row.deviceId,
    adminId: row.adminId,
    scannedAt: row.scannedAt.toISOString(),
    outsideSession: row.outsideSession,
  };
}

/** Event check-in untuk satu acara, dalam bentuk yang dikenali pemecah status. */
export async function loadEvents(db: Executor, eventId: string) {
  const rows = await db
    .select()
    .from(checkinEvents)
    .where(eq(checkinEvents.eventId, eventId))
    .orderBy(asc(checkinEvents.seq));
  return rows.map(toStoredEvent);
}

export type LoadedEvent = Awaited<ReturnType<typeof loadEvents>>[number] & ResolverEvent;

export async function findCheckin(db: Executor, id: string, kind?: StoredEvent["kind"]) {
  const [row] = await db
    .select()
    .from(checkinEvents)
    .where(
      kind ? and(eq(checkinEvents.id, id), eq(checkinEvents.kind, kind)) : eq(checkinEvents.id, id),
    )
    .limit(1);
  return row;
}
