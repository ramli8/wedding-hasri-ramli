import { z } from "zod";

/**
 * Meja buwuh (nyumbang/gawan): petugas di meja penerima mencatat setiap pemberi, berupa uang
 * dan/atau barang (beras, gula, mie, …), beserta nama dan alamatnya. Catatan dibuat di HP meja
 * (perangkat jenis `buwuh`) dan tetap tersimpan saat offline; terkirim ke server saat online.
 * Lihat docs/rancangan.md §14 "Meja buwuh".
 */

/** Batas wajar satu pemberian uang, agar salah ketik angka nol tidak lolos. */
export const MAX_BUWUH_AMOUNT = 1_000_000_000;
/** Batas jumlah satu barang (mis. 9999 kg). */
export const MAX_BUWUH_QUANTITY = 9999;
export const MAX_BUWUH_ITEMS = 30;
export const MAX_BUWUH_CATALOG = 60;

/**
 * Barang pilihan di meja buwuh, sesuai kebiasaan di desa mempelai (barang lain lewat "Lainnya").
 * Dipakai selama admin belum mengatur daftarnya sendiri.
 */
export const DEFAULT_BUWUH_CATALOG: readonly BuwuhCatalogItem[] = [
  { name: "Gula", unit: "kg" },
  { name: "Beras", unit: "kg" },
  { name: "Mi kuning kecil", unit: "bungkus" },
  { name: "Mi kuning besar", unit: "bungkus" },
  { name: "Bihun", unit: "bungkus" },
];

const itemName = z
  .string()
  .trim()
  .min(1, "Nama barang wajib diisi")
  .max(60, "Nama barang maksimal 60 karakter");
const unitField = z.string().trim().max(20, "Satuan maksimal 20 karakter").default("");

export const buwuhCatalogItemSchema = z.object({ name: itemName, unit: unitField });
export type BuwuhCatalogItem = z.output<typeof buwuhCatalogItemSchema>;

/** Daftar barang pilihan di meja buwuh; urutan = urutan tombol. Nama tidak boleh kembar. */
export const buwuhCatalogSchema = z.object({
  items: z
    .array(buwuhCatalogItemSchema)
    .max(MAX_BUWUH_CATALOG, `Maksimal ${MAX_BUWUH_CATALOG} barang`)
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        const key = item.name.toLowerCase();
        if (seen.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "name"],
            message: `“${item.name}” sudah ada di daftar`,
          });
        }
        seen.add(key);
      });
    }),
});
export type BuwuhCatalogInput = z.input<typeof buwuhCatalogSchema>;
export const buwuhCatalogResponseSchema = z.object({ items: z.array(buwuhCatalogItemSchema) });
export type BuwuhCatalogResponse = z.infer<typeof buwuhCatalogResponseSchema>;

export const MAX_BUWUH_ADDRESSES = 60;

/**
 * Daftar alamat (dusun/RT/desa) yang tampil sebagai pilihan di HP meja; diatur admin, urutan =
 * urutan tombol. Alamat di luar daftar tetap bisa diketik lewat "Lainnya".
 */
export const buwuhAddressListSchema = z.object({
  items: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Alamat tidak boleh kosong")
        .max(200, "Alamat maksimal 200 karakter"),
    )
    .max(MAX_BUWUH_ADDRESSES, `Maksimal ${MAX_BUWUH_ADDRESSES} alamat`)
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        const key = item.toLowerCase();
        if (seen.has(key)) {
          ctx.addIssue({ code: "custom", path: [index], message: `“${item}” sudah ada di daftar` });
        }
        seen.add(key);
      });
    }),
});
export type BuwuhAddressListInput = z.input<typeof buwuhAddressListSchema>;
export const buwuhAddressListResponseSchema = z.object({ items: z.array(z.string()) });

export const buwuhItemSchema = z.object({
  name: itemName,
  /** Boleh pecahan (0,5 kg); dibulatkan dua angka di belakang koma. */
  quantity: z
    .number()
    .positive("Jumlah harus lebih dari 0")
    .max(MAX_BUWUH_QUANTITY, "Jumlah terlalu besar")
    .transform((value) => Math.round(value * 100) / 100),
  unit: unitField,
});
export type BuwuhItem = z.output<typeof buwuhItemSchema>;

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .nullish()
    .transform((value) => value || null);

/**
 * Isi satu catatan buwuh: wajib ada nama, dan uang ATAU barang (minimal satu), tidak keduanya:
 * di desa satu pemberi selalu memberi salah satu.
 */
const buwuhFields = {
  name: z.string().trim().min(1, "Nama pemberi wajib diisi").max(120, "Nama maksimal 120 karakter"),
  address: optionalText(200, "Alamat"),
  amount: z
    .number()
    .int("Uang harus bilangan bulat (rupiah)")
    .min(0)
    .max(MAX_BUWUH_AMOUNT, "Uang terlalu besar")
    .nullish()
    .transform((value) => value ?? 0),
  items: z
    .array(buwuhItemSchema)
    .max(MAX_BUWUH_ITEMS, `Maksimal ${MAX_BUWUH_ITEMS} barang`)
    .default([]),
};

