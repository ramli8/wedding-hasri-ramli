import type { AdminGuestbookEntry, RsvpListResponse, RsvpStatus } from "@wedding/shared";
import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { events, guestbook, guestEvents, guestGroups, guests, rsvps } from "../db/schema.js";
import { AppError } from "../http/errors.js";

// --- RSVP ---------------------------------------------------------------------------------------

/** Acara RSVP yang diminta, atau yang pertama (menurut waktu mulai) bila tidak disebut. */
async function rsvpEvent(db: Db, eventId?: string) {
  const [row] = await db
    .select({ id: events.id, name: events.name })
    .from(events)
    .where(and(eventId ? eq(events.id, eventId) : undefined, eq(events.hasRsvp, true)))
    .orderBy(asc(events.startsAt), asc(events.name))
    .limit(1);
  if (!row) {
    throw new AppError(
      409,
      "CONFLICT",
      "Belum ada acara dengan RSVP aktif. Aktifkan 'Ada RSVP' di menu Acara.",
    );
  }
  return row;
}

export async function listRsvps(db: Db, eventId?: string): Promise<RsvpListResponse> {
  const event = await rsvpEvent(db, eventId);

  const rows = await db
    .select({
      guestId: guests.id,
      displayName: guests.displayName,
      isRombongan: guests.isRombongan,
      groupName: guestGroups.name,
      groupId: guests.groupId,
      code: guests.code,
      phone: guests.phone,
      remindedAt: guestEvents.remindedAt,
      status: rsvps.status,
      pax: rsvps.pax,
      submittedAt: rsvps.submittedAt,
    })
    .from(guestEvents)
    .innerJoin(guests, and(eq(guests.id, guestEvents.guestId), isNull(guests.deletedAt)))
    .leftJoin(guestGroups, eq(guestGroups.id, guests.groupId))
    .leftJoin(rsvps, and(eq(rsvps.guestId, guests.id), eq(rsvps.eventId, event.id)))
    .where(eq(guestEvents.eventId, event.id))
    .orderBy(asc(guests.displayName), asc(guests.id));

  const totals = { invited: rows.length, hadir: 0, hadirPax: 0, tidakHadir: 0, ragu: 0, belum: 0 };
  for (const row of rows) {
    if (row.status === "hadir") {
      totals.hadir += 1;
      totals.hadirPax += row.pax ?? 0;
    } else if (row.status === "tidak_hadir") totals.tidakHadir += 1;
    else if (row.status === "ragu") totals.ragu += 1;
    else totals.belum += 1;
  }

  return {
    event,
    totals,
    items: rows.map((row) => ({
      guestId: row.guestId,
      displayName: row.displayName,
      groupName: row.groupName,
      isRombongan: row.isRombongan,
      status: (row.status as RsvpStatus | null) ?? null,
      pax: row.pax,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      code: row.code,
      phone: row.phone,
      groupId: row.groupId,
      remindedAt: row.remindedAt?.toISOString() ?? null,
    })),
  };
}

/** Jumlah orang yang menjawab hadir di acara ini (tamu aktif saja). */
export async function rsvpHadirPax(db: Db, eventId: string): Promise<number> {
  const [row] = await db
    .select({ pax: sql<number>`coalesce(sum(${rsvps.pax}), 0)::int` })
    .from(rsvps)
    .innerJoin(guests, and(eq(guests.id, rsvps.guestId), isNull(guests.deletedAt)))
    .where(and(eq(rsvps.eventId, eventId), eq(rsvps.status, "hadir")));
  return row?.pax ?? 0;
}

// --- Ucapan -------------------------------------------------------------------------------------

const toAdminEntry = (row: typeof guestbook.$inferSelect): AdminGuestbookEntry => ({
  id: row.id,
  name: row.name,
  message: row.message,
  reply: row.reply,
  repliedAt: row.repliedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  isHidden: row.isHidden,
  guestId: row.guestId,
});

export async function listGuestbookAdmin(
  db: Db,
  params: { page: number; pageSize: number; hidden?: boolean },
) {
  const where = params.hidden === undefined ? undefined : eq(guestbook.isHidden, params.hidden);
  const [totalRow] = await db.select({ total: count() }).from(guestbook).where(where);
  const rows = await db
    .select()
    .from(guestbook)
    .where(where)
    .orderBy(desc(guestbook.createdAt), desc(guestbook.id))
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize);
  return {
    items: rows.map(toAdminEntry),
    total: totalRow?.total ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  };
}

const missing = () => new AppError(404, "NOT_FOUND", "Ucapan tidak ditemukan");

export async function replyGuestbook(db: Db, id: string, reply: string | null) {
  const [row] = await db
    .update(guestbook)
    .set({ reply, repliedAt: reply ? new Date() : null })
    .where(eq(guestbook.id, id))
    .returning();
  if (!row) throw missing();
  return toAdminEntry(row);
}

export async function hideGuestbook(db: Db, id: string, hidden: boolean) {
  const [row] = await db
    .update(guestbook)
    .set({ isHidden: hidden })
    .where(eq(guestbook.id, id))
    .returning();
  if (!row) throw missing();
  return toAdminEntry(row);
}

export async function deleteGuestbook(db: Db, id: string) {
  const deleted = await db
    .delete(guestbook)
    .where(eq(guestbook.id, id))
    .returning({ id: guestbook.id });
  if (deleted.length === 0) throw missing();
}

/** Menandai (atau membatalkan) pengingat RSVP terkirim untuk satu tamu di satu acara. */
export async function markReminded(db: Db, guestId: string, eventId: string, reminded: boolean) {
  const updated = await db
    .update(guestEvents)
    .set({ remindedAt: reminded ? new Date() : null })
    .where(and(eq(guestEvents.guestId, guestId), eq(guestEvents.eventId, eventId)))
    .returning({ guestId: guestEvents.guestId });
  if (updated.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Tamu tidak diundang ke acara ini");
  }
}
