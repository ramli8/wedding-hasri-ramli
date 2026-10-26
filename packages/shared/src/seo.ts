import { z } from "zod";
import { mediaRefSchema } from "./media.js";

/** Panjang yang masih tampil utuh di pratinjau tautan WhatsApp, Instagram, dan mesin pencari. */
export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 200;

/** Kata yang diganti per tamu saat tautan dibuka: `{panggilan}` jadi nama undangan tamu itu. */
export const SEO_VARIABLES = [
  { name: "{panggilan}", description: "Nama undangan tamu, mis. Bpk. Budi & Keluarga" },
  { name: "{mempelai}", description: "Nama kedua mempelai, mis. Hasri & Ramli" },
] as const;

export const seoInputSchema = z.object({
  title: z.string().trim().max(SEO_TITLE_MAX, `Judul maksimal ${SEO_TITLE_MAX} karakter`),
  description: z
    .string()
    .trim()
    .max(SEO_DESCRIPTION_MAX, `Deskripsi maksimal ${SEO_DESCRIPTION_MAX} karakter`),
  imageMediaId: z.uuid().nullable(),
});
export type SeoInput = z.input<typeof seoInputSchema>;

export const seoSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: mediaRefSchema.nullable(),
});
export type Seo = z.infer<typeof seoSchema>;

export const seoResponseSchema = z.object({ seo: seoSchema });
export type SeoResponse = z.infer<typeof seoResponseSchema>;

export const DEFAULT_SEO_TITLE = "Undangan pernikahan {mempelai}";
export const DEFAULT_SEO_DESCRIPTION =
  "{panggilan}, kami mengundang Anda ke pernikahan kami. Buka undangan lengkap dan tiket QR Anda di sini.";

/** Mengisi variabel pratinjau. Variabel yang tidak dikenal dibiarkan apa adanya. */
export function renderSeoText(
  template: string,
  values: { panggilan: string; mempelai: string },
): string {
  return template
    .replaceAll("{panggilan}", values.panggilan)
    .replaceAll("{mempelai}", values.mempelai);
}
