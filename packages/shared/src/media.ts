import { z } from "zod";

/**
 * Varian gambar yang disimpan server. `large` mempertahankan resolusi asli (hanya dibatasi bila
 * sisinya melebihi MAX_LARGE_SIDE) dan dikodekan WebP near-lossless; `thumb` hanya untuk
 * pratinjau kecil di daftar admin.
 */
export const MEDIA_VARIANTS = ["large", "thumb"] as const;
export type MediaVariant = (typeof MEDIA_VARIANTS)[number];

/** Sisi terpanjang varian `large`; batas teknis WebP adalah 16383 piksel. */
export const MAX_LARGE_SIDE = 8000;
export const THUMB_SIDE = 480;

/** Batas ukuran berkas unggahan: foto kamera modern bisa belasan MB. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

/** Alamat gambar yang disajikan server (tanpa login, di-cache lama karena id tidak berubah). */
export function mediaUrl(id: string, variant: MediaVariant): string {
  return `/media/${id}/${variant}.webp`;
}

/**
 * Salinan JPEG (kualitas 95, warna penuh 4:4:4) untuk foto yang dibagikan tamu: story WhatsApp,
 * Instagram dan galeri HP lama tidak selalu menerima WebP. Hanya dibuat untuk foto booth.
 */
export const MEDIA_JPEG_FILE = "photo.jpg";

export function mediaJpegUrl(id: string): string {
  return `/media/${id}/${MEDIA_JPEG_FILE}`;
}

export const mediaRefSchema = z.object({
  id: z.uuid(),
  width: z.number(),
  height: z.number(),
  large: z.string(),
  thumb: z.string(),
});
export type MediaRef = z.infer<typeof mediaRefSchema>;

export const mediaSchema = mediaRefSchema.extend({
  bytes: z.number(),
  originalName: z.string().nullable(),
  createdAt: z.string(),
});
export type Media = z.infer<typeof mediaSchema>;

export const mediaResponseSchema = z.object({ media: mediaSchema });
export const mediaListResponseSchema = z.object({ items: z.array(mediaSchema) });
