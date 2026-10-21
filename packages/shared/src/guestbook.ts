import { z } from "zod";
import { guestCodeSchema } from "./rsvp.js";

export const GUESTBOOK_MAX_MESSAGE = 500;
export const GUESTBOOK_MAX_NAME = 80;

export const guestbookEntrySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  message: z.string(),
  reply: z.string().nullable(),
  repliedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type GuestbookEntry = z.infer<typeof guestbookEntrySchema>;

export const guestbookListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const guestbookListResponseSchema = z.object({
  items: z.array(guestbookEntrySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type GuestbookListResponse = z.infer<typeof guestbookListResponseSchema>;

export const guestbookPostRequestSchema = z.object({
  code: guestCodeSchema,
  /** Kosong: memakai nama undangan tamu. */
  name: z
    .string()
    .trim()
    .max(GUESTBOOK_MAX_NAME, `Nama maksimal ${GUESTBOOK_MAX_NAME} karakter`)
    .nullish()
    .transform((value) => value || null),
  message: z
    .string()
    .trim()
    .min(1, "Ucapan tidak boleh kosong")
    .max(GUESTBOOK_MAX_MESSAGE, `Ucapan maksimal ${GUESTBOOK_MAX_MESSAGE} karakter`),
});
export type GuestbookPostRequest = z.input<typeof guestbookPostRequestSchema>;

export const guestbookPostResponseSchema = z.object({ entry: guestbookEntrySchema });

// --- Admin ----------------------------------------------------------------------------------------

export const adminGuestbookEntrySchema = guestbookEntrySchema.extend({
  isHidden: z.boolean(),
  guestId: z.uuid().nullable(),
});
export type AdminGuestbookEntry = z.infer<typeof adminGuestbookEntrySchema>;

export const adminGuestbookQuerySchema = guestbookListQuerySchema.extend({
  /** true: hanya yang disembunyikan; false: hanya yang tampil; kosong: semua. */
  hidden: z.stringbool().optional(),
});
export type AdminGuestbookQuery = z.input<typeof adminGuestbookQuerySchema>;

export const adminGuestbookListResponseSchema = z.object({
  items: z.array(adminGuestbookEntrySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const guestbookReplyRequestSchema = z.object({
  /** Kosong menghapus balasan. */
  reply: z
    .string()
    .trim()
    .max(GUESTBOOK_MAX_MESSAGE, `Balasan maksimal ${GUESTBOOK_MAX_MESSAGE} karakter`)
    .nullish()
    .transform((value) => value || null),
});

export const guestbookHideRequestSchema = z.object({ hidden: z.boolean() });

export const adminGuestbookResponseSchema = z.object({ entry: adminGuestbookEntrySchema });
