import { z } from "zod";

/**
 * Catatan mahar, seserahan, dan hantaran: barang apa, siapa yang mengurus, harganya, dan sudah
 * sampai mana (direncanakan → dibeli → dikemas → diserahkan). Mahar = kewajiban agama, seserahan
 * dan hantaran = adat.
 */
export const SESERAHAN_CATEGORIES = ["mahar", "seserahan", "hantaran"] as const;
export const seserahanCategorySchema = z.enum(SESERAHAN_CATEGORIES);
export type SeserahanCategory = z.infer<typeof seserahanCategorySchema>;

export const SESERAHAN_CATEGORY_LABEL: Record<SeserahanCategory, string> = {
  mahar: "Mahar",
  seserahan: "Seserahan",
  hantaran: "Hantaran",
};

export const SESERAHAN_STATUSES = ["rencana", "dibeli", "dikemas", "diserahkan"] as const;
export const seserahanStatusSchema = z.enum(SESERAHAN_STATUSES);
export type SeserahanStatus = z.infer<typeof seserahanStatusSchema>;

export const SESERAHAN_STATUS_LABEL: Record<SeserahanStatus, string> = {
  rencana: "Rencana",
  dibeli: "Dibeli",
  dikemas: "Dikemas",
  diserahkan: "Diserahkan",
};

/** Batas wajar harga satu barang, agar salah ketik angka nol tidak lolos. */
export const MAX_SESERAHAN_PRICE = 10_000_000_000;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .nullish()
    .transform((value) => value || null);

export const seserahanInputSchema = z.object({
  category: seserahanCategorySchema,
  name: z
    .string()
    .trim()
    .min(1, "Nama barang wajib diisi")
    .max(120, "Nama barang maksimal 120 karakter"),
  /** Penanggung jawab (diketik bebas, mis. "Ibu", "Mas Andi"). */
  pic: optionalText(60, "Penanggung jawab"),
  price: z
    .number()
    .int("Harga harus bilangan bulat (rupiah)")
    .min(0)
    .max(MAX_SESERAHAN_PRICE, "Harga terlalu besar")
    .nullish()
    .transform((value) => value ?? null),
  status: seserahanStatusSchema.default("rencana"),
  note: optionalText(500, "Catatan"),
});
export type SeserahanInput = z.input<typeof seserahanInputSchema>;
export type SeserahanData = z.output<typeof seserahanInputSchema>;

export const seserahanStatusInputSchema = z.object({ status: seserahanStatusSchema });

export const seserahanItemSchema = z.object({
  id: z.uuid(),
  category: seserahanCategorySchema,
  name: z.string(),
  pic: z.string().nullable(),
  price: z.number().nullable(),
  status: seserahanStatusSchema,
  note: z.string().nullable(),
  updatedAt: z.string(),
});
export type SeserahanItem = z.infer<typeof seserahanItemSchema>;

export const seserahanSummarySchema = z.object({
  count: z.number(),
  priceTotal: z.number(),
  /** Banyak barang per status (semua kategori). */
  byStatus: z.record(seserahanStatusSchema, z.number()),
});
export type SeserahanSummary = z.infer<typeof seserahanSummarySchema>;

export const seserahanListResponseSchema = z.object({
  items: z.array(seserahanItemSchema),
  summary: seserahanSummarySchema,
});
export const seserahanResponseSchema = z.object({ item: seserahanItemSchema });
