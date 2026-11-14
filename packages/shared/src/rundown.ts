import { z } from "zod";

/**
 * Rundown hari-H per acara: jam, kegiatan, penanggung jawab, vendor terkait. Jam disimpan "HH:MM"
 * (WIB, di tanggal acaranya) seperti jam datang vendor. MC dan panitia membuka tautan baca-saja
 * `/rundown/<token>`.
 */

export const hhmmSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam harus berformat JJ:MM, mis. 09:30");

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .nullish()
    .transform((value) => value || null);

export const rundownItemInputSchema = z.object({
  eventId: z.uuid(),
  time: hhmmSchema,
  /** Lama kegiatan dalam menit (opsional). */
  durationMin: z
    .number()
    .int()
    .min(1)
    .max(24 * 60)
    .nullish()
    .transform((value) => value ?? null),
  title: z
    .string()
    .trim()
    .min(1, "Kegiatan wajib diisi")
    .max(160, "Kegiatan maksimal 160 karakter"),
  pic: optionalText(60, "Penanggung jawab"),
  vendorId: z
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  note: optionalText(500, "Catatan"),
});
export type RundownItemInput = z.input<typeof rundownItemInputSchema>;
export type RundownItemData = z.output<typeof rundownItemInputSchema>;

export const rundownItemSchema = z.object({
  id: z.uuid(),
  eventId: z.uuid(),
  time: z.string(),
  durationMin: z.number().nullable(),
  title: z.string(),
  pic: z.string().nullable(),
  vendorId: z.uuid().nullable(),
  note: z.string().nullable(),
});
export type RundownItem = z.infer<typeof rundownItemSchema>;

/** Geser jam kegiatan ini dan semua sesudahnya di acara yang sama (acara molor/lebih cepat). */
export const rundownShiftSchema = z.object({
  minutes: z
    .number()
    .int()
    .min(-180)
    .max(180)
    .refine((value) => value !== 0, "Pilih berapa menit"),
});

export const rundownAdminResponseSchema = z.object({
  items: z.array(rundownItemSchema),
  /** Bagian rahasia tautan baca-saja /rundown/<token>. */
  token: z.string(),
});
export type RundownAdminResponse = z.infer<typeof rundownAdminResponseSchema>;
export const rundownItemResponseSchema = z.object({ item: rundownItemSchema });

export const rundownTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{22}$/, "Tautan rundown tidak dikenal");

/** Rundown untuk MC dan panitia (baca saja). */
export const publicRundownSchema = z.object({
  couple: z.string(),
  events: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      /** ISO; null bila acara belum diberi tanggal. */
      startsAt: z.string().nullable(),
      venueName: z.string().nullable(),
      items: z.array(
        z.object({
          id: z.uuid(),
          time: z.string(),
          durationMin: z.number().nullable(),
          title: z.string(),
          pic: z.string().nullable(),
          note: z.string().nullable(),
          vendor: z
            .object({
              name: z.string(),
              picName: z.string().nullable(),
              picPhone: z.string().nullable(),
            })
            .nullable(),
        }),
      ),
    }),
  ),
});
export type PublicRundown = z.infer<typeof publicRundownSchema>;

/** "09:30" + 15 → "09:45"; dibatasi 00:00–23:59. */
export function shiftTime(time: string, minutes: number): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, Math.max(0, h * 60 + m + minutes));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
