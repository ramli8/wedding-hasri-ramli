import { z } from "zod";
import { receivedGiftSummarySchema } from "./received-gifts.js";
import { dueStateSchemaValues, vendorSummarySchema } from "./vendors.js";

/** Ringkasan Beranda admin: angka penting dan bahan daftar "perlu dikerjakan". */
export const homeResponseSchema = z.object({
  /** Acara paling awal (waktu mulai), untuk hitung mundur. */
  eventDate: z.string().nullable(),
  guests: z.object({
    total: z.number(),
    /** Tamu yang belum pernah ditandai dikirimi undangan ke acara mana pun. */
    neverSent: z.number(),
  }),
  rsvp: z
    .object({
      eventName: z.string(),
      invited: z.number(),
      hadir: z.number(),
      hadirPax: z.number(),
      tidakHadir: z.number(),
      ragu: z.number(),
      belum: z.number(),
    })
    .nullable(),
  checkin: z
    .object({
      eventName: z.string(),
      invited: z.number(),
      arrived: z.number(),
      needsReview: z.number(),
    })
    .nullable(),
  vendors: z.object({
    summary: vendorSummarySchema,
    /** Vendor terpilih yang terlambat atau segera jatuh tempo, paling mendesak dulu. */
    due: z.array(
      z.object({
        id: z.uuid(),
        name: z.string(),
        categoryName: z.string(),
        dueOn: z.string(),
        dueAmount: z.number().nullable(),
        state: z.enum(dueStateSchemaValues),
      }),
    ),
  }),
  gifts: receivedGiftSummarySchema,
  guestbookUnreplied: z.number(),
  /** Profil mempelai sudah diisi (keduanya). */
  coupleFilled: z.boolean(),
});
export type HomeResponse = z.infer<typeof homeResponseSchema>;