const requireGift = (value: { amount: number; items: unknown[] }, ctx: z.RefinementCtx) => {
  const hasMoney = value.amount > 0;
  const hasGoods = value.items.length > 0;
  if (!hasMoney && !hasGoods) {
    ctx.addIssue({ code: "custom", path: ["amount"], message: "Isi uang atau pilih barang" });
  } else if (hasMoney && hasGoods) {
    ctx.addIssue({
      code: "custom",
      path: ["items"],
      message: "Pilih uang atau barang saja, tidak keduanya",
    });
  }
};

/** Jenis pemberian satu catatan (uang dan barang tidak pernah bersamaan). */
export type BuwuhKind = "uang" | "barang";
export const buwuhKind = (entry: { amount: number; items: unknown[] }): BuwuhKind =>
  entry.items.length > 0 ? "barang" : "uang";

/** Formulir admin (tambah/ubah). */
export const buwuhInputSchema = z
  .object({ ...buwuhFields, note: optionalText(500, "Catatan") })
  .superRefine(requireGift);
export type BuwuhInput = z.input<typeof buwuhInputSchema>;
export type BuwuhData = z.output<typeof buwuhInputSchema>;

/**
 * Catatan dari HP meja. `id` dibuat perangkat (uuid v7) sehingga kirim ulang tidak menggandakan.
 * `version` naik setiap kali petugas mengubah atau menghapus catatan di HP; server hanya menerima
 * versi yang lebih baru dari yang tersimpan. Catatan terhapus tetap dikirim dengan `deleted: true`.
 */
export const buwuhDeviceEntrySchema = z.discriminatedUnion("deleted", [
  z.object({
    id: z.uuid(),
    version: z.number().int().min(1),
    recordedAt: z.iso.datetime(),
    deleted: z.literal(true),
  }),
  z
    .object({
      id: z.uuid(),
      version: z.number().int().min(1),
      /** Jam perangkat saat catatan pertama dibuat. */
      recordedAt: z.iso.datetime(),
      deleted: z.literal(false),
      ...buwuhFields,
    })
    .superRefine(requireGift),
]);
export type BuwuhDeviceEntry = z.input<typeof buwuhDeviceEntrySchema>;

export const buwuhPushRequestSchema = z.object({
  entries: z.array(buwuhDeviceEntrySchema).max(200),
  /** Jumlah catatan yang belum terkirim di HP (sebelum kiriman ini), untuk halaman Perangkat. */
  pending: z.number().int().min(0).default(0),
  appVersion: z.string().max(40).optional(),
});
export type BuwuhPushRequest = z.input<typeof buwuhPushRequestSchema>;

export const buwuhPushResponseSchema = z.object({
  /**
   * Versi yang kini dianggap tersimpan per catatan. Catatan yang sudah diubah admin dikunci: versi
   * kiriman tetap diakui agar HP berhenti mengirim ulang, tetapi isinya tidak menimpa.
   */
  accepted: z.array(z.object({ id: z.uuid(), version: z.number() })),
});
export type BuwuhPushResponse = z.infer<typeof buwuhPushResponseSchema>;

/** Pengaturan untuk HP meja: daftar barang dan alamat pilihan. */
export const buwuhDeviceConfigSchema = z.object({
  catalog: z.array(buwuhCatalogItemSchema),
  /** Tidak ada di server lama: dianggap kosong. */
  addresses: z.array(z.string()).default([]),
});
export type BuwuhDeviceConfig = z.infer<typeof buwuhDeviceConfigSchema>;

// --- Admin ---------------------------------------------------------------------------------------

export const buwuhEntrySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullable(),
  amount: z.number(),
  items: z.array(buwuhItemSchema),
  note: z.string().nullable(),
  /** Nama HP meja yang mencatat; null = dicatat admin atau perangkatnya sudah dihapus. */
  deviceName: z.string().nullable(),
  recordedAt: z.string(),
  /** Terisi bila admin pernah mengubah catatan ini (HP meja tidak bisa lagi menimpanya). */
  editedAt: z.string().nullable(),
});
export type BuwuhEntry = z.infer<typeof buwuhEntrySchema>;

export const buwuhGoodsTotalSchema = z.object({
  name: z.string(),
  unit: z.string(),
  quantity: z.number(),
  /** Banyaknya pemberi barang ini. */
  givers: z.number(),
});
export type BuwuhGoodsTotal = z.infer<typeof buwuhGoodsTotalSchema>;

export const buwuhSummarySchema = z.object({
  count: z.number(),
  amountTotal: z.number(),
  /** Total per barang+satuan, yang terbanyak pemberinya lebih dulu. */
  goods: z.array(buwuhGoodsTotalSchema),
});
export type BuwuhSummary = z.infer<typeof buwuhSummarySchema>;

export const buwuhListResponseSchema = z.object({
  items: z.array(buwuhEntrySchema),
  summary: buwuhSummarySchema,
});
export type BuwuhListResponse = z.infer<typeof buwuhListResponseSchema>;
export const buwuhResponseSchema = z.object({ entry: buwuhEntrySchema });

/** "Beras 5 kg, Gula pasir 2 kg" */
export function formatBuwuhItems(items: readonly BuwuhItem[]): string {
  return items
    .map((item) => {
      const qty = item.quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 });
      return `${item.name} ${qty}${item.unit ? ` ${item.unit}` : ""}`;
    })
    .join(", ");
}
