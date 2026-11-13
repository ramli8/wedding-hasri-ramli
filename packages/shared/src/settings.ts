import { z } from "zod";

/** Nama pendek situs bila belum diatur: judul tab dan nama aplikasi di HP. */
export const DEFAULT_SITE_NAME = "Hasri & Ramli";
export const SITE_NAME_MAX = 40;

export const settingsInputSchema = z.object({
  /** Nama pendek untuk judul tab dan nama aplikasi; kosong = DEFAULT_SITE_NAME. */
  siteName: z
    .string()
    .trim()
    .max(SITE_NAME_MAX, `Nama situs maksimal ${SITE_NAME_MAX} karakter`)
    .nullish()
    .transform((value) => value || null),
  groomName: z.string().trim().min(1, "Nama mempelai pria wajib diisi"),
  brideName: z.string().trim().min(1, "Nama mempelai wanita wajib diisi"),
  publicBaseUrl: z
    .url({ protocol: /^https?$/, error: "Alamat situs harus diawali http:// atau https://" })
    .transform((url) => url.replace(/\/+$/, "")),
  /** Waktu tujuan hitung mundur di undangan. Kosong: tanggal acara pertama. */
  countdownAt: z.iso
    .datetime({ offset: true })
    .nullish()
    .transform((value) => value ?? null),
});
export type SettingsInput = z.input<typeof settingsInputSchema>;

export const settingsSchema = z.object({
  siteName: z.string().nullable(),
  groomName: z.string(),
  brideName: z.string(),
  publicBaseUrl: z.string(),
  countdownAt: z.string().nullable(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const settingsResponseSchema = z.object({ settings: settingsSchema.nullable() });
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;

/** Info situs tanpa login (judul tab di halaman tamu dan scanner). */
export const siteInfoSchema = z.object({ name: z.string() });
export type SiteInfo = z.infer<typeof siteInfoSchema>;
