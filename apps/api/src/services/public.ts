import {
  type GuestbookEntry,
  type GuestbookListResponse,
  type GuestbookPostRequest,
  MAX_PAX,
  type RsvpRequest,
  type RsvpStatus,
  type TicketResponse,
} from "@wedding/shared";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  events,
  groupSessions,
  guestbook,
  guestEvents,
  guestGroups,
  guests,
  rsvps,
} from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { getSettings } from "./settings.js";

/** Tamu aktif menurut kode. Dipakai tiket, RSVP, dan ucapan. */
export async function findGuestByCode(db: Db, code: string) {
  const [guest] = await db.select().from(guests).where(eq(guests.code, code)).limit(1);
  if (!guest || guest.deletedAt) return null;
  return guest;
}

const notFound = () => new AppError(404, "NOT_FOUND", "Tiket tidak ditemukan");

/** Isi halaman /u/KODE. Sengaja tanpa HP/Instagram. */
export async function getTicket(db: Db, code: string): Promise<TicketResponse> {
  const guest = await findGuestByCode(db, code);
  if (!guest?.code) throw notFound();

  const group = guest.groupId
    ? (await db.select().from(guestGroups).where(eq(guestGroups.id, guest.groupId)).limit(1))[0]
    : undefined;

  const invited = await db
    .select({ event: events })
    .from(guestEvents)
    .innerJoin(events, eq(events.id, guestEvents.eventId))
    .where(eq(guestEvents.guestId, guest.id))
    .orderBy(asc(events.startsAt), asc(events.name));
  const eventIds = invited.map((row) => row.event.id);

  const sessions =
    group && eventIds.length
      ? await db
          .select()
          .from(groupSessions)
          .where(and(eq(groupSessions.groupId, group.id), inArray(groupSessions.eventId, eventIds)))
      : [];
  const answers = eventIds.length
    ? await db
        .select()
        .from(rsvps)
        .where(and(eq(rsvps.guestId, guest.id), inArray(rsvps.eventId, eventIds)))
    : [];

  const couple = await getSettings(db);
  return {
    guest: {
      code: guest.code,
      displayName: guest.displayName,
      isRombongan: guest.isRombongan,
      groupName: group?.name ?? null,
    },
    couple: couple ? { groomName: couple.groomName, brideName: couple.brideName } : null,
    events: invited.map(({ event }) => {
      const session = sessions.find((s) => s.eventId === event.id);
      const answer = answers.find((a) => a.eventId === event.id);
      return {
        id: event.id,
        name: event.name,
        startsAt: event.startsAt?.toISOString() ?? null,
        endsAt: event.endsAt?.toISOString() ?? null,
        venueName: event.venueName,
        address: event.address,
        mapsUrl: event.mapsUrl,
        checkinEnabled: event.checkinEnabled,
        hasRsvp: event.hasRsvp,
        session: session
          ? { startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString() }
          : null,
        rsvp: answer ? { status: answer.status as RsvpStatus, pax: answer.pax } : null,
      };
    }),
  };
}

/** Jumlah orang yang disimpan: 0 bila tidak hadir; tamu biasa selalu 1; rombongan sesuai isian. */
function rsvpPax(status: RsvpStatus, isRombongan: boolean, pax: number | undefined) {
  if (status === "tidak_hadir") return 0;
  if (!isRombongan) return 1;
  return Math.min(MAX_PAX, Math.max(1, pax ?? 1));
}

export async function submitRsvp(db: Db, input: RsvpRequest & { code: string }) {
  const guest = await findGuestByCode(db, input.code);
  if (!guest) throw notFound();

  const [row] = await db
    .select({ event: events })
    .from(guestEvents)
    .innerJoin(events, eq(events.id, guestEvents.eventId))
    .where(and(eq(guestEvents.guestId, guest.id), eq(guestEvents.eventId, input.eventId)))
    .limit(1);
  if (!row) throw new AppError(400, "VALIDATION_ERROR", "Anda tidak diundang ke acara ini");
  if (!row.event.hasRsvp) {
    throw new AppError(400, "VALIDATION_ERROR", "Acara ini tidak memakai konfirmasi kehadiran");
  }

  const pax = rsvpPax(input.status, guest.isRombongan, input.pax);
  await db
    .insert(rsvps)
    .values({ guestId: guest.id, eventId: input.eventId, status: input.status, pax })
    .onConflictDoUpdate({
      target: [rsvps.guestId, rsvps.eventId],
      set: { status: input.status, pax, submittedAt: new Date() },
    });
  return { status: input.status, pax };
}

const toEntry = (row: typeof guestbook.$inferSelect): GuestbookEntry => ({
  id: row.id,
  name: row.name,
  message: row.message,
  reply: row.reply,
  repliedAt: row.repliedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

export async function listGuestbook(
  db: Db,
  page: number,
  pageSize: number,
): Promise<GuestbookListResponse> {
  const where = eq(guestbook.isHidden, false);
  const [totalRow] = await db.select({ total: count() }).from(guestbook).where(where);
  const rows = await db
    .select()
    .from(guestbook)
    .where(where)
    .orderBy(desc(guestbook.createdAt), desc(guestbook.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { items: rows.map(toEntry), total: totalRow?.total ?? 0, page, pageSize };
}

export async function postGuestbook(db: Db, input: GuestbookPostRequest & { name: string | null }) {
  const guest = await findGuestByCode(db, input.code);
  if (!guest) throw notFound();
  const [row] = await db
    .insert(guestbook)
    .values({
      guestId: guest.id,
      name: input.name ?? guest.displayName,
      message: input.message,
    })
    .returning();
  if (!row) throw new Error("Gagal menyimpan ucapan");
  return toEntry(row);
}
