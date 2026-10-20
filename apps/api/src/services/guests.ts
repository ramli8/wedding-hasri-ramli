import type {
  Guest,
  GuestData,
  GuestListParams,
  GuestListResponse,
  MarkSentRequest,
  SentVia,
} from "@wedding/shared";
import {
  and,
  asc,
  count,
  eq,
  exists,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isUniqueViolation } from "../db/errors.js";
import { events, guestEvents, guestGroups, guests } from "../db/schema.js";
import { generateCode } from "../domain/guest-code.js";
import { AppError } from "../http/errors.js";

type GuestRow = typeof guests.$inferSelect;
type GuestEventRow = typeof guestEvents.$inferSelect;
export type GuestSource = Guest["source"];

/** Setiap perubahan tamu menaikkan `rev` agar perangkat bisa menarik perubahan saja (fase 3). */
export const guestTouch = () => ({
  updatedAt: new Date(),
  rev: sql<number>`nextval('guest_rev_seq')`,
});

export function toGuest(row: GuestRow, invitations: GuestEventRow[]): Guest {
  return {
    id: row.id,
    code: row.code,
    displayName: row.displayName,
    fullName: row.fullName,
    phone: row.phone,
    instagram: row.instagram,
    groupId: row.groupId,
    quota: row.quota,
    note: row.note,
    usherNote: row.usherNote,
    source: row.source as GuestSource,
    events: invitations
      .filter((e) => e.guestId === row.id)
      .map((e) => ({
        eventId: e.eventId,
        sentAt: e.sentAt?.toISOString() ?? null,
        sentVia: (e.sentVia as SentVia | null) ?? null,
      })),
    createdAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export async function listGuests(db: Db, params: GuestListParams): Promise<GuestListResponse> {
  const like = params.q ? `%${escapeLike(params.q)}%` : null;
  const where = and(
    params.deleted ? isNotNull(guests.deletedAt) : isNull(guests.deletedAt),
    params.groupId ? eq(guests.groupId, params.groupId) : undefined,
    params.onlyInstagram ? and(isNull(guests.phone), isNotNull(guests.instagram)) : undefined,
    like
      ? or(
          ilike(guests.displayName, like),
          ilike(guests.fullName, like),
          ilike(guests.phone, like),
          ilike(guests.instagram, like),
          ilike(guests.code, like),
        )
      : undefined,
    params.eventId
      ? exists(
          db
            .select({ one: sql`1` })
            .from(guestEvents)
            .where(
              and(
                eq(guestEvents.guestId, guests.id),
                eq(guestEvents.eventId, params.eventId),
                params.sent === "sent" ? isNotNull(guestEvents.sentAt) : undefined,
                params.sent === "unsent" ? isNull(guestEvents.sentAt) : undefined,
              ),
            ),
        )
      : undefined,
  );

  const [totalRow] = await db.select({ total: count() }).from(guests).where(where);
  const rows = await db
    .select()
    .from(guests)
    .where(where)
    .orderBy(asc(guests.displayName), asc(guests.id))
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize);

  const invitations = rows.length
    ? await db
        .select()
        .from(guestEvents)
        .where(
          inArray(
            guestEvents.guestId,
            rows.map((r) => r.id),
          ),
        )
    : [];

  return {
    items: rows.map((row) => toGuest(row, invitations)),
    total: totalRow?.total ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function getGuest(db: Db, id: string): Promise<Guest> {
  const [row] = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Tamu tidak ditemukan");
  const invitations = await db.select().from(guestEvents).where(eq(guestEvents.guestId, id));
  return toGuest(row, invitations);
}

async function assertReferencesExist(db: Db, input: GuestData) {
  if (input.groupId) {
    const [group] = await db
      .select({ id: guestGroups.id })
      .from(guestGroups)
      .where(eq(guestGroups.id, input.groupId))
      .limit(1);
    if (!group) throw new AppError(400, "VALIDATION_ERROR", "Kelompok tidak ditemukan");
  }
  const eventIds = [...new Set(input.eventIds)];
  if (eventIds.length) {
    const found = await db
      .select({ id: events.id })
      .from(events)
      .where(inArray(events.id, eventIds));
    if (found.length !== eventIds.length) {
      throw new AppError(400, "VALIDATION_ERROR", "Ada acara yang tidak ditemukan");
    }
  }
}

function guestColumns(input: GuestData) {
  return {
    displayName: input.displayName,
    fullName: input.fullName,
    phone: input.phone,
    instagram: input.instagram,
    groupId: input.groupId,
    quota: input.quota,
    note: input.note,
    usherNote: input.usherNote,
  };
}

export async function createGuest(
  db: Db,
  input: GuestData,
  source: GuestSource = "admin",
): Promise<Guest> {
  await assertReferencesExist(db, input);
  const eventIds = [...new Set(input.eventIds)];

  // Tabrakan kode sangat jarang (32^6), tetapi tetap ditangani dengan mengulang.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const id = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(guests)
          .values({ ...guestColumns(input), code: generateCode(), source })
          .returning({ id: guests.id });
        if (!row) throw new Error("Gagal membuat tamu");
        if (eventIds.length) {
          await tx
            .insert(guestEvents)
            .values(eventIds.map((eventId) => ({ guestId: row.id, eventId })));
        }
        return row.id;
      });
      return await getGuest(db, id);
    } catch (err) {
      if (isUniqueViolation(err, "guests_code_unique")) continue;
      throw err;
    }
  }
  throw new Error("Gagal membuat kode tamu yang unik");
}

