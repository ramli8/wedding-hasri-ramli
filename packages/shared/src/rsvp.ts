import { z } from "zod";
import { MAX_PAX } from "./checkin.js";

/** Kode tamu 6 karakter (tanpa I, O, 0, 1); huruf kecil dari URL diterima. */
export const guestCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{6}$/, "Kode tamu tidak valid");

export const RSVP_STATUSES = ["hadir", "tidak_hadir", "ragu"] as const;
export const rsvpStatusSchema = z.enum(RSVP_STATUSES);
export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  hadir: "Hadir",
  tidak_hadir: "Tidak hadir",
  ragu: "Belum pasti",
};

// --- Tiket publik (/u/KODE) ---------------------------------------------------------------------

export const ticketEventSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  venueName: z.string().nullable(),
  address: z.string().nullable(),
  mapsUrl: z.string().nullable(),
  checkinEnabled: z.boolean(),
  hasRsvp: z.boolean(),
  /** Jam sesi kelompok tamu di acara ini, bila ada. */
  session: z.object({ startsAt: z.string(), endsAt: z.string() }).nullable(),
  rsvp: z.object({ status: rsvpStatusSchema, pax: z.number() }).nullable(),
});
export type TicketEvent = z.infer<typeof ticketEventSchema>;

export const ticketResponseSchema = z.object({
  guest: z.object({
    code: z.string(),
    displayName: z.string(),
    isRombongan: z.boolean(),
    groupName: z.string().nullable(),
  }),
  couple: z.object({ groomName: z.string(), brideName: z.string() }).nullable(),
  events: z.array(ticketEventSchema),
});
export type TicketResponse = z.infer<typeof ticketResponseSchema>;

export const rsvpRequestSchema = z.object({
  code: guestCodeSchema,
  eventId: z.uuid(),
  status: rsvpStatusSchema,
  /** Jumlah orang yang hadir. Hanya dipakai untuk tamu rombongan; tamu biasa selalu 1. */
  pax: z.number().int().min(1, "Jumlah orang minimal 1").max(MAX_PAX).optional(),
});
export type RsvpRequest = z.input<typeof rsvpRequestSchema>;

export const rsvpResponseSchema = z.object({
  rsvp: z.object({ status: rsvpStatusSchema, pax: z.number() }),
});

// --- RSVP di admin ------------------------------------------------------------------------------

export const rsvpListQuerySchema = z.object({ eventId: z.uuid().optional() });

export const rsvpRowSchema = z.object({
  guestId: z.uuid(),
  displayName: z.string(),
  groupName: z.string().nullable(),
  isRombongan: z.boolean(),
  status: rsvpStatusSchema.nullable(),
  pax: z.number().nullable(),
  submittedAt: z.string().nullable(),
  /** Untuk pengingat: hanya dikirim ke admin (tidak pernah ke halaman tamu). */
  code: z.string().nullable(),
  phone: z.string().nullable(),
  groupId: z.uuid().nullable(),
  /** Kapan pengingat RSVP terakhir ditandai terkirim. */
  remindedAt: z.string().nullable(),
});
export type RsvpRow = z.infer<typeof rsvpRowSchema>;

export const rsvpListResponseSchema = z.object({
  event: z.object({ id: z.uuid(), name: z.string() }),
  totals: z.object({
    invited: z.number(),
    hadir: z.number(),
    /** Jumlah orang dari yang menjawab hadir (untuk katering). */
    hadirPax: z.number(),
    tidakHadir: z.number(),
    ragu: z.number(),
    belum: z.number(),
  }),
  items: z.array(rsvpRowSchema),
});
export type RsvpListResponse = z.infer<typeof rsvpListResponseSchema>;

export const markRemindedRequestSchema = z.object({
  eventId: z.uuid(),
  reminded: z.boolean().default(true),
});
export type MarkRemindedRequest = z.input<typeof markRemindedRequestSchema>;
