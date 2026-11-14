import { z } from "zod";

/**
 * Doorprize: hadiah undian untuk tamu yang sudah check-in. Diundi admin dari laptop yang tersambung ke
 * proyektor. Satu tamu hanya bisa menang sekali; pemenang yang tidak maju bisa "diundi ulang" (namanya
 * dicoret dan tidak ikut lagi).
 */

export const doorprizeInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama hadiah wajib diisi")
    .max(120, "Nama hadiah maksimal 120 karakter"),
  /** Banyak pemenang untuk hadiah ini. */
  quantity: z
    .number({ error: "Isi jumlah pemenang" })
    .int("Jumlah harus bilangan bulat")
    .min(1, "Minimal 1 pemenang")
    .max(500, "Maksimal 500 pemenang"),
});
export type DoorprizeInput = z.infer<typeof doorprizeInputSchema>;

export const doorprizeWinnerSchema = z.object({
  id: z.uuid(),
  guestId: z.uuid(),
  guestName: z.string(),
  groupName: z.string().nullable(),
  drawnAt: z.string(),
  /** Diisi bila pemenang tidak maju lalu diundi ulang; tidak dihitung sebagai pemenang. */
  forfeitedAt: z.string().nullable(),
});
export type DoorprizeWinner = z.infer<typeof doorprizeWinnerSchema>;

export const doorprizeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  quantity: z.number(),
  sortOrder: z.number(),
  winners: z.array(doorprizeWinnerSchema),
});
export type Doorprize = z.infer<typeof doorprizeSchema>;

export const doorprizeListSchema = z.object({
  prizes: z.array(doorprizeSchema),
  /** Tamu yang sudah check-in dan belum pernah diundi (menang atau dicoret). */
  poolSize: z.number(),
  /** Contoh nama dari peserta undian untuk animasi acak di layar (bukan penentu pemenang). */
  poolSample: z.array(z.string()),
});
export type DoorprizeList = z.infer<typeof doorprizeListSchema>;

export const doorprizeResponseSchema = z.object({ prize: doorprizeSchema });
export const doorprizeDrawResponseSchema = z.object({
  prize: doorprizeSchema,
  winner: doorprizeWinnerSchema,
});
export type DoorprizeDrawResponse = z.infer<typeof doorprizeDrawResponseSchema>;
