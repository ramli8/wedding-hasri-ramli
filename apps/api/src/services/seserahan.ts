import {
  SESERAHAN_CATEGORY_LABEL,
  SESERAHAN_STATUS_LABEL,
  SESERAHAN_STATUSES,
  type SeserahanCategory,
  type SeserahanData,
  type SeserahanItem,
  type SeserahanStatus,
  type SeserahanSummary,
} from "@wedding/shared";
import { asc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { seserahanItems } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { safeCell } from "./guest-import.js";
import { buildXlsx } from "./xlsx-template.js";

type Row = typeof seserahanItems.$inferSelect;

const notFound = () => new AppError(404, "NOT_FOUND", "Barang tidak ditemukan");

const toItem = (row: Row): SeserahanItem => ({
  id: row.id,
  category: row.category as SeserahanCategory,
  name: row.name,
  pic: row.pic,
  price: row.price,
  status: row.status as SeserahanStatus,
  note: row.note,
  updatedAt: row.updatedAt.toISOString(),
});

const CATEGORY_ORDER: Record<string, number> = { mahar: 0, seserahan: 1, hantaran: 2 };

async function allItems(db: Db): Promise<SeserahanItem[]> {
  const rows = await db.select().from(seserahanItems).orderBy(asc(seserahanItems.createdAt));
  return rows
    .map(toItem)
    .sort((a, b) => (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9));
}

export function summarizeSeserahan(items: SeserahanItem[]): SeserahanSummary {
  const byStatus = Object.fromEntries(SESERAHAN_STATUSES.map((s) => [s, 0])) as Record<
    SeserahanStatus,
    number
  >;
  let priceTotal = 0;
  for (const item of items) {
    byStatus[item.status] += 1;
    priceTotal += item.price ?? 0;
  }
  return { count: items.length, priceTotal, byStatus };
}

export async function listSeserahan(db: Db) {
  const items = await allItems(db);
  return { items, summary: summarizeSeserahan(items) };
}

export async function createSeserahan(db: Db, input: SeserahanData) {
  const [row] = await db.insert(seserahanItems).values(input).returning();
  if (!row) throw new Error("Gagal menyimpan barang");
  return toItem(row);
}

export async function updateSeserahan(db: Db, id: string, input: Partial<SeserahanData>) {
  const [row] = await db
    .update(seserahanItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(seserahanItems.id, id))
    .returning();
  if (!row) throw notFound();
  return toItem(row);
}

export async function deleteSeserahan(db: Db, id: string) {
  const [row] = await db
    .delete(seserahanItems)
    .where(eq(seserahanItems.id, id))
    .returning({ id: seserahanItems.id });
  if (!row) throw notFound();
}

export async function exportSeserahanXlsx(db: Db): Promise<Uint8Array> {
  const items = await allItems(db);
  return buildXlsx([
    {
      name: "Seserahan",
      columns: [
        { header: "kategori", width: 12 },
        { header: "barang", width: 32 },
        { header: "penanggung_jawab", width: 18 },
        { header: "harga", width: 14, type: "number" },
        { header: "status", width: 12 },
        { header: "catatan", width: 32 },
      ],
      rows: items.map((item) => [
        SESERAHAN_CATEGORY_LABEL[item.category],
        safeCell(item.name),
        safeCell(item.pic ?? ""),
        item.price,
        SESERAHAN_STATUS_LABEL[item.status],
        safeCell(item.note ?? ""),
      ]),
    },
  ]);
}
