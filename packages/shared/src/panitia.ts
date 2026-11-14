import { z } from "zod";
import { optionalPhoneField } from "./guests.js";

/**
 * Tugas panitia keluarga. Anggota panitia tidak punya akun: cukup nama dan nomor HP, lalu menerima
 * tautan pribadi `/tugas/<token>` berisi tugasnya sendiri yang bisa dicentang. Satu tugas satu
 * penanggung jawab.
 */

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .nullish()
    .transform((value) => value || null);

export const panitiaMemberInputSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(60, "Nama maksimal 60 karakter"),
  phone: optionalPhoneField,
});
export type PanitiaMemberInput = z.input<typeof panitiaMemberInputSchema>;
export type PanitiaMemberData = z.output<typeof panitiaMemberInputSchema>;

export const panitiaMemberSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  /** Bagian rahasia tautan /tugas/<token>; hanya untuk admin. */
  token: z.string(),
});
export type PanitiaMember = z.infer<typeof panitiaMemberSchema>;

export const panitiaTaskInputSchema = z.object({
  title: z.string().trim().min(1, "Tugas wajib diisi").max(160, "Tugas maksimal 160 karakter"),
  memberId: z
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  /** Tenggat (YYYY-MM-DD), opsional. */
  dueOn: z.iso
    .date()
    .nullish()
    .transform((value) => value ?? null),
  note: optionalText(500, "Catatan"),
});
export type PanitiaTaskInput = z.input<typeof panitiaTaskInputSchema>;
export type PanitiaTaskData = z.output<typeof panitiaTaskInputSchema>;

export const panitiaTaskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  memberId: z.uuid().nullable(),
  dueOn: z.string().nullable(),
  note: z.string().nullable(),
  doneAt: z.string().nullable(),
});
export type PanitiaTask = z.infer<typeof panitiaTaskSchema>;

export const panitiaDoneSchema = z.object({ done: z.boolean() });

export const panitiaResponseSchema = z.object({
  members: z.array(panitiaMemberSchema),
  tasks: z.array(panitiaTaskSchema),
});
export type PanitiaResponse = z.infer<typeof panitiaResponseSchema>;
export const panitiaMemberResponseSchema = z.object({ member: panitiaMemberSchema });
export const panitiaTaskResponseSchema = z.object({ task: panitiaTaskSchema });

/** Halaman tugas milik satu anggota (tanpa nomor HP, tanpa tugas orang lain). */
export const myTasksResponseSchema = z.object({
  name: z.string(),
  couple: z.string(),
  tasks: z.array(panitiaTaskSchema.omit({ memberId: true })),
});
export type MyTasksResponse = z.infer<typeof myTasksResponseSchema>;

/** Token tautan tugas: 22 karakter base64url (128 bit acak). */
export const panitiaTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{22}$/, "Tautan tidak dikenal");

/** Bawaan pesan WhatsApp saat mengirim tautan tugas. */
export function panitiaMessage(input: { name: string; link: string; couple: string }): string {
  return [
    `Assalamualaikum ${input.name},`,
    "",
    `Berikut daftar tugas Anda untuk pernikahan ${input.couple}. Centang tugas yang sudah selesai di tautan ini:`,
    input.link,
    "",
    "Terima kasih banyak atas bantuannya.",
  ].join("\n");
}
