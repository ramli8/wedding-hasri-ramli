import {
  COMMON_VENDOR_CATEGORIES,
  paymentStatus,
  type Vendor,
  type VendorCategory,
  type VendorData,
  type VendorOverview,
  type VendorPayment,
  type VendorPaymentData,
} from "@wedding/shared";
import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isUniqueViolation } from "../db/errors.js";
import { vendorCategories, vendorPayments, vendors } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { todayWib } from "./received-gifts.js";

const vendorNotFound = () => new AppError(404, "NOT_FOUND", "Vendor tidak ditemukan");
const categoryNotFound = () => new AppError(404, "NOT_FOUND", "Kategori tidak ditemukan");
const paymentNotFound = () => new AppError(404, "NOT_FOUND", "Pembayaran tidak ditemukan");
const nameTaken = () => new AppError(409, "CONFLICT", "Nama kategori sudah dipakai");

// --- Pembentuk data -------------------------------------------------------------------------------

function toVendor(row: typeof vendors.$inferSelect, payments: VendorPayment[]): Vendor {
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    contactPerson: row.contactPerson,
    phone: row.phone,
    instagram: row.instagram,
    address: row.address,
    referencePrice: row.referencePrice,
    contractAmount: row.contractAmount,
    isSelected: row.isSelected,
    note: row.note,
    payments,
    paidTotal,
    paymentStatus: paymentStatus(row.contractAmount, paidTotal),
  };
}

const toPayment = (row: typeof vendorPayments.$inferSelect): VendorPayment => ({
  id: row.id,
  paidOn: row.paidOn,
  amount: row.amount,
  note: row.note,
});

async function paymentsFor(db: Db, vendorIds: string[]) {
  const byVendor = new Map<string, VendorPayment[]>();
  if (vendorIds.length === 0) return byVendor;
  const rows = await db
    .select()
    .from(vendorPayments)
    .where(inArray(vendorPayments.vendorId, vendorIds))
    .orderBy(desc(vendorPayments.paidOn), desc(vendorPayments.createdAt), desc(vendorPayments.id));
  for (const row of rows) {
    byVendor.set(row.vendorId, [...(byVendor.get(row.vendorId) ?? []), toPayment(row)]);
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
  const contractTotal = selected.reduce((sum, v) => sum + (v.contractAmount ?? 0), 0);
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

export async function addPayment(db: Db, vendorId: string, input: VendorPaymentData) {
  await getVendor(db, vendorId);
  await db.insert(vendorPayments).values({
    vendorId,
    paidOn: input.paidOn ?? todayWib(),
    amount: input.amount,
    note: input.note,
  });
  return getVendor(db, vendorId);
}

export async function updatePayment(
  db: Db,
  vendorId: string,
  paymentId: string,
  input: VendorPaymentData,
) {
  await getVendor(db, vendorId);
  const [row] = await db
    .update(vendorPayments)
    .set({ paidOn: input.paidOn ?? todayWib(), amount: input.amount, note: input.note })
    .where(and(eq(vendorPayments.id, paymentId), eq(vendorPayments.vendorId, vendorId)))
    .returning({ id: vendorPayments.id });
  if (!row) throw paymentNotFound();
  return getVendor(db, vendorId);
}

export async function deletePayment(db: Db, vendorId: string, paymentId: string) {
  await getVendor(db, vendorId);
  const [row] = await db
    .delete(vendorPayments)
    .where(and(eq(vendorPayments.id, paymentId), eq(vendorPayments.vendorId, vendorId)))
    .returning({ id: vendorPayments.id });
  if (!row) throw paymentNotFound();
  return getVendor(db, vendorId);
}
