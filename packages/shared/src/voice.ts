import { z } from "zod";

/**
 * Pesan suara dari tamu: direkam di halaman undangan (kode tamu = kredensial), paling lama 60 detik.
 * Hanya pengantin (admin) yang mendengarkan; tidak tampil ke tamu lain.
 */
export const VOICE_MAX_MS = 60_000;
/** Opus 60 detik ±0,5 MB; AAC di iPhone bisa lebih besar. */
export const VOICE_MAX_BYTES = 3 * 1024 * 1024;
/** Satu tamu boleh mengirim beberapa kali (mis. salah rekam), dibatasi agar tidak dipakai spam. */
export const VOICE_MAX_PER_GUEST = 3;

export const voiceUploadMetaSchema = z.object({
  code: z.string(),
  durationMs: z.coerce
    .number()
    .int()
    .min(500, "Rekaman terlalu pendek")
    // Sedikit kelonggaran: perekam berhenti sesaat setelah batas 60 detik.
    .max(VOICE_MAX_MS + 2_000, "Rekaman maksimal 60 detik"),
});

export const voiceUploadResponseSchema = z.object({
  id: z.uuid(),
  /** Sisa kiriman untuk tamu ini. */
  remaining: z.number(),
});
export type VoiceUploadResponse = z.infer<typeof voiceUploadResponseSchema>;

export const voiceMessageSchema = z.object({
  id: z.uuid(),
  guestId: z.uuid(),
  guestName: z.string(),
  groupName: z.string().nullable(),
  durationMs: z.number(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  hidden: z.boolean(),
  createdAt: z.string(),
});
export type VoiceMessage = z.infer<typeof voiceMessageSchema>;

export const voiceListSchema = z.object({ items: z.array(voiceMessageSchema) });
export const voiceMessageResponseSchema = z.object({ item: voiceMessageSchema });
