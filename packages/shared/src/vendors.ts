import { z } from "zod";
import { normalizeInstagram, normalizePhone } from "./contact.js";
import { mediaRefSchema } from "./media.js";

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

const phoneField = z
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
  });

export const vendorInputSchema = z.object({
  categoryId: z.uuid("Pilih kategori"),
  name: z.string().trim().min(1, "Nama vendor wajib diisi").max(120, "Nama maksimal 120 karakter"),
  /**
   * Harga dari vendor: penawaran selama masih kandidat, harga sepakat setelah dipesan. Dasar
   * perbandingan kandidat dan status pembayaran.
   */
  price: optionalMoney("Harga"),
  phone: phoneField,
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
  contactPerson: optionalText(120, "Nama kontak"),
  address: optionalText(300, "Alamat"),
  /** Batas pelunasan (YYYY-MM-DD); cukup diisi sekali, penanda jatuh tempo hilang saat lunas. */
  dueOn: z.iso
    .date()
    .nullish()
    .transform((value) => value ?? null),
  /** Hari-H: jam datang/persiapan vendor ("HH:MM", WIB). */
  arrivalTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam tidak valid")
    .nullish()
    .or(z.literal(""))
    .transform((value) => value || null),
  /** Hari-H: penanggung jawab vendor di lokasi. */
  picName: optionalText(120, "Nama PIC"),
  picPhone: phoneField,
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

/** Berapa hari ke depan sebuah batas pelunasan dianggap "segera". */
export const DUE_SOON_DAYS = 14;

export const DUE_STATES = ["terlambat", "segera"] as const;
/** Nilai yang sama untuk z.enum di skema lain (tuple harus literal). */
export const dueStateSchemaValues = DUE_STATES;
export type DueState = (typeof DUE_STATES)[number];

/**
 * Keadaan batas pelunasan: hanya untuk vendor dipesan yang belum lunas dan punya tanggal. `today`
 * dan `dueOn` berupa YYYY-MM-DD, jadi membandingkan teksnya sudah urut menurut tanggal.
 */
export function dueState(
  input: { dueOn: string | null; isSelected: boolean; status: PaymentStatus | null },
  today: string,
): DueState | null {
  if (!input.dueOn || !input.isSelected || input.status === "lunas") return null;
  if (input.dueOn < today) return "terlambat";
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + DUE_SOON_DAYS);
  return input.dueOn <= limit.toISOString().slice(0, 10) ? "segera" : null;
}

/** Status dari total pembayaran terhadap harga; null bila harga belum diisi. */
export function paymentStatus(price: number | null, paidTotal: number): PaymentStatus | null {
  if (price === null) return null;
  if (paidTotal >= price) return "lunas";
  return paidTotal > 0 ? "sebagian" : "belum";
}

// --- Pembayaran -----------------------------------------------------------------------------------

export const VENDOR_PAYMENT_KINDS = ["dp", "cicilan", "pelunasan"] as const;
export const vendorPaymentKindSchema = z.enum(VENDOR_PAYMENT_KINDS);
export type VendorPaymentKind = z.infer<typeof vendorPaymentKindSchema>;
export const VENDOR_PAYMENT_KIND_LABEL: Record<VendorPaymentKind, string> = {
  dp: "DP",
  cicilan: "Cicilan",
  pelunasan: "Pelunasan",
};

/** Jenis pembayaran yang paling mungkin berikutnya: DP dulu, lalu cicilan. */
export function nextPaymentKind(paymentCount: number): VendorPaymentKind {
  return paymentCount === 0 ? "dp" : "cicilan";
}

export const vendorPaymentInputSchema = z.object({
  kind: vendorPaymentKindSchema.default("cicilan"),
  /** Tanggal bayar (YYYY-MM-DD); kosong = hari ini (WIB). */
  paidOn: z.iso
    .date()
    .nullish()
    .transform((value) => value ?? null),
  amount: money("Nominal"),
  note: optionalText(300, "Catatan"),
  /** Foto bukti bayar (kuitansi atau bukti transfer), opsional. */
  proofMediaId: z
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
});
export type VendorPaymentInput = z.input<typeof vendorPaymentInputSchema>;
export type VendorPaymentData = z.output<typeof vendorPaymentInputSchema>;

export const vendorPaymentSchema = z.object({
  id: z.uuid(),
  kind: vendorPaymentKindSchema,
  paidOn: z.string(),
  amount: z.number(),
  note: z.string().nullable(),
  proof: mediaRefSchema.nullable(),
});
export type VendorPayment = z.infer<typeof vendorPaymentSchema>;

export const vendorSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  name: z.string(),
  price: z.number().nullable(),
  phone: z.string().nullable(),
  instagram: z.string().nullable(),
  contactPerson: z.string().nullable(),
  address: z.string().nullable(),
  /** Dipesan (satu per kategori); selain itu masih kandidat. */
  isSelected: z.boolean(),
  dueOn: z.string().nullable(),
  arrivalTime: z.string().nullable(),
  picName: z.string().nullable(),
  picPhone: z.string().nullable(),
  note: z.string().nullable(),
  payments: z.array(vendorPaymentSchema),
  paidTotal: z.number(),
  /** Sisa harga yang belum dibayar (tidak negatif); null bila harga belum diisi. */
  remaining: z.number().nullable(),
  /** Null bila harga belum diisi. */
  paymentStatus: z.enum(PAYMENT_STATUSES).nullable(),
  /** Terlambat / segera lewat batas pelunasan; dihitung server, kosong bila tidak relevan. */
  dueState: z.enum(DUE_STATES).nullable(),
});
export type Vendor = z.infer<typeof vendorSchema>;

export const vendorSummarySchema = z.object({
  /** Kategori yang sudah punya vendor dipesan, dan jumlah kategori. */
  selectedCount: z.number(),
  categoryCount: z.number(),
  /** Jumlah harga vendor dipesan. */
  contractTotal: z.number(),
  /** Pembayaran ke vendor dipesan, dan sisanya (tidak negatif). */
  paidTotal: z.number(),
  remaining: z.number(),
  /** Vendor dipesan yang terlambat atau segera lewat batas pelunasan. */
  overdueCount: z.number(),
  dueSoonCount: z.number(),
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
