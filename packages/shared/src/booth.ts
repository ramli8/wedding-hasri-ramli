import { z } from "zod";
import { mediaRefSchema } from "./media.js";

/**
 * Bingkai bawaan photobooth bertema bunga (lihat docs/rancangan.md §14 "Photobooth"). Digambar oleh
 * kode di peramban, jadi server hanya menyimpan kuncinya. Kunci lama (poster/strip/tiket, dari
 * desain bioskop) dipertahankan agar foto dan pengaturan yang sudah tersimpan tetap sah.
 */
export const BOOTH_FRAMES = ["poster", "strip", "tiket"] as const;
export type BoothFrame = (typeof BOOTH_FRAMES)[number];

export const BOOTH_FRAME_LABELS: Record<BoothFrame, string> = {
  poster: "Bunga sudut",
  strip: "Panel samping",
  tiket: "Lengkung bunga",
};

/** Ukuran hasil: 4R mendatar (152 × 102 mm) pada 300 dpi. */
export const BOOTH_PHOTO_WIDTH = 1800;
export const BOOTH_PHOTO_HEIGHT = 1200;

/** Batas berkas foto booth: JPEG 1800×1200 berkualitas tinggi jauh di bawah ini. */
export const BOOTH_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const boothFrameSchema = z.enum(BOOTH_FRAMES);

/** Bingkai aktif disimpan berurutan sesuai BOOTH_FRAMES dan tanpa duplikat. */
export const boothConfigSchema = z.object({
  frames: z
    .array(boothFrameSchema)
    .min(1, "Pilih minimal satu bingkai")
    .transform((frames) => BOOTH_FRAMES.filter((frame) => frames.includes(frame))),
});
export type BoothConfigInput = z.input<typeof boothConfigSchema>;

export const boothConfigDataSchema = z.object({
  frames: z.array(boothFrameSchema),
  /**
   * Alamat situs (Pengaturan → Pernikahan) untuk QR foto: `<photoBaseUrl>/foto/<id foto>`. Hanya
   * dikirim ke booth; null = booth memakai alamat yang sedang dibukanya.
   */
  photoBaseUrl: z
    .url({ protocol: /^https?$/ })
    .nullable()
    .default(null),
});
export type BoothConfig = z.output<typeof boothConfigDataSchema>;

export const boothConfigResponseSchema = z.object({ config: boothConfigDataSchema });
export type BoothConfigResponse = z.infer<typeof boothConfigResponseSchema>;

/** Data yang menyertai berkas saat booth mengunggah foto (bidang multipart selain `file`). */
export const boothUploadSchema = z.object({
  id: z.uuid(),
  frame: boothFrameSchema,
  takenAt: z.iso.datetime(),
});
export type BoothUpload = z.infer<typeof boothUploadSchema>;

export const boothUploadResponseSchema = z.object({ id: z.uuid(), duplicate: z.boolean() });
export type BoothUploadResponse = z.infer<typeof boothUploadResponseSchema>;

/** Gambar foto booth: varian biasa ditambah salinan JPEG untuk diunduh dan dibagikan tamu. */
export const boothMediaSchema = mediaRefSchema.extend({ jpeg: z.string() });

export const boothPhotoSchema = z.object({
  id: z.uuid(),
  frame: boothFrameSchema,
  takenAt: z.string(),
  deviceName: z.string().nullable(),
  media: boothMediaSchema,
});
export type BoothPhoto = z.infer<typeof boothPhotoSchema>;

export const boothPhotoListResponseSchema = z.object({
  items: z.array(boothPhotoSchema),
  total: z.number(),
});
export type BoothPhotoListResponse = z.infer<typeof boothPhotoListResponseSchema>;

export const boothPhotoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type BoothPhotoQuery = z.input<typeof boothPhotoQuerySchema>;

/** Halaman foto tamu (`/foto/<id>`, dari QR di cetakan): satu foto saja, tanpa login. */
export const guestPhotoResponseSchema = z.object({
  photo: z.object({ id: z.uuid(), takenAt: z.string(), media: boothMediaSchema }),
});
export type GuestPhotoResponse = z.infer<typeof guestPhotoResponseSchema>;
