import {
  COMMON_VENDOR_CATEGORIES,
  dueState,
  mediaUrl,
  paymentStatus,
  VENDOR_PAYMENT_KIND_LABEL,
  type Vendor,
  type VendorCategory,
  type VendorData,
  type VendorOverview,
  type VendorPayment,
  type VendorPaymentData,
  type VendorPaymentKind,
} from "@wedding/shared";
import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isUniqueViolation } from "../db/errors.js";
import { media, vendorCategories, vendorPayments, vendors } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { safeCell } from "./guest-import.js";
import { discardMedia, isMediaReferenced } from "./media.js";
import { todayWib } from "./received-gifts.js";
import { buildXlsx } from "./xlsx-template.js";

const vendorNotFound = () => new AppError(404, "NOT_FOUND", "Vendor tidak ditemukan");
const categoryNotFound = () => new AppError(404, "NOT_FOUND", "Kategori tidak ditemukan");
const paymentNotFound = () => new AppError(404, "NOT_FOUND", "Pembayaran tidak ditemukan");
const nameTaken = () => new AppError(409, "CONFLICT", "Nama kategori sudah dipakai");

// --- Pembentuk data -------------------------------------------------------------------------------

function toVendor(row: typeof vendors.$inferSelect, payments: VendorPayment[]): Vendor {
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const status = paymentStatus(row.price, paidTotal);
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    price: row.price,
    phone: row.phone,
    instagram: row.instagram,
    contactPerson: row.contactPerson,
    address: row.address,
    isSelected: row.isSelected,
    dueOn: row.dueOn,
    arrivalTime: row.arrivalTime,
    picName: row.picName,
    picPhone: row.picPhone,
    note: row.note,
    payments,
    paidTotal,
    remaining: row.price === null ? null : Math.max(0, row.price - paidTotal),
    paymentStatus: status,
    dueState: dueState({ dueOn: row.dueOn, isSelected: row.isSelected, status }, todayWib()),
  };
}

type PaymentRow = {
  payment: typeof vendorPayments.$inferSelect;
  proof: { id: string; width: number; height: number } | null;
};

const toPayment = ({ payment, proof }: PaymentRow): VendorPayment => ({
  id: payment.id,
  kind: payment.kind as VendorPaymentKind,
  paidOn: payment.paidOn,
  amount: payment.amount,
  note: payment.note,
  proof: proof
    ? {
        id: proof.id,
        width: proof.width,
        height: proof.height,
        large: mediaUrl(proof.id, "large"),
        thumb: mediaUrl(proof.id, "thumb"),
      }
    : null,
});

async function paymentsFor(db: Db, vendorIds: string[]) {
  const byVendor = new Map<string, VendorPayment[]>();
  if (vendorIds.length === 0) return byVendor;
  const rows = await db
    .select({
      payment: vendorPayments,
      proof: { id: media.id, width: media.width, height: media.height },
    })
    .from(vendorPayments)
    .leftJoin(media, eq(media.id, vendorPayments.proofMediaId))
    .where(inArray(vendorPayments.vendorId, vendorIds))
    .orderBy(desc(vendorPayments.paidOn), desc(vendorPayments.createdAt), desc(vendorPayments.id));
  for (const row of rows) {
    const vendorId = row.payment.vendorId;
    byVendor.set(vendorId, [...(byVendor.get(vendorId) ?? []), toPayment(row)]);
  }
  return byVendor;
}

export async function getVendor(db: Db, id: string): Promise<Vendor> {
  const [row] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
    .limit(1);
  if (!row) throw vendorNotFound();
  return toVendor(row, (await paymentsFor(db, [id])).get(id) ?? []);
}

