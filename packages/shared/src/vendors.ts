import { z } from "zod";
import { normalizeInstagram, normalizePhone } from "./contact.js";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .nullish()
    .transform((value) => value || null);

/** Batas wajar nilai uang (Rp 100 miliar), agar salah ketik angka nol tidak lolos. */
export const MAX_MONEY = 100_000_000_000;

const money = (label: string) =>
  z
    .number()
    .int(`${label} harus bilangan bulat (rupiah)`)
    .min(1, `${label} minimal Rp 1`)
    .max(MAX_MONEY, `${label} terlalu besar`);

const optionalMoney = (label: string) =>
  money(label)
    .nullish()
    .transform((value) => value ?? null);

// --- Kategori -------------------------------------------------------------------------------------

/** Kategori yang umum untuk pernikahan; dipakai tombol "Tambah kategori umum". */
export const COMMON_VENDOR_CATEGORIES = [
  "Gedung / Tempat",
  "Katering",
  "Dekorasi",
  "Fotografi & Video",
  "Rias & Busana",
  "MC & Hiburan",
  "Undangan & Souvenir",
  "Transportasi",
] as const;

export const vendorCategoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama kategori wajib diisi")
    .max(60, "Nama kategori maksimal 60 karakter"),
});
export type VendorCategoryInput = z.input<typeof vendorCategoryInputSchema>;

export const vendorCategorySchema = z.object({ id: z.uuid(), name: z.string() });
export type VendorCategory = z.infer<typeof vendorCategorySchema>;

// --- Vendor ---------------------------------------------------------------------------------------

export const vendorInputSchema = z.object({
  categoryId: z.uuid("Pilih kategori"),
  name: z.string().trim().min(1, "Nama vendor wajib diisi").max(120, "Nama maksimal 120 karakter"),
  contactPerson: optionalText(120, "Nama kontak"),
  phone: z
    .string()
    .trim()
    .nullish()
    .transform((value, ctx) => {
      if (!value) return null;
      const phone = normalizePhone(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Nomor HP tidak valid" });
        return z.NEVER;
      }
      return phone;
    }),
  instagram: z
    .string()
    .trim()
    .nullish()
    .transform((value, ctx) => {
      if (!value) return null;
      const username = normalizeInstagram(value);
      if (!username) {
        ctx.addIssue({ code: "custom", message: "Username Instagram tidak valid" });
        return z.NEVER;
      }
      return username;
    }),
  address: optionalText(300, "Alamat"),
  /** Harga penawaran awal, untuk membandingkan kandidat. */
  referencePrice: optionalMoney("Harga acuan"),
  /** Nilai yang disepakati; dasar status pembayaran. */
  contractAmount: optionalMoney("Nilai kontrak"),
  note: optionalText(1000, "Catatan"),
});
export type VendorInput = z.input<typeof vendorInputSchema>;
export type VendorData = z.output<typeof vendorInputSchema>;

export const PAYMENT_STATUSES = ["belum", "sebagian", "lunas"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  belum: "Belum dibayar",
  sebagian: "Sebagian",
  lunas: "Lunas",
};

/** Status dari total pembayaran terhadap nilai kontrak; null bila belum ada nilai kontrak. */
export function paymentStatus(
  contractAmount: number | null,
  paidTotal: number,
): PaymentStatus | null {
  if (contractAmount === null) return null;
  if (paidTotal >= contractAmount) return "lunas";
  return paidTotal > 0 ? "sebagian" : "belum";
}

// --- Pembayaran -----------------------------------------------------------------------------------

export const vendorPaymentInputSchema = z.object({
  /** Tanggal bayar (YYYY-MM-DD); kosong = hari ini (WIB). */
  paidOn: z.iso
    .date()
    .nullish()
    .transform((value) => value ?? null),
  amount: money("Nominal"),
  note: optionalText(300, "Catatan"),
});
export type VendorPaymentInput = z.input<typeof vendorPaymentInputSchema>;
export type VendorPaymentData = z.output<typeof vendorPaymentInputSchema>;

export const vendorPaymentSchema = z.object({
  id: z.uuid(),
  paidOn: z.string(),
  amount: z.number(),
  note: z.string().nullable(),
});
export type VendorPayment = z.infer<typeof vendorPaymentSchema>;

export const vendorSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  name: z.string(),
  contactPerson: z.string().nullable(),
  phone: z.string().nullable(),
  instagram: z.string().nullable(),
  address: z.string().nullable(),
  referencePrice: z.number().nullable(),
  contractAmount: z.number().nullable(),
  isSelected: z.boolean(),
  note: z.string().nullable(),
  payments: z.array(vendorPaymentSchema),
  paidTotal: z.number(),
  /** Null bila belum ada nilai kontrak. */
  paymentStatus: z.enum(PAYMENT_STATUSES).nullable(),
});
export type Vendor = z.infer<typeof vendorSchema>;

export const vendorSummarySchema = z.object({
  /** Vendor terpilih dan jumlah kategori. */
  selectedCount: z.number(),
  categoryCount: z.number(),
  /** Jumlah nilai kontrak vendor terpilih. */
  contractTotal: z.number(),
  /** Pembayaran ke vendor terpilih, dan sisanya (tidak negatif). */
  paidTotal: z.number(),
  remaining: z.number(),
});
export type VendorSummary = z.infer<typeof vendorSummarySchema>;

export const vendorOverviewSchema = z.object({
  categories: z.array(vendorCategorySchema),
  vendors: z.array(vendorSchema),
  summary: vendorSummarySchema,
});
export type VendorOverview = z.infer<typeof vendorOverviewSchema>;

export const vendorResponseSchema = z.object({ vendor: vendorSchema });
export const vendorCategoryResponseSchema = z.object({ category: vendorCategorySchema });
export const vendorSelectSchema = z.object({ selected: z.boolean() });
