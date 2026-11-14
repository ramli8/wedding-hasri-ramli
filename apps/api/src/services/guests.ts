import {
  type Guest,
  type GuestBulkData,
  type GuestBulkResponse,
  type GuestData,
  type GuestDuplicatesResponse,
  type GuestListParams,
  type GuestListResponse,
  type MarkSentRequest,
  normalizeInstagram,
  normalizePhone,
  type SentVia,
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
  ne,
  or,
  sql,
} from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isUniqueViolation } from "../db/errors.js";
import { guestEvents, guestGroups, guests } from "../db/schema.js";
import { generateCode } from "../domain/guest-code.js";
import { AppError } from "../http/errors.js";
import { type Executor, lockGuestRev } from "./checkin-log.js";

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
    phone: row.phone,
    instagram: row.instagram,
    groupId: row.groupId,
    isRombongan: row.isRombongan,
    isVip: row.isVip,
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
    params.rombongan ? eq(guests.isRombongan, true) : undefined,
    like
      ? or(
          ilike(guests.displayName, like),
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
  const [group] = await db
    .select({ id: guestGroups.id })
    .from(guestGroups)
    .where(eq(guestGroups.id, input.groupId))
    .limit(1);
  if (!group) throw new AppError(400, "VALIDATION_ERROR", "Kelompok tidak ditemukan");
}

/**
 * Menyamakan undangan tamu dengan acara kelompoknya: acara kelompok yang belum ada ditambahkan,
 * acara di luar kelompok dicabut. Undangan yang tetap tidak disentuh, supaya status "terkirim"
 * tidak hilang. Mengembalikan id tamu yang undangannya berubah. Pemanggil yang menjalankannya di
 * luar perubahan baris tamu itu sendiri harus menaikkan `rev` tamu (dengan `lockGuestRev`).
 */
export async function syncGuestEvents(tx: Executor, guestIds: string[]): Promise<Set<string>> {
  if (guestIds.length === 0) return new Set();
  const removed = await tx
    .delete(guestEvents)
    .where(
      and(
        inArray(guestEvents.guestId, guestIds),
        sql`not exists (
          select 1 from guests g join group_events x on x.group_id = g.group_id
          where g.id = ${guestEvents.guestId} and x.event_id = ${guestEvents.eventId}
        )`,
      ),
    )
    .returning({ guestId: guestEvents.guestId });
  // Insert…select Drizzle menuntut semua kolom tabel, jadi bagian ini ditulis sebagai SQL.
  const added = await tx.execute<{ guest_id: string }>(sql`
    insert into guest_events (guest_id, event_id)
    select guests.id, group_events.event_id
    from guests join group_events on group_events.group_id = guests.group_id
    where ${inArray(guests.id, guestIds)}
    on conflict do nothing
    returning guest_id
  `);
  return new Set([
    ...removed.map((row) => row.guestId),
    ...Array.from(added, (row) => row.guest_id),
  ]);
}

function guestColumns(input: GuestData) {
  return {
    displayName: input.displayName,
    phone: input.phone,
    instagram: input.instagram,
    groupId: input.groupId,
    isRombongan: input.isRombongan,
    isVip: input.isVip,
    usherNote: input.usherNote,
  };
}

export async function createGuest(
  db: Db,
  input: GuestData,
  source: GuestSource = "admin",
): Promise<Guest> {
  await assertReferencesExist(db, input);

  // Tabrakan kode sangat jarang (32^6), tetapi tetap ditangani dengan mengulang.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const id = await db.transaction(async (tx) => {
        await lockGuestRev(tx);
        const [row] = await tx
          .insert(guests)
          .values({ ...guestColumns(input), code: generateCode(), source })
          .returning({ id: guests.id });
        if (!row) throw new Error("Gagal membuat tamu");
        await syncGuestEvents(tx, [row.id]);
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

  await db.transaction(async (tx) => {
    await lockGuestRev(tx);
    const updated = await tx
      .update(guests)
      .set({ ...guestColumns(input), ...guestTouch() })
      .where(and(eq(guests.id, id), isNull(guests.deletedAt)))
      .returning({ id: guests.id });
    if (updated.length === 0) throw new AppError(404, "NOT_FOUND", "Tamu tidak ditemukan");

    // Kelompok bisa berganti: undangannya ikut acara kelompok yang baru.
    await syncGuestEvents(tx, [id]);
  });
  return getGuest(db, id);
}

export async function deleteGuest(db: Db, id: string): Promise<void> {
  const deleted = await db.transaction(async (tx) => {
    await lockGuestRev(tx);
    return tx
      .update(guests)
      .set({ deletedAt: new Date(), ...guestTouch() })
      .where(and(eq(guests.id, id), isNull(guests.deletedAt)))
      .returning({ id: guests.id });
  });
  if (deleted.length === 0) throw new AppError(404, "NOT_FOUND", "Tamu tidak ditemukan");
}

export async function restoreGuest(db: Db, id: string): Promise<Guest> {
  const restored = await db.transaction(async (tx) => {
    await lockGuestRev(tx);
    return tx
      .update(guests)
      .set({ deletedAt: null, ...guestTouch() })
      .where(and(eq(guests.id, id), isNotNull(guests.deletedAt)))
      .returning({ id: guests.id });
  });
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

/**
 * Aksi massal: pindah kelompok (tamu di tempat sampah dilewati), lalu undangannya disamakan dengan
 * acara kelompok tujuan. Satu transaksi.
 */
export async function bulkUpdateGuests(db: Db, input: GuestBulkData): Promise<GuestBulkResponse> {
  const ids = [...new Set(input.ids)];
  const [group] = await db
    .select({ id: guestGroups.id })
    .from(guestGroups)
    .where(eq(guestGroups.id, input.groupId))
    .limit(1);
  if (!group) throw new AppError(404, "NOT_FOUND", "Kelompok tidak ditemukan");

  return db.transaction(async (tx) => {
    await lockGuestRev(tx);
    const updated = await tx
      .update(guests)
      .set({ groupId: input.groupId, ...guestTouch() })
      .where(and(inArray(guests.id, ids), isNull(guests.deletedAt)))
      .returning({ id: guests.id });
    await syncGuestEvents(
      tx,
      updated.map((g) => g.id),
    );
    return { updated: updated.length };
  });
}

/** Tamu aktif lain yang memakai HP atau Instagram yang sama (peringatan di formulir tamu). */
export async function findDuplicateContacts(
  db: Db,
  query: { phone?: string; instagram?: string; excludeId?: string },
): Promise<GuestDuplicatesResponse> {
  const phone = query.phone ? normalizePhone(query.phone) : null;
  const instagram = query.instagram ? normalizeInstagram(query.instagram) : null;
  if (!phone && !instagram) return { guests: [] };
  const rows = await db
    .select({ id: guests.id, displayName: guests.displayName, code: guests.code })
    .from(guests)
    .where(
      and(
        isNull(guests.deletedAt),
        query.excludeId ? ne(guests.id, query.excludeId) : undefined,
        or(
          phone ? eq(guests.phone, phone) : undefined,
          instagram ? eq(guests.instagram, instagram) : undefined,
        ),
      ),
    )
    .orderBy(asc(guests.displayName))
    .limit(20);
  return { guests: rows };
}
