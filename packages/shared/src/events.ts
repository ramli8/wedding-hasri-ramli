import { z } from "zod";

const isoDateTime = z.iso.datetime({ offset: true });
const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null);

export const MESSAGE_TEMPLATE_VARIABLES = [
  { name: "{panggilan}", description: "Nama undangan tamu" },
  { name: "{link}", description: "Link undangan personal tamu" },
  { name: "{acara}", description: "Nama acara" },
  { name: "{tanggal}", description: "Tanggal acara" },
  { name: "{jam_sesi}", description: "Jam sesi kelompok tamu di acara ini" },
] as const;

export const DEFAULT_MESSAGE_TEMPLATE = [
  "Assalamualaikum {panggilan},",
  "",
  "Kami mengundang Anda ke {acara}.",
  "Tanggal: {tanggal}",
  "Waktu: {jam_sesi}",
  "",
  "Undangan lengkap: {link}",
].join("\n");

/** Bawaan pesan pengingat RSVP; variabel sama dengan pesan undangan. */
export const DEFAULT_REMINDER_TEMPLATE = [
  "Assalamualaikum {panggilan},",
  "",
  "Kami menunggu konfirmasi kehadiran Anda di {acara} ({tanggal}).",
  "Mohon isi konfirmasi lewat undangan Anda: {link}",
  "",
  "Terima kasih.",
].join("\n");

export const eventInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
    name: z.string().trim().min(1, "Nama acara wajib diisi"),
    startsAt: isoDateTime.nullish().transform((value) => value ?? null),
    endsAt: isoDateTime.nullish().transform((value) => value ?? null),
    venueName: optionalText,
    address: optionalText,
    mapsUrl: z
      .url("Link peta tidak valid")
      .nullish()
      .or(z.literal(""))
      .transform((value) => value || null),
    checkinEnabled: z.boolean().default(false),
    hasRsvp: z.boolean().default(false),
    messageTemplate: z.string().trim().default(""),
  })
  .refine((e) => !e.startsAt || !e.endsAt || e.endsAt >= e.startsAt, {
    message: "Jam selesai tidak boleh sebelum jam mulai",
    path: ["endsAt"],
  });
export type EventInput = z.input<typeof eventInputSchema>;
export type EventData = z.output<typeof eventInputSchema>;

export const eventSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  venueName: z.string().nullable(),
  address: z.string().nullable(),
  mapsUrl: z.string().nullable(),
  checkinEnabled: z.boolean(),
  hasRsvp: z.boolean(),
  messageTemplate: z.string(),
  /** Jumlah tamu (belum dihapus) yang diundang ke acara ini. */
  invitedCount: z.number(),
});
export type Event = z.infer<typeof eventSchema>;

export const eventListResponseSchema = z.object({ items: z.array(eventSchema) });
export const eventResponseSchema = z.object({ event: eventSchema });
