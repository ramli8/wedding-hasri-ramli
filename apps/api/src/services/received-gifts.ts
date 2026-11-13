import {
  RECEIVED_GIFT_KIND_LABEL,
  type ReceivedGift,
  type ReceivedGiftData,
  type ReceivedGiftKind,
  type ReceivedGiftListParams,
  type ReceivedGiftSummary,
} from "@wedding/shared";
import { stringify } from "csv-stringify/sync";
import { and, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { admins, guests, receivedGifts, thanksTemplate } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { safeCell } from "./guest-import.js";
import { buildXlsx } from "./xlsx-template.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
export const todayWib = () => new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);

const notFound = () => new AppError(404, "NOT_FOUND", "Catatan hadiah tidak ditemukan");

type Row = {
  gift: typeof receivedGifts.$inferSelect;
  recordedBy: string | null;
  phone: string | null;
  instagram: string | null;
};

const toGift = ({ gift, recordedBy, phone, instagram }: Row): ReceivedGift => ({
  id: gift.id,
  guestId: gift.guestId,
  // HP tamu tertaut lebih diutamakan; nomor yang diisi pada catatan dipakai bila tidak ada.
  phone: phone ?? gift.phone,
  giverPhone: gift.phone,
  instagram: instagram ?? gift.instagram,
  giverInstagram: gift.instagram,
  giverName: gift.giverName,
  kind: gift.kind as ReceivedGiftKind,
  amount: gift.amount,
  itemDescription: gift.itemDescription,
  note: gift.note,
  receivedOn: gift.receivedOn,
  thankedAt: gift.thankedAt?.toISOString() ?? null,
  recordedBy,
  createdAt: gift.createdAt.toISOString(),
});

const selectGifts = (db: Db) =>
  db
    .select({
      gift: receivedGifts,
      recordedBy: admins.name,
      phone: guests.phone,
      instagram: guests.instagram,
    })
    .from(receivedGifts)
    .leftJoin(admins, eq(admins.id, receivedGifts.recordedBy))
    .leftJoin(guests, eq(guests.id, receivedGifts.guestId));

