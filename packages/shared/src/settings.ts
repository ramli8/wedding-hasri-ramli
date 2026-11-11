import { z } from "zod";

export const settingsInputSchema = z.object({
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
  groomName: z.string(),
  brideName: z.string(),
  publicBaseUrl: z.string(),
  countdownAt: z.string().nullable(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const settingsResponseSchema = z.object({ settings: settingsSchema.nullable() });
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