export async function getOverview(db: Db): Promise<VendorOverview> {
  const categoryRows = await db
    .select()
    .from(vendorCategories)
    .orderBy(asc(vendorCategories.sortOrder), asc(vendorCategories.name));
  const vendorRows = await db
    .select()
    .from(vendors)
    .where(isNull(vendors.deletedAt))
    .orderBy(asc(vendors.name), asc(vendors.id));
  const payments = await paymentsFor(
    db,
    vendorRows.map((v) => v.id),
  );
  const list = vendorRows.map((row) => toVendor(row, payments.get(row.id) ?? []));

  const selected = list.filter((v) => v.isSelected);
  const contractTotal = selected.reduce((sum, v) => sum + (v.price ?? 0), 0);
  const paidTotal = selected.reduce((sum, v) => sum + v.paidTotal, 0);
  return {
    categories: categoryRows.map((c) => ({ id: c.id, name: c.name })),
    vendors: list,
    summary: {
      selectedCount: selected.length,
      categoryCount: categoryRows.length,
      contractTotal,
      paidTotal,
      remaining: Math.max(0, contractTotal - paidTotal),
      overdueCount: list.filter((v) => v.dueState === "terlambat").length,
      dueSoonCount: list.filter((v) => v.dueState === "segera").length,
    },
  };
}

// --- Kategori -------------------------------------------------------------------------------------

const nextCategoryOrder = sql`(select coalesce(max(${vendorCategories.sortOrder}), 0) + 1 from ${vendorCategories})`;

export async function createCategory(db: Db, name: string): Promise<VendorCategory> {
  try {
    const [row] = await db
      .insert(vendorCategories)
      .values({ name, sortOrder: nextCategoryOrder })
      .returning();
    if (!row) throw new Error("Gagal membuat kategori");
    return { id: row.id, name: row.name };
  } catch (err) {
    if (isUniqueViolation(err)) throw nameTaken();
    throw err;
  }
}

export async function renameCategory(db: Db, id: string, name: string): Promise<VendorCategory> {
  try {
    const [row] = await db
      .update(vendorCategories)
      .set({ name })
      .where(eq(vendorCategories.id, id))
      .returning();
    if (!row) throw categoryNotFound();
    return { id: row.id, name: row.name };
  } catch (err) {
    if (isUniqueViolation(err)) throw nameTaken();
    throw err;
  }
}

/** Kategori hanya bisa dihapus bila tidak ada vendor aktif di dalamnya. */
export async function deleteCategory(db: Db, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [active] = await tx
      .select({ id: vendors.id })
      .from(vendors)
      .where(and(eq(vendors.categoryId, id), isNull(vendors.deletedAt)))
      .limit(1);
    if (active) {
      throw new AppError(
        409,
        "CONFLICT",
        "Kategori masih berisi vendor. Hapus atau pindahkan dulu.",
      );
    }
    // Vendor yang sudah dihapus tidak tampil lagi; ikut dibersihkan agar kategori bisa dihapus.
    await tx.delete(vendors).where(eq(vendors.categoryId, id));
    const [row] = await tx
      .delete(vendorCategories)
      .where(eq(vendorCategories.id, id))
      .returning({ id: vendorCategories.id });
    if (!row) throw categoryNotFound();
  });
}

/** Menambah kategori umum yang belum ada; yang sudah ada dibiarkan. */
export async function addCommonCategories(db: Db): Promise<number> {
  const existing = new Set(
    (await db.select({ name: vendorCategories.name }).from(vendorCategories)).map((c) =>
      c.name.toLowerCase(),
    ),
  );
  let added = 0;
  for (const name of COMMON_VENDOR_CATEGORIES) {
    if (existing.has(name.toLowerCase())) continue;
    await createCategory(db, name);
    added += 1;
  }
  return added;
}

// --- Vendor ---------------------------------------------------------------------------------------

async function assertCategory(db: Db, id: string) {
  const [row] = await db
    .select({ id: vendorCategories.id })
    .from(vendorCategories)
    .where(eq(vendorCategories.id, id))
    .limit(1);
  if (!row) throw new AppError(400, "VALIDATION_ERROR", "Kategori tidak ditemukan");
}