async function queryGifts(db: Db, query: ReceivedGiftListParams) {
  const term = query.q?.trim();
  const rows = await selectGifts(db)
    .where(
      and(
        query.kind ? eq(receivedGifts.kind, query.kind) : undefined,
        query.thanked === undefined
          ? undefined
          : query.thanked
            ? isNotNull(receivedGifts.thankedAt)
            : isNull(receivedGifts.thankedAt),
        term
          ? or(
              ilike(receivedGifts.giverName, `%${term}%`),
              ilike(receivedGifts.itemDescription, `%${term}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(receivedGifts.receivedOn), desc(receivedGifts.createdAt), desc(receivedGifts.id));
  return rows.map(toGift);
}

export async function listReceivedGifts(db: Db, query: ReceivedGiftListParams) {
  return { items: await queryGifts(db, query), summary: await receivedGiftSummary(db) };
}

const CSV_COLUMNS = [
  "tanggal_diterima",
  "pemberi",
  "jenis",
  "nominal",
  "barang",
  "catatan",
  "sudah_dibalas",
  "tanggal_dibalas",
  "dicatat_oleh",
];

/** Ekspor sesuai filter yang sama dengan daftar. Nominal berupa angka polos agar bisa dijumlah. */
/** Baris ekspor hadiah (dipakai CSV dan Excel). Nilai mentah; pengaman rumus per format. */
async function exportRows(db: Db, query: ReceivedGiftListParams) {
  const rows = await queryGifts(db, query);
  return rows.map((gift) => ({
    tanggal_diterima: gift.receivedOn,
    pemberi: gift.giverName,
    jenis: RECEIVED_GIFT_KIND_LABEL[gift.kind],
    nominal: gift.amount,
    barang: gift.itemDescription ?? "",
    catatan: gift.note ?? "",
    sudah_dibalas: gift.thankedAt ? "ya" : "tidak",
    tanggal_dibalas: gift.thankedAt
      ? new Date(new Date(gift.thankedAt).getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10)
      : "",
    dicatat_oleh: gift.recordedBy ?? "",
  }));
}

export async function exportReceivedGiftsCsv(
  db: Db,
  query: ReceivedGiftListParams,
): Promise<string> {
  const records = (await exportRows(db, query)).map((r) => ({
    ...r,
    pemberi: safeCell(r.pemberi),
    nominal: r.nominal ?? "",
    barang: safeCell(r.barang),
    catatan: safeCell(r.catatan),
    dicatat_oleh: safeCell(r.dicatat_oleh),
  }));
  // BOM agar Excel membaca UTF-8 dengan benar.
  return `\ufeff${stringify(records, { header: true, columns: CSV_COLUMNS })}`;
}

/** Ekspor hadiah sebagai Excel: nominal berupa angka (bisa dijumlah), sisanya teks. */
export async function exportReceivedGiftsXlsx(
  db: Db,
  query: ReceivedGiftListParams,
): Promise<Uint8Array> {
  const rows = await exportRows(db, query);
  const widths: Record<string, number> = { pemberi: 28, barang: 24, catatan: 32, nominal: 14 };
  return buildXlsx([
    {
      name: "Hadiah",
      columns: CSV_COLUMNS.map((header) => ({
        header,
        width: widths[header] ?? 16,
        ...(header === "nominal" ? { type: "number" as const } : {}),
      })),
      rows: rows.map((r) => CSV_COLUMNS.map((c) => r[c as keyof typeof r] ?? "")),
    },
  ]);
}

export async function receivedGiftSummary(db: Db): Promise<ReceivedGiftSummary> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      amplopTotal: sql<number>`coalesce(sum(${receivedGifts.amount}) filter (where ${receivedGifts.kind} = 'amplop'), 0)::float8`,
      transferTotal: sql<number>`coalesce(sum(${receivedGifts.amount}) filter (where ${receivedGifts.kind} = 'transfer'), 0)::float8`,
      barangCount: sql<number>`count(*) filter (where ${receivedGifts.kind} = 'barang')::int`,
      notThanked: sql<number>`count(*) filter (where ${receivedGifts.thankedAt} is null)::int`,
    })
    .from(receivedGifts);
  return row ?? { count: 0, amplopTotal: 0, transferTotal: 0, barangCount: 0, notThanked: 0 };
}

async function getGift(db: Db, id: string): Promise<ReceivedGift> {
  const [row] = await selectGifts(db).where(eq(receivedGifts.id, id)).limit(1);
  if (!row) throw notFound();
  return toGift(row);
}

/** Tamu terdaftar yang dipilih sebagai pemberi; namanya dipakai bila kolom nama dikosongkan. */
async function resolveGiver(db: Db, input: ReceivedGiftData) {
  if (!input.guestId) return input.giverName;
  const [guest] = await db
    .select({ displayName: guests.displayName, deletedAt: guests.deletedAt })
    .from(guests)
    .where(eq(guests.id, input.guestId))
    .limit(1);
  if (!guest || guest.deletedAt) {
    throw new AppError(400, "VALIDATION_ERROR", "Tamu tidak ditemukan");
  }
  return input.giverName || guest.displayName;
}

function values(input: ReceivedGiftData, giverName: string) {
  const isItem = input.kind === "barang";
  return {
    guestId: input.guestId,
    giverName,
    phone: input.giverPhone,
    instagram: input.giverInstagram,
    kind: input.kind,
    // Barang tidak bernominal; amplop dan transfer tidak memakai nama barang.
    amount: isItem ? null : input.amount,
    itemDescription: isItem ? input.itemDescription : null,
    note: input.note,
    receivedOn: input.receivedOn ?? todayWib(),
  };
}

export async function createReceivedGift(
  db: Db,
  adminId: string,
  input: ReceivedGiftData,
): Promise<ReceivedGift> {
  const giverName = await resolveGiver(db, input);
  const [row] = await db
    .insert(receivedGifts)
    .values({ ...values(input, giverName), recordedBy: adminId })
    .returning({ id: receivedGifts.id });
  if (!row) throw new Error("Gagal menyimpan catatan hadiah");
  return getGift(db, row.id);
}

export async function updateReceivedGift(
  db: Db,
  id: string,
  input: ReceivedGiftData,
): Promise<ReceivedGift> {
  const giverName = await resolveGiver(db, input);
  const [row] = await db
    .update(receivedGifts)
    .set(values(input, giverName))
    .where(eq(receivedGifts.id, id))
    .returning({ id: receivedGifts.id });
  if (!row) throw notFound();
  return getGift(db, id);
}

export async function setThanked(db: Db, id: string, thanked: boolean): Promise<ReceivedGift> {
  const [row] = await db
    .update(receivedGifts)
    .set({ thankedAt: thanked ? new Date() : null })
    .where(eq(receivedGifts.id, id))
    .returning({ id: receivedGifts.id });
  if (!row) throw notFound();
  return getGift(db, id);
}

export async function getThanksTemplate(db: Db): Promise<string | null> {
  const [row] = await db.select().from(thanksTemplate).limit(1);
  return row?.body ?? null;
}

/** Menyimpan pesan terima kasih; isi kosong menghapus baris sehingga kembali ke bawaan. */
export async function saveThanksTemplate(db: Db, body: string): Promise<string | null> {
  if (!body) {
    await db.delete(thanksTemplate);
    return null;
  }
  await db
    .insert(thanksTemplate)
    .values({ id: 1, body })
    .onConflictDoUpdate({ target: thanksTemplate.id, set: { body } });
  return body;
}

export async function deleteReceivedGift(db: Db, id: string): Promise<void> {
  const [row] = await db
    .delete(receivedGifts)
    .where(eq(receivedGifts.id, id))
    .returning({ id: receivedGifts.id });
  if (!row) throw notFound();
}
