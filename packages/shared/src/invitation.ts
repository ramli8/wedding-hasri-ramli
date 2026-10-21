import { z } from "zod";
import { normalizeInstagram } from "./contact.js";
import { mediaRefSchema } from "./media.js";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .nullish()
    .transform((value) => value || null);

const photoId = z
  .uuid()
  .nullish()
  .transform((value) => value ?? null);

// --- Profil mempelai ------------------------------------------------------------------------------

export const COUPLE_ROLES = ["groom", "bride"] as const;
export const coupleRoleSchema = z.enum(COUPLE_ROLES);
export type CoupleRole = z.infer<typeof coupleRoleSchema>;

export const COUPLE_ROLE_LABEL: Record<CoupleRole, string> = {
  groom: "Mempelai pria",
  bride: "Mempelai wanita",
};

export const coupleProfileInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi")
    .max(120, "Nama maksimal 120 karakter"),
  nickname: optionalText(60, "Nama panggilan"),
  parents: optionalText(200, "Keterangan orang tua"),
  bio: optionalText(600, "Perkenalan"),
  instagram: z
    .string()
    .trim()
    .nullish()
    .transform((value, ctx) => {
      if (!value) return null;
      const username = normalizeInstagram(value);
      if (!username) {
        ctx.addIssue({ code: "custom", message: "Username Instagram tidak valid" });
        return z.NEVER;
      }
      return username;
    }),
  photoMediaId: photoId,
});
export type CoupleProfileInput = z.input<typeof coupleProfileInputSchema>;
export type CoupleProfileData = z.output<typeof coupleProfileInputSchema>;

export const coupleProfileSchema = z.object({
  role: coupleRoleSchema,
  fullName: z.string(),
  nickname: z.string().nullable(),
  parents: z.string().nullable(),
  bio: z.string().nullable(),
  instagram: z.string().nullable(),
  photo: mediaRefSchema.nullable(),
});
export type CoupleProfile = z.infer<typeof coupleProfileSchema>;

export const coupleSchema = z.object({
  groom: coupleProfileSchema.nullable(),
  bride: coupleProfileSchema.nullable(),
});
export type Couple = z.infer<typeof coupleSchema>;

export const coupleResponseSchema = z.object({ couple: coupleSchema });
export const coupleProfileResponseSchema = z.object({ profile: coupleProfileSchema });

// --- Cerita ---------------------------------------------------------------------------------------

export const storyInputSchema = z.object({
  /** Teks bebas untuk waktu, mis. "2019" atau "Mei 2022". */
  whenLabel: optionalText(60, "Waktu"),
  title: z.string().trim().min(1, "Judul wajib diisi").max(120, "Judul maksimal 120 karakter"),
  body: z.string().trim().max(1500, "Cerita maksimal 1500 karakter").default(""),
  photoMediaId: photoId,
});
export type StoryInput = z.input<typeof storyInputSchema>;
export type StoryData = z.output<typeof storyInputSchema>;

export const storyItemSchema = z.object({
  id: z.uuid(),
  whenLabel: z.string().nullable(),
  title: z.string(),
  body: z.string(),
  photo: mediaRefSchema.nullable(),
});
export type StoryItem = z.infer<typeof storyItemSchema>;

export const storyListResponseSchema = z.object({ items: z.array(storyItemSchema) });
export const storyItemResponseSchema = z.object({ item: storyItemSchema });

/** Urutan baru: seluruh id butir cerita, dari yang pertama. */
export const storyOrderSchema = z.object({ ids: z.array(z.uuid()) });

// --- Isi undangan untuk tamu ----------------------------------------------------------------------

export const invitationResponseSchema = z.object({
  couple: coupleSchema,
  story: z.array(storyItemSchema),
});
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;
