import { z } from "zod";

/**
 * Layar hari-H (TV/proyektor yang dipasangkan sebagai perangkat jenis "layar"). Dua mode, dipilih di
 * layarnya: Sapa (ucapan selamat datang untuk tamu yang baru masuk) dan Dapur (orang yang sudah datang
 * dibanding porsi makanan yang siap, angka porsi diisi admin dari kabar dapur).
 */

export const layarModeSchema = z.enum(["sapa", "dapur"]);
export type LayarMode = z.infer<typeof layarModeSchema>;

export const layarFeedSchema = z.object({
  serverTime: z.string(),
  deviceName: z.string(),
  couple: z.string(),
  /** null bila belum ada acara dengan check-in aktif. */
  eventName: z.string().nullable(),
  /** Tamu yang baru masuk, terbaru lebih dulu (nama saja, tanpa kontak). */
  recent: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      groupName: z.string().nullable(),
      isVip: z.boolean(),
      pax: z.number(),
      scannedAt: z.string(),
    }),
  ),
  kitchen: z.object({
    arrivedPax: z.number(),
    /** Orang yang menjawab RSVP hadir; null bila acara tidak memakai RSVP. */
    rsvpPax: z.number().nullable(),
    portionsReady: z.number(),
    portionsUpdatedAt: z.string().nullable(),
  }),
});
export type LayarFeed = z.infer<typeof layarFeedSchema>;

export const layarPortionsInputSchema = z.object({
  portionsReady: z
    .number({ error: "Isi banyak porsi" })
    .int("Porsi harus bilangan bulat")
    .min(0, "Porsi tidak boleh negatif")
    .max(100_000, "Porsi terlalu banyak"),
});
export type LayarPortionsInput = z.infer<typeof layarPortionsInputSchema>;

export const layarPortionsResponseSchema = z.object({
  portionsReady: z.number(),
  updatedAt: z.string().nullable(),
});
export type LayarPortions = z.infer<typeof layarPortionsResponseSchema>;
