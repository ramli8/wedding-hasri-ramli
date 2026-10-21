import { z } from "zod";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .nullish()
    .transform((value) => value || null);

export const RECEIVED_GIFT_KINDS = ["amplop", "transfer", "barang"] as const;
export const receivedGiftKindSchema = z.enum(RECEIVED_GIFT_KINDS);
export type ReceivedGiftKind = z.infer<typeof receivedGiftKindSchema>;

export const RECEIVED_GIFT_KIND_LABEL: Record<ReceivedGiftKind, string> = {
  amplop: "Amplop (tunai)",
  transfer: "Transfer",
  barang: "Barang",
};

/** Batas wajar satu pemberian, agar salah ketik angka nol tidak lolos (Rp 10 miliar). */
export const MAX_GIFT_AMOUNT = 10_000_000_000;

/**
 * Pemberian yang diterima. Amplop dan transfer wajib bernominal; barang wajib berdeskripsi.
 * Pemberi bisa tamu terdaftar (`guestId`, nama terisi otomatis) atau diketik bebas.
 */
export const receivedGiftInputSchema = z
  .object({
    guestId: z
      .uuid()
      .nullish()
      .transform((value) => value ?? null),
    giverName: z.string().trim().max(120, "Nama pemberi maksimal 120 karakter").default(""),
    kind: receivedGiftKindSchema,
    amount: z
      .number()
      .int("Nominal harus bilangan bulat (rupiah)")
      .min(1, "Nominal minimal Rp 1")
      .max(MAX_GIFT_AMOUNT, "Nominal terlalu besar")
      .nullish()
      .transform((value) => value ?? null),
    itemDescription: optionalText(200, "Nama barang"),
    note: optionalText(500, "Catatan"),
    /** Tanggal diterima (YYYY-MM-DD); kosong = hari ini (WIB). */
    receivedOn: z.iso
      .date()
      .nullish()
      .transform((value) => value ?? null),
  })
  .superRefine((value, ctx) => {
    if (!value.guestId && !value.giverName) {
      ctx.addIssue({ code: "custom", path: ["giverName"], message: "Nama pemberi wajib diisi" });
    }
    if (value.kind === "barang") {
      if (!value.itemDescription) {
        ctx.addIssue({
          code: "custom",
          path: ["itemDescription"],
          message: "Nama barang wajib diisi",
        });
      }
    } else if (value.amount === null) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Nominal wajib diisi" });
    }
  });
export type ReceivedGiftInput = z.input<typeof receivedGiftInputSchema>;
export type ReceivedGiftData = z.output<typeof receivedGiftInputSchema>;

/** Bawaan pesan terima kasih; variabel: {panggilan} {hadiah} {mempelai}. */
export const DEFAULT_THANKS_TEMPLATE = [
  "Assalamualaikum {panggilan},",
  "",
  "Terima kasih banyak atas {hadiah} yang Anda berikan, juga doa dan kehadiran Anda di pernikahan kami.",
  "Semoga kebaikan Anda dibalas berlipat ganda.",
  "",
  "Salam hangat,",
  "{mempelai}",
].join("\n");

export const THANKS_TEMPLATE_VARIABLES = [
  { name: "{panggilan}", description: "Nama pemberi" },
  {
    name: "{hadiah}",
    description: "Jenis pemberian: amplop, transfer, atau hadiah berupa nama barang",
  },
  { name: "{mempelai}", description: "Nama kedua mempelai (dari Pengaturan)" },
] as const;

/** Frasa untuk variabel {hadiah}. */
export function giftPhrase(gift: {
  kind: ReceivedGiftKind;
  itemDescription: string | null;
}): string {
  if (gift.kind === "amplop") return "amplop";
  if (gift.kind === "transfer") return "kiriman (transfer)";
  return `hadiah berupa ${gift.itemDescription ?? "barang"}`;
}

export const receivedGiftSchema = z.object({
  id: z.uuid(),
  guestId: z.uuid().nullable(),
  /** Nomor HP tamu yang tertaut (untuk ucapan terima kasih); hanya untuk admin. */
  phone: z.string().nullable(),
  giverName: z.string(),
  kind: receivedGiftKindSchema,
  amount: z.number().nullable(),
  itemDescription: z.string().nullable(),
  note: z.string().nullable(),
  receivedOn: z.string(),
  thankedAt: z.string().nullable(),
  recordedBy: z.string().nullable(),
  createdAt: z.string(),
});
export type ReceivedGift = z.infer<typeof receivedGiftSchema>;

export const receivedGiftListQuerySchema = z.object({
  q: z.string().trim().optional(),
  kind: receivedGiftKindSchema.optional(),
  /** true: sudah dibalas ucapan terima kasih; false: belum. */
  thanked: z.stringbool().optional(),
});
export type ReceivedGiftListQuery = z.input<typeof receivedGiftListQuerySchema>;
export type ReceivedGiftListParams = z.output<typeof receivedGiftListQuerySchema>;

export const receivedGiftSummarySchema = z.object({
  count: z.number(),
  amplopTotal: z.number(),
  transferTotal: z.number(),
  barangCount: z.number(),
  notThanked: z.number(),
});
export type ReceivedGiftSummary = z.infer<typeof receivedGiftSummarySchema>;

export const receivedGiftListResponseSchema = z.object({
  items: z.array(receivedGiftSchema),
  /** Seluruh pemberian, tidak terpengaruh filter. */
  summary: receivedGiftSummarySchema,
});
export const receivedGiftResponseSchema = z.object({ gift: receivedGiftSchema });

export const receivedGiftThankedSchema = z.object({ thanked: z.boolean() });
