import { randomBytes } from "node:crypto";
import {
  type PublicRundown,
  type RundownItem,
  type RundownItemData,
  shiftTime,
} from "@wedding/shared";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { events, rundownConfig, rundownItems, vendors } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { coupleName, getSettings } from "./settings.js";

type Row = typeof rundownItems.$inferSelect;

const notFound = () => new AppError(404, "NOT_FOUND", "Kegiatan rundown tidak ditemukan");
const newToken = () => randomBytes(16).toString("base64url");

const toItem = (row: Row): RundownItem => ({
  id: row.id,
  eventId: row.eventId,
  time: row.time,
  durationMin: row.durationMin,
  title: row.title,
  pic: row.pic,
  vendorId: row.vendorId,
  note: row.note,
});

/** Token tautan baca-saja; dibuat saat pertama dibutuhkan. */
export async function getRundownToken(db: Db): Promise<string> {
  const [row] = await db.select().from(rundownConfig).where(eq(rundownConfig.id, 1));
  if (row) return row.token;
  const token = newToken();
  await db.insert(rundownConfig).values({ id: 1, token }).onConflictDoNothing();
  const [saved] = await db.select().from(rundownConfig).where(eq(rundownConfig.id, 1));
  return saved?.token ?? token;
}

export async function resetRundownToken(db: Db): Promise<string> {
  const token = newToken();
  await db
    .insert(rundownConfig)
    .values({ id: 1, token })
    .onConflictDoUpdate({ target: rundownConfig.id, set: { token } });
  return token;
}

export async function listRundown(db: Db) {
  const rows = await db
    .select()
    .from(rundownItems)
    .orderBy(asc(rundownItems.time), asc(rundownItems.createdAt));
  return { items: rows.map(toItem), token: await getRundownToken(db) };
}

async function assertRefs(db: Db, input: RundownItemData) {
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, input.eventId));
  if (!event) throw new AppError(400, "VALIDATION_ERROR", "Acara tidak ditemukan");
  if (input.vendorId) {
    const [vendor] = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(eq(vendors.id, input.vendorId));
    if (!vendor) throw new AppError(400, "VALIDATION_ERROR", "Vendor tidak ditemukan");
  }
}

export async function createRundownItem(db: Db, input: RundownItemData) {
  await assertRefs(db, input);
  const [row] = await db.insert(rundownItems).values(input).returning();
  if (!row) throw new Error("Gagal menyimpan kegiatan");
  return toItem(row);
}

export async function updateRundownItem(db: Db, id: string, input: RundownItemData) {
  await assertRefs(db, input);
  const [row] = await db
    .update(rundownItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(rundownItems.id, id))
    .returning();
  if (!row) throw notFound();
  return toItem(row);
}

export async function deleteRundownItem(db: Db, id: string) {
  const [row] = await db
    .delete(rundownItems)
    .where(eq(rundownItems.id, id))
    .returning({ id: rundownItems.id });
  if (!row) throw notFound();
}

/** Menggeser jam kegiatan ini dan semua yang dimulai pada/sesudahnya di acara yang sama. */
export async function shiftRundown(db: Db, id: string, minutes: number) {
  return db.transaction(async (tx) => {
    const [from] = await tx.select().from(rundownItems).where(eq(rundownItems.id, id));
    if (!from) throw notFound();
    const later = await tx
      .select()
      .from(rundownItems)
      .where(and(eq(rundownItems.eventId, from.eventId), gte(rundownItems.time, from.time)))
      .for("update");
    const now = new Date();
    for (const row of later) {
      await tx
        .update(rundownItems)
        .set({ time: shiftTime(row.time, minutes), updatedAt: now })
        .where(eq(rundownItems.id, row.id));
    }
    return later.length;
  });
}

/** Rundown semua acara untuk tautan baca-saja (tanpa data tamu). */
export async function publicRundown(db: Db): Promise<PublicRundown> {
  const [eventRows, rows, settings] = await Promise.all([
    db.select().from(events).orderBy(asc(events.startsAt)),
    db.select().from(rundownItems).orderBy(asc(rundownItems.time), asc(rundownItems.createdAt)),
    getSettings(db),
  ]);
  const vendorIds = [...new Set(rows.map((r) => r.vendorId).filter((v): v is string => !!v))];
  const vendorRows = vendorIds.length
    ? await db
        .select({
          id: vendors.id,
          name: vendors.name,
          picName: vendors.picName,
          picPhone: vendors.picPhone,
        })
        .from(vendors)
        .where(inArray(vendors.id, vendorIds))
    : [];
  const vendorById = new Map(vendorRows.map((v) => [v.id, v]));
  return {
    couple: coupleName(settings),
    events: eventRows
      .map((event) => ({
        id: event.id,
        name: event.name,
        startsAt: event.startsAt?.toISOString() ?? null,
        venueName: event.venueName,
        items: rows
          .filter((r) => r.eventId === event.id)
          .map((r) => {
            const vendor = r.vendorId ? vendorById.get(r.vendorId) : undefined;
            return {
              id: r.id,
              time: r.time,
              durationMin: r.durationMin,
              title: r.title,
              pic: r.pic,
              note: r.note,
              vendor: vendor
                ? { name: vendor.name, picName: vendor.picName, picPhone: vendor.picPhone }
                : null,
            };
          }),
      }))
      .filter((event) => event.items.length > 0),
  };
}

export async function rundownTokenMatches(db: Db, token: string) {
  const [row] = await db.select().from(rundownConfig).where(eq(rundownConfig.id, 1));
  return !!row && row.token === token;
}