export async function createVendor(db: Db, input: VendorData): Promise<Vendor> {
  await assertCategory(db, input.categoryId);
  const [row] = await db.insert(vendors).values(input).returning({ id: vendors.id });
  if (!row) throw new Error("Gagal menambah vendor");
  return getVendor(db, row.id);
}

export async function updateVendor(db: Db, id: string, input: VendorData): Promise<Vendor> {
  const existing = await getVendor(db, id);
  await assertCategory(db, input.categoryId);
  // Pindah kategori melepas status terpilih: kategori tujuan mungkin sudah punya pilihan.
  const moved = existing.categoryId !== input.categoryId;
  await db
    .update(vendors)
    .set({ ...input, ...(moved ? { isSelected: false } : {}) })
    .where(eq(vendors.id, id));
  return getVendor(db, id);
}

/** Vendor dihapus lunak (disembunyikan); pembayarannya ikut tak terlihat tetapi tidak dibuang. */
export async function deleteVendor(db: Db, id: string): Promise<void> {
  const [row] = await db
    .update(vendors)
    .set({ deletedAt: new Date(), isSelected: false })
    .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
    .returning({ id: vendors.id });
  if (!row) throw vendorNotFound();
}

/** Memilih vendor melepas pilihan kandidat lain di kategori yang sama (satu terpilih per kategori). */
export async function setSelected(db: Db, id: string, selected: boolean): Promise<Vendor> {
  const vendor = await getVendor(db, id);
  try {
    await db.transaction(async (tx) => {
      if (selected) {
        await tx
          .update(vendors)
          .set({ isSelected: false })
          .where(
            and(
              eq(vendors.categoryId, vendor.categoryId),
              ne(vendors.id, id),
              isNull(vendors.deletedAt),
            ),
          );
      }
      await tx.update(vendors).set({ isSelected: selected }).where(eq(vendors.id, id));
    });
  } catch (err) {
    // Dua permintaan memilih bersamaan: indeks unik menolak yang kedua.
    if (isUniqueViolation(err, "one_selected_vendor_per_category")) {
      throw new AppError(409, "CONFLICT", "Vendor lain baru saja dipilih. Muat ulang halaman.");
    }
    throw err;
  }
  return getVendor(db, id);
}

// --- Pembayaran -----------------------------------------------------------------------------------

/** Foto bukti harus sudah diunggah dan belum dipakai bagian lain (satu gambar, satu pemilik). */
async function assertProofUsable(db: Db, proofId: string | null, own: string | null) {
  if (!proofId || proofId === own) return;
  const [row] = await db.select({ id: media.id }).from(media).where(eq(media.id, proofId)).limit(1);
  if (!row)
    throw new AppError(400, "VALIDATION_ERROR", "Foto bukti tidak ditemukan. Unggah ulang.");
  if (await isMediaReferenced(db, proofId)) {
    throw new AppError(409, "CONFLICT", "Foto ini sudah dipakai di bagian lain");
  }
}

export async function addPayment(db: Db, vendorId: string, input: VendorPaymentData) {
  await getVendor(db, vendorId);
  await assertProofUsable(db, input.proofMediaId, null);
  await db.insert(vendorPayments).values({
    vendorId,
    kind: input.kind,
    paidOn: input.paidOn ?? todayWib(),
    amount: input.amount,
    note: input.note,
    proofMediaId: input.proofMediaId,
  });
  return getVendor(db, vendorId);
}

