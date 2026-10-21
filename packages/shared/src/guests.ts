import { z } from "zod";
import { normalizeInstagram, normalizePhone } from "./contact.js";

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null);

const phoneField = z
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
    phone: phoneField,
    instagram: instagramField,
    groupId: z
      .uuid()
      .nullish()
      .transform((value) => value ?? null),
    /** Rombongan: penjaga mengisi jumlah orang saat check-in. Selain itu, otomatis 1 orang. */
    isRombongan: z.boolean().default(false),
    usherNote: optionalText,
    eventIds: z.array(z.uuid()).default([]),
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

// --- Impor CSV ---------------------------------------------------------
export const IMPORT_COLUMNS = [
  "nama_undangan",
  "hp",
  "instagram",
  "kelompok",
  "rombongan",
  "catatan_penjaga",
  "acara",
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
