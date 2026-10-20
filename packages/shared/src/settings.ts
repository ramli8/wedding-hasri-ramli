import { z } from "zod";

export const settingsInputSchema = z.object({
  groomName: z.string().trim().min(1, "Nama mempelai pria wajib diisi"),
  brideName: z.string().trim().min(1, "Nama mempelai wanita wajib diisi"),
  publicBaseUrl: z.url("Alamat situs tidak valid").transform((url) => url.replace(/\/+$/, "")),
});
export type SettingsInput = z.input<typeof settingsInputSchema>;

export const settingsSchema = z.object({
  groomName: z.string(),
  brideName: z.string(),
  publicBaseUrl: z.string(),
});
export type Settings = z.infer<typeof settingsSchema>;

export const settingsResponseSchema = z.object({ settings: settingsSchema.nullable() });
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
