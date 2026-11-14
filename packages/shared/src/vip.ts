import { z } from "zod";

/**
 * Kabar tamu VIP: tamu yang ditandai VIP dan sudah check-in, terbaru lebih dulu. Dipakai pemberitahuan
 * di admin dan halaman "Kabar VIP" (tautan rahasia /vip/<token>) yang dibuka keluarga di HP.
 */
export const vipArrivalSchema = z.object({
  /** Id event check-in (unik per kedatangan). */
  id: z.uuid(),
  seq: z.number(),
  guestName: z.string(),
  groupName: z.string().nullable(),
  pax: z.number().nullable(),
  scannedAt: z.string(),
});
export type VipArrival = z.infer<typeof vipArrivalSchema>;

export const vipFeedSchema = z.object({
  arrivals: z.array(vipArrivalSchema),
  /** Banyak tamu VIP berbeda yang sudah datang. */
  arrivedCount: z.number(),
  /** Banyak tamu VIP yang terdaftar (untuk "3 dari 8 sudah datang"). */
  vipCount: z.number(),
});
export type VipFeed = z.infer<typeof vipFeedSchema>;

export const vipAdminFeedSchema = vipFeedSchema.extend({
  /** Bagian rahasia tautan /vip/<token>. */
  token: z.string(),
});

export const vipTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{22}$/, "Tautan tidak dikenal");