export async function updateGuest(db: Db, id: string, input: GuestData): Promise<Guest> {
  await assertReferencesExist(db, input);
  const wanted = new Set(input.eventIds);

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(guests)
      .set({ ...guestColumns(input), ...guestTouch() })
      .where(and(eq(guests.id, id), isNull(guests.deletedAt)))
      .returning({ id: guests.id });
    if (updated.length === 0) throw new AppError(404, "NOT_FOUND", "Tamu tidak ditemukan");

    // Undangan yang dipertahankan tidak disentuh, supaya status "terkirim" tidak hilang.
    const existing = await tx.select().from(guestEvents).where(eq(guestEvents.guestId, id));
    const have = new Set(existing.map((e) => e.eventId));
    const toRemove = [...have].filter((eventId) => !wanted.has(eventId));
    const toAdd = [...wanted].filter((eventId) => !have.has(eventId));
    if (toRemove.length) {
      await tx
        .delete(guestEvents)
        .where(and(eq(guestEvents.guestId, id), inArray(guestEvents.eventId, toRemove)));
    }
    if (toAdd.length) {
      await tx.insert(guestEvents).values(toAdd.map((eventId) => ({ guestId: id, eventId })));
    }
  });
  return getGuest(db, id);
}

export async function deleteGuest(db: Db, id: string): Promise<void> {
  const deleted = await db
    .update(guests)
    .set({ deletedAt: new Date(), ...guestTouch() })
    .where(and(eq(guests.id, id), isNull(guests.deletedAt)))
    .returning({ id: guests.id });
  if (deleted.length === 0) throw new AppError(404, "NOT_FOUND", "Tamu tidak ditemukan");
}

export async function restoreGuest(db: Db, id: string): Promise<Guest> {
  const restored = await db
    .update(guests)
    .set({ deletedAt: null, ...guestTouch() })
    .where(and(eq(guests.id, id), isNotNull(guests.deletedAt)))
    .returning({ id: guests.id });
  if (restored.length === 0) throw new AppError(404, "NOT_FOUND", "Tamu tidak ditemukan");
  return getGuest(db, id);
}

export async function markSent(db: Db, id: string, req: Required<MarkSentRequest>): Promise<Guest> {
  const updated = await db
    .update(guestEvents)
    .set(req.sent ? { sentAt: new Date(), sentVia: req.via } : { sentAt: null, sentVia: null })
    .where(and(eq(guestEvents.guestId, id), eq(guestEvents.eventId, req.eventId)))
    .returning({ guestId: guestEvents.guestId });
  if (updated.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Tamu tidak diundang ke acara ini");
  }
  return getGuest(db, id);
}
