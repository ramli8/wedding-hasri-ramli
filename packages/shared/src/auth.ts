import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 10;
/** Batas atas agar sandi raksasa tidak membuat hitungan Argon2 mahal. */
export const MAX_PASSWORD_LENGTH = 256;

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const adminSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string(),
});
export type Admin = z.infer<typeof adminSchema>;

export const meResponseSchema = z.object({ admin: adminSchema });
export type MeResponse = z.infer<typeof meResponseSchema>;

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1).max(MAX_PASSWORD_LENGTH),
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, { message: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter` })
    .max(MAX_PASSWORD_LENGTH, { message: `Kata sandi maksimal ${MAX_PASSWORD_LENGTH} karakter` }),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
