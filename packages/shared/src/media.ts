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

/**
 * Gambar kartu tautan (Open Graph): JPEG 1200 × 630, potongan tengah, di bawah ±300 KB. WhatsApp
 * hanya menampilkan gambar besar untuk JPEG/PNG berukuran ini; WebP sering tidak tampil.
 */
export const MEDIA_OG_FILE = "og.jpg";
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export function mediaOgUrl(id: string): string {
  return `/media/${id}/${MEDIA_OG_FILE}`;
}

/**
 * Ikon situs dari logo yang diunggah, disajikan di /site-icon/<nama>. `transparent` mempertahankan
 * latar transparan (tab browser), `opaque` diberi latar putih (iPhone/Android menghitamkan
 * transparansi), `maskable` diberi ruang aman 10% tiap sisi untuk ikon Android yang dipotong.
 */
export const SITE_ICONS = {
  "favicon-32.png": { size: 32, mode: "transparent" },
  "favicon-48.png": { size: 48, mode: "transparent" },
  "apple-touch-icon.png": { size: 180, mode: "opaque" },
  "icon-192.png": { size: 192, mode: "opaque" },
  "icon-512.png": { size: 512, mode: "opaque" },
  "icon-maskable-512.png": { size: 512, mode: "maskable" },
} as const;
export type SiteIconName = keyof typeof SITE_ICONS;

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