export async function updatePayment(
  db: Db,
  mediaDir: string,
  vendorId: string,
  paymentId: string,
  input: VendorPaymentData,
) {
  await getVendor(db, vendorId);
  const [existing] = await db
    .select({ proofMediaId: vendorPayments.proofMediaId })
    .from(vendorPayments)
    .where(and(eq(vendorPayments.id, paymentId), eq(vendorPayments.vendorId, vendorId)))
    .limit(1);
  if (!existing) throw paymentNotFound();
  await assertProofUsable(db, input.proofMediaId, existing.proofMediaId);
  await db
    .update(vendorPayments)
    .set({
      kind: input.kind,
      paidOn: input.paidOn ?? todayWib(),
      amount: input.amount,
      note: input.note,
      proofMediaId: input.proofMediaId,
    })
    .where(eq(vendorPayments.id, paymentId));
  // Foto lama yang diganti atau dilepas tidak dipakai lagi.
  if (existing.proofMediaId && existing.proofMediaId !== input.proofMediaId) {
    await discardMedia(db, mediaDir, existing.proofMediaId);
  }
  return getVendor(db, vendorId);
}

export async function deletePayment(db: Db, mediaDir: string, vendorId: string, paymentId: string) {
  await getVendor(db, vendorId);
  const [row] = await db
    .delete(vendorPayments)
    .where(and(eq(vendorPayments.id, paymentId), eq(vendorPayments.vendorId, vendorId)))
    .returning({ id: vendorPayments.id, proofMediaId: vendorPayments.proofMediaId });
  if (!row) throw paymentNotFound();
  await discardMedia(db, mediaDir, row.proofMediaId);
  return getVendor(db, vendorId);
}

// --- Ekspor ---------------------------------------------------------------------------------------

/** Daftar vendor (kandidat dan dipesan) dan seluruh pembayarannya, dua lembar Excel. */
export async function exportVendorsXlsx(db: Db): Promise<Uint8Array> {
  const overview = await getOverview(db);
  const categoryName = new Map(overview.categories.map((c) => [c.id, c.name]));
  const text = (value: string | null) => safeCell(value ?? "");
  const phone = (value: string | null) => (value ? `+${value}` : "");

  const vendorColumns = [
    ["kategori", 20],
    ["vendor", 28],
    ["status", 12],
    ["harga", 16],
    ["dibayar", 16],
    ["sisa", 16],
    ["batas_pelunasan", 16],
    ["hp", 18],
    ["instagram", 20],
    ["nama_kontak", 20],
    ["alamat", 30],
    ["jam_datang", 12],
    ["pic_hari_h", 20],
    ["hp_pic", 18],
    ["catatan", 32],
  ] as const;
  const money = new Set(["harga", "dibayar", "sisa"]);
  const paymentColumns = [
    ["kategori", 20],
    ["vendor", 28],
    ["jenis", 12],
    ["tanggal", 14],
    ["nominal", 16],
    ["catatan", 32],
  ] as const;

  return buildXlsx([
    {
      name: "Vendor",
      columns: vendorColumns.map(([header, width]) => ({
        header,
        width,
        ...(money.has(header) ? { type: "number" as const } : {}),
      })),
      rows: overview.vendors.map((v) => [
        text(categoryName.get(v.categoryId) ?? ""),
        text(v.name),
        v.isSelected ? "Dipesan" : "Kandidat",
        v.price,
        v.paidTotal,
        v.remaining,
        v.dueOn ?? "",
        phone(v.phone),
        v.instagram ? `@${v.instagram}` : "",
        text(v.contactPerson),
        text(v.address),
        v.arrivalTime ?? "",
        text(v.picName),
        phone(v.picPhone),
        text(v.note),
      ]),
    },
    {
      name: "Pembayaran",
      columns: paymentColumns.map(([header, width]) => ({
        header,
        width,
        ...(header === "nominal" ? { type: "number" as const } : {}),
      })),
      rows: overview.vendors.flatMap((v) =>
        v.payments.map((p) => [
          text(categoryName.get(v.categoryId) ?? ""),
          text(v.name),
          VENDOR_PAYMENT_KIND_LABEL[p.kind],
          p.paidOn,
          p.amount,
          text(p.note),
        ]),
      ),
    },
  ]);
}
