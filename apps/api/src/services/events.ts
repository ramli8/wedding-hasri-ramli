import type { Event, EventData } from "@wedding/shared";
import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isForeignKeyViolation, isUniqueViolation } from "../db/errors.js";
import { events, messageTemplates } from "../db/schema.js";
import { AppError } from "../http/errors.js";

const invitedCount = sql<number>`(
  select count(*)::int from guest_events ge
  join guests g on g.id = ge.guest_id
  where ge.event_id = events.id and g.deleted_at is null
)`;

const selection = {
  event: events,
  template: messageTemplates.body,
  invitedCount,
};

function toEvent(row: {
  event: typeof events.$inferSelect;
  template: string | null;
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
    notes: event.notes,
    checkinEnabled: event.checkinEnabled,
    hasRsvp: event.hasRsvp,
    sortOrder: event.sortOrder,
    messageTemplate: row.template ?? "",
    invitedCount: row.invitedCount,
  };
}

export async function listEvents(db: Db): Promise<Event[]> {
  const rows = await db
    .select(selection)
    .from(events)
    .leftJoin(messageTemplates, eq(messageTemplates.eventId, events.id))
    .orderBy(asc(events.sortOrder), asc(events.startsAt), asc(events.name));
  return rows.map(toEvent);
}

export async function getEvent(db: Db, id: string): Promise<Event> {
  const [row] = await db
    .select(selection)
    .from(events)
    .leftJoin(messageTemplates, eq(messageTemplates.eventId, events.id))
    .where(eq(events.id, id))
    .limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Acara tidak ditemukan");
  return toEvent(row);
}

function eventColumns(input: EventData) {
  return {
    slug: input.slug,
    name: input.name,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    venueName: input.venueName,
    address: input.address,
    mapsUrl: input.mapsUrl,
    notes: input.notes,
    checkinEnabled: input.checkinEnabled,
    hasRsvp: input.hasRsvp,
    sortOrder: input.sortOrder,
  };
}

async function saveTemplate(tx: Pick<Db, "insert" | "delete">, eventId: string, body: string) {
  if (!body) {
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
        .values(eventColumns(input))
        .returning({ id: events.id });
      if (!row) throw new Error("Gagal membuat acara");
      await saveTemplate(tx, row.id, input.messageTemplate);
      return row.id;
    });
    return await getEvent(db, id);
  } catch (err) {
    if (isUniqueViolation(err, "events_slug_unique")) throw slugTaken();
    throw err;
  }
}

export async function updateEvent(db: Db, id: string, input: EventData): Promise<Event> {
  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(events)
        .set(eventColumns(input))
        .where(eq(events.id, id))
        .returning({ id: events.id });
      if (updated.length === 0) throw new AppError(404, "NOT_FOUND", "Acara tidak ditemukan");
      await saveTemplate(tx, id, input.messageTemplate);
    });
    return await getEvent(db, id);
  } catch (err) {
    if (isUniqueViolation(err, "events_slug_unique")) throw slugTaken();
    throw err;
  }
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
