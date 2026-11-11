import { z } from "zod";

const isoDateTime = z.iso.datetime({ offset: true });
const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null);

export const MESSAGE_TEMPLATE_VARIABLES = [
  { name: "{panggilan}", description: "Nama undangan tamu" },
  { name: "{acara}", description: "Nama acara" },
  { name: "{tanggal}", description: "Tanggal acara" },
  { name: "{jam_sesi}", description: "Jam sesi kelompok tamu di acara ini" },
  { name: "{tempat}", description: "Nama tempat acara" },
  { name: "{link}", description: "Link undangan personal tamu" },
  { name: "{mempelai}", description: "Nama kedua mempelai" },
] as const;

/**
 * Pesan undangan bawaan, langsung terisi di formulir acara supaya admin tinggal menyunting.
 * `*teks*` tampil tebal di WhatsApp. Baris yang variabelnya kosong (mis. tempat belum diisi) dibuang
 * otomatis oleh renderTemplate.
 */
export const DEFAULT_MESSAGE_TEMPLATE = [
  "Assalamu'alaikum Warahmatullahi Wabarakatuh",
  "",
  "Kepada Yth.",
  "*{panggilan}*",
  "",
  "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir di *{acara}* pernikahan kami:",
  "",
  "🗓 {tanggal}",
  "🕙 {jam_sesi}",
  "📍 {tempat}",
  "",
  "Undangan lengkap, peta lokasi, dan tiket QR untuk masuk dapat dibuka di sini:",
  "{link}",
  "",
  "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
  "",
  "Wassalamu'alaikum Warahmatullahi Wabarakatuh",
  "",
  "Kami yang berbahagia,",
  "*{mempelai}*",
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
    /** Kode singkat internal. Tidak diisi: dibuat server dari nama acara (unik). */
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda hubung")
      .optional(),
    name: z.string().trim().min(1, "Nama acara wajib diisi"),
    startsAt: isoDateTime.nullish().transform((value) => value ?? null),
    endsAt: isoDateTime.nullish().transform((value) => value ?? null),
    venueName: optionalText,
    address: optionalText,
    // Hanya http(s): nilai ini dipakai sebagai href di halaman tamu, jadi `javascript:` ditolak.
    mapsUrl: z
      .url({ protocol: /^https?$/, error: "Link peta harus diawali http:// atau https://" })
      .nullish()
      .or(z.literal(""))
      .transform((value) => value || null),
    checkinEnabled: z.boolean().default(false),
    hasRsvp: z.boolean().default(false),
    /**
     * Isi pesan undangan acara ini. Tidak dikirim = tidak diubah (formulir acara tidak lagi memuatnya;
     * pesan diatur di Pengaturan → Pesan undangan lewat PUT /events/:id/message).
     */
    messageTemplate: z.string().trim().max(4000).optional(),
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

/** Mengubah pesan undangan satu acara. Kosong atau sama dengan bawaan = memakai bawaan. */
export const eventMessageSchema = z.object({
  messageTemplate: z.string().trim().max(4000, "Pesan maksimal 4.000 karakter"),
});
export type EventMessageInput = z.input<typeof eventMessageSchema>;
