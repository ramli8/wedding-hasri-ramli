import { z } from "zod";
import { normalizeInstagram, normalizePhone } from "./contact.js";

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null);

/** Nomor HP opsional: dinormalisasi dengan `normalizePhone`, kosong = null, tidak sah = galat. */
export const optionalPhoneField = z
  .string()
  .trim()
  .nullish()
  .transform((value, ctx) => {
    if (!value) return null;
    const phone = normalizePhone(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Nomor HP tidak valid" });
      return z.NEVER;
    }
    return phone;
  });

const instagramField = z
  .string()
  .trim()
  .nullish()
  .transform((value, ctx) => {
    if (!value) return null;
    const username = normalizeInstagram(value);
    if (!username) {
      ctx.addIssue({ code: "custom", message: "Username Instagram tidak valid" });
      return z.NEVER;
    }
    return username;
  });

export const guestInputSchema = z
  .object({
    displayName: z.string().trim().min(1, "Nama undangan wajib diisi"),
    phone: optionalPhoneField,
    instagram: instagramField,
    /** Wajib: setiap tamu masuk satu kelompok (hanya tamu walk-in dari pintu yang boleh tanpa). */
    groupId: z.uuid({ error: "Pilih kelompok" }),
    /** Rombongan: penjaga mengisi jumlah orang saat check-in. Selain itu, otomatis 1 orang. */
    isRombongan: z.boolean().default(false),
    usherNote: optionalText,
    // Acara yang diundang tidak diisi per tamu: selalu mengikuti acara kelompoknya.
  })
  .refine((g) => g.phone !== null || g.instagram !== null, {
    message: "Isi nomor HP atau Instagram",
    path: ["phone"],
  });
export type GuestInput = z.input<typeof guestInputSchema>;
export type GuestData = z.output<typeof guestInputSchema>;

export const sentViaSchema = z.enum(["whatsapp", "instagram", "other"]);
export type SentVia = z.infer<typeof sentViaSchema>;

export const guestEventSchema = z.object({
  eventId: z.uuid(),
  sentAt: z.string().nullable(),
  sentVia: sentViaSchema.nullable(),
});

export const guestSchema = z.object({
  id: z.uuid(),
  code: z.string().nullable(),
  displayName: z.string(),
  phone: z.string().nullable(),
  instagram: z.string().nullable(),
  groupId: z.uuid().nullable(),
  isRombongan: z.boolean(),
  usherNote: z.string().nullable(),
  source: z.enum(["admin", "import", "walkin"]),
  events: z.array(guestEventSchema),
  createdAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type Guest = z.infer<typeof guestSchema>;

export const guestListQuerySchema = z.object({
  q: z.string().trim().optional(),
  groupId: z.uuid().optional(),
  /** Hanya tamu yang diundang ke acara ini. */
  eventId: z.uuid().optional(),
  /** Dengan `eventId`: filter berdasarkan status kirim di acara itu. */
  sent: z.enum(["sent", "unsent"]).optional(),
  /** Tamu tanpa nomor HP (hanya Instagram). */
  onlyInstagram: z.stringbool().optional(),
  /** Hanya tamu yang ditandai rombongan. */
  rombongan: z.stringbool().optional(),
  deleted: z.stringbool().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type GuestListQuery = z.input<typeof guestListQuerySchema>;
export type GuestListParams = z.output<typeof guestListQuerySchema>;

export const guestListResponseSchema = z.object({
  items: z.array(guestSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type GuestListResponse = z.infer<typeof guestListResponseSchema>;

export const guestResponseSchema = z.object({ guest: guestSchema });

export const markSentRequestSchema = z.object({
  eventId: z.uuid(),
  sent: z.boolean().default(true),
  via: sentViaSchema.default("whatsapp"),
});
export type MarkSentRequest = z.input<typeof markSentRequestSchema>;

// --- Aksi massal ------------------------------------------------------

/**
 * Satu-satunya aksi massal: pindah kelompok. Acara yang diundang ikut kelompok tujuan, jadi tidak
 * ada aksi undang/batalkan acara per tamu.
 */
export const GUEST_BULK_ACTIONS = ["set_group"] as const;

export const guestBulkRequestSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1, "Pilih minimal satu tamu")
    .max(1000, "Maksimal 1000 tamu sekaligus"),
  action: z.enum(GUEST_BULK_ACTIONS),
  groupId: z.uuid({ error: "Pilih kelompok tujuan" }),
});
export type GuestBulkRequest = z.input<typeof guestBulkRequestSchema>;
export type GuestBulkData = z.output<typeof guestBulkRequestSchema>;

export const guestBulkResponseSchema = z.object({ updated: z.number() });
export type GuestBulkResponse = z.infer<typeof guestBulkResponseSchema>;

// --- Cek kontak ganda --------------------------------------------------

/** Nilai mentah dari formulir; server yang menormalkan. Nilai tidak sah dianggap tidak cocok. */
export const guestDuplicatesQuerySchema = z.object({
  phone: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  /** Tamu yang sedang diubah, agar tidak dianggap ganda dengan dirinya sendiri. */
  excludeId: z.uuid().optional(),
});
export type GuestDuplicatesQuery = z.input<typeof guestDuplicatesQuerySchema>;

export const guestDuplicateSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  code: z.string().nullable(),
});
export type GuestDuplicate = z.infer<typeof guestDuplicateSchema>;

export const guestDuplicatesResponseSchema = z.object({ guests: z.array(guestDuplicateSchema) });
export type GuestDuplicatesResponse = z.infer<typeof guestDuplicatesResponseSchema>;

// --- Impor CSV ---------------------------------------------------------
export const IMPORT_COLUMNS = [
  "nama_undangan",
  "hp",
  "instagram",
  "kelompok",
  "rombongan",
  "catatan_penjaga",
] as const;

export const importRequestSchema = z.object({
  csv: z.string().min(1, "Berkas CSV kosong").max(2_000_000, "Berkas CSV terlalu besar"),
});

export const importRowSchema = z.object({
  line: z.number(),
  status: z.enum(["ok", "duplicate", "error"]),
  messages: z.array(z.string()),
  displayName: z.string(),
  phone: z.string().nullable(),
  instagram: z.string().nullable(),
  groupName: z.string().nullable(),
  isRombongan: z.boolean().nullable(),
});

export const importPreviewResponseSchema = z.object({
  rows: z.array(importRowSchema),
  newGroups: z.array(z.string()),
  counts: z.object({ ok: z.number(), duplicate: z.number(), error: z.number() }),
  /** Baris contoh template Excel yang dilewati (tidak ikut dihitung atau diimpor). */
  examplesSkipped: z.number(),
});
export type ImportPreview = z.infer<typeof importPreviewResponseSchema>;

export const importCommitRequestSchema = importRequestSchema.extend({
  /** true: baris duplikat dilewati. false: duplikat tetap diimpor. */
  skipDuplicates: z.boolean().default(true),
});

export const importCommitResponseSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
  createdGroups: z.array(z.string()),
});
export type ImportCommitResponse = z.infer<typeof importCommitResponseSchema>;
