import {
  DEFAULT_MESSAGE_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE,
  type Event,
  type EventData,
} from "@wedding/shared";
import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isForeignKeyViolation, isUniqueViolation } from "../db/errors.js";
import { events, groupSessions, messageTemplates, reminderTemplates } from "../db/schema.js";
import { AppError } from "../http/errors.js";

const invitedCount = sql<number>`(
  select count(*)::int from guest_events ge
  join guests g on g.id = ge.guest_id
  where ge.event_id = events.id and g.deleted_at is null
)`;

const selection = {
  event: events,
  template: messageTemplates.body,
  reminder: reminderTemplates.body,
  invitedCount,
};

function toEvent(row: {
  event: typeof events.$inferSelect;
  template: string | null;
  reminder: string | null;
  invitedCount: number;
}): Event {
  const { event } = row;
  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    startsAt: event.startsAt?.toISOString() ?? null,
    endsAt: event.endsAt?.toISOString() ?? null,
    venueName: event.venueName,
    address: event.address,
    mapsUrl: event.mapsUrl,
    checkinEnabled: event.checkinEnabled,
    hasRsvp: event.hasRsvp,
    messageTemplate: row.template ?? "",
    reminderTemplate: row.reminder ?? "",
    invitedCount: row.invitedCount,
  };
}

export async function listEvents(db: Db): Promise<Event[]> {
  const rows = await db
    .select(selection)
    .from(events)
    .leftJoin(messageTemplates, eq(messageTemplates.eventId, events.id))
    .leftJoin(reminderTemplates, eq(reminderTemplates.eventId, events.id))
    .orderBy(asc(events.startsAt), asc(events.name));
  return rows.map(toEvent);
}

export async function getEvent(db: Db, id: string): Promise<Event> {
  const [row] = await db
    .select(selection)
    .from(events)
    .leftJoin(messageTemplates, eq(messageTemplates.eventId, events.id))
    .leftJoin(reminderTemplates, eq(reminderTemplates.eventId, events.id))
    .where(eq(events.id, id))
    .limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Acara tidak ditemukan");
  return toEvent(row);
}

/** "Resepsi & Ramah Tamah" -> "resepsi-ramah-tamah"; huruf non-Latin saja -> "acara". */
const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "acara";

/**
 * Kode singkat unik dari nama acara (admin tidak perlu mengisinya; dipakai sebagai penanda di
 * impor/ekspor bila dua acara bernama sama). Bentrok diberi akhiran -2, -3, dst.
 */
async function uniqueSlug(db: Db, name: string, exceptId?: string): Promise<string> {
  const base = slugify(name);
  const taken = new Set(
    (await db.select({ id: events.id, slug: events.slug }).from(events))
      .filter((row) => row.id !== exceptId)
      .map((row) => row.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

function eventColumns(input: EventData, slug: string) {
  return {
    slug,
    name: input.name,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    venueName: input.venueName,
    address: input.address,
    mapsUrl: input.mapsUrl,
    checkinEnabled: input.checkinEnabled,
    hasRsvp: input.hasRsvp,
  };
}

async function saveTemplate(tx: Pick<Db, "insert" | "delete">, eventId: string, body: string) {
  // Sama dengan bawaan = tidak disimpan, supaya perbaikan template bawaan ikut terpakai.
  if (!body.trim() || body.trim() === DEFAULT_MESSAGE_TEMPLATE.trim()) {
    await tx.delete(messageTemplates).where(eq(messageTemplates.eventId, eventId));
    return;
  }
  await tx
    .insert(messageTemplates)
    .values({ eventId, body })
    .onConflictDoUpdate({ target: messageTemplates.eventId, set: { body } });
}

const slugTaken = () => new AppError(409, "CONFLICT", "Slug acara sudah dipakai");

export async function createEvent(db: Db, input: EventData): Promise<Event> {
  try {
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(events)
        .values(eventColumns(input, input.slug ?? (await uniqueSlug(db, input.name))))
        .returning({ id: events.id });
      if (!row) throw new Error("Gagal membuat acara");
      if (input.messageTemplate !== undefined)
        await saveTemplate(tx, row.id, input.messageTemplate);
      return row.id;
    });
    return await getEvent(db, id);
  } catch (err) {
    if (isUniqueViolation(err, "events_slug_unique")) throw slugTaken();
    throw err;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WIB_MS = 7 * 60 * 60 * 1000;
/** Awal hari (00.00 WIB) dari sebuah waktu, dalam milidetik. */
const wibDay = (iso: string) => Math.floor((Date.parse(iso) + WIB_MS) / DAY_MS) * DAY_MS;

/** Selisih hari (dalam ms) antara tanggal lama dan baru; 0 bila salah satu kosong atau sama. */
function dayShiftMs(before: string | null, after: string | null): number {
  return before && after ? wibDay(after) - wibDay(before) : 0;
}

export async function updateEvent(db: Db, id: string, input: EventData): Promise<Event> {
  // Kode singkat lama dipertahankan saat nama diubah (impor lama yang memakainya tetap cocok).
  const existing = await getEvent(db, id);
  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(events)
        .set(eventColumns(input, input.slug ?? existing.slug))
        .where(eq(events.id, id))
        .returning({ id: events.id });
      if (updated.length === 0) throw new AppError(404, "NOT_FOUND", "Acara tidak ditemukan");
      if (input.messageTemplate !== undefined) await saveTemplate(tx, id, input.messageTemplate);
      // Jam datang kelompok menyimpan tanggal lengkap: bila tanggal acara pindah, jamnya ikut pindah
      // ke tanggal baru (jamnya tetap).
      const shiftMs = dayShiftMs(existing.startsAt, input.startsAt);
      if (shiftMs) {
        await tx
          .update(groupSessions)
          .set({
            startsAt: sql`${groupSessions.startsAt} + ${shiftMs} * interval '1 millisecond'`,
            endsAt: sql`${groupSessions.endsAt} + ${shiftMs} * interval '1 millisecond'`,
          })
          .where(eq(groupSessions.eventId, id));
      }
    });
    return await getEvent(db, id);
  } catch (err) {
    if (isUniqueViolation(err, "events_slug_unique")) throw slugTaken();
    throw err;
  }
}

/** Pesan undangan satu acara (Pengaturan → Pesan undangan). Terhapus otomatis bersama acaranya. */
export async function setEventMessage(db: Db, id: string, body: string): Promise<Event> {
  await getEvent(db, id);
  await saveTemplate(db, id, body);
  return getEvent(db, id);
}

/** Pesan pengingat RSVP satu acara. Kosong atau sama dengan bawaan = memakai bawaan. */
export async function setEventReminder(db: Db, id: string, body: string): Promise<Event> {
  await getEvent(db, id);
  if (!body.trim() || body.trim() === DEFAULT_REMINDER_TEMPLATE.trim()) {
    await db.delete(reminderTemplates).where(eq(reminderTemplates.eventId, id));
  } else {
    await db
      .insert(reminderTemplates)
      .values({ eventId: id, body })
      .onConflictDoUpdate({ target: reminderTemplates.eventId, set: { body } });
  }
  return getEvent(db, id);
}

export async function deleteEvent(db: Db, id: string): Promise<void> {
  try {
    const deleted = await db.delete(events).where(eq(events.id, id)).returning({ id: events.id });
    if (deleted.length === 0) throw new AppError(404, "NOT_FOUND", "Acara tidak ditemukan");
  } catch (err) {
    // checkin_events.event_id tidak cascade: data check-in tidak boleh hilang diam-diam.
    if (isForeignKeyViolation(err)) {
      throw new AppError(
        409,
        "CONFLICT",
        "Acara ini sudah punya data check-in dan tidak bisa dihapus",
      );
    }
    throw err;
  }
}
