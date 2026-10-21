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

// --- Galeri ---------------------------------------------------------------------------------------

/** Satu foto galeri: gambar yang sudah diunggah (lihat media) ditambah keterangan opsional. */
export const galleryInputSchema = z.object({
  mediaId: z.uuid(),
  caption: optionalText(160, "Keterangan"),
});
export type GalleryInput = z.input<typeof galleryInputSchema>;
export type GalleryData = z.output<typeof galleryInputSchema>;

export const galleryCaptionSchema = z.object({ caption: optionalText(160, "Keterangan") });
export type GalleryCaptionInput = z.input<typeof galleryCaptionSchema>;

export const galleryItemSchema = z.object({
  id: z.uuid(),
  caption: z.string().nullable(),
  photo: mediaRefSchema,
});
export type GalleryItem = z.infer<typeof galleryItemSchema>;

export const galleryListResponseSchema = z.object({ items: z.array(galleryItemSchema) });
export const galleryItemResponseSchema = z.object({ item: galleryItemSchema });
export const galleryOrderSchema = z.object({ ids: z.array(z.uuid()) });

// --- Amplop digital -------------------------------------------------------------------------------

export const GIFT_KINDS = ["bank", "ewallet"] as const;
export const giftKindSchema = z.enum(GIFT_KINDS);
export type GiftKind = z.infer<typeof giftKindSchema>;

export const GIFT_KIND_LABEL: Record<GiftKind, string> = {
  bank: "Rekening bank",
  ewallet: "E-wallet",
};

export const giftInputSchema = z.object({
  kind: giftKindSchema,
  /** Nama bank atau e-wallet, mis. "BCA" atau "DANA". */
  provider: z
    .string()
    .trim()
    .min(1, "Nama bank/e-wallet wajib diisi")
    .max(60, "Nama bank/e-wallet maksimal 60 karakter"),
  accountName: z
    .string()
    .trim()
    .min(1, "Atas nama wajib diisi")
    .max(120, "Atas nama maksimal 120 karakter"),
  accountNumber: z
    .string()
    .trim()
    .min(1, "Nomor wajib diisi")
    .max(40, "Nomor maksimal 40 karakter"),
  /** Gambar QR (mis. QRIS), opsional. */
  qrMediaId: photoId,
});
export type GiftInput = z.input<typeof giftInputSchema>;
export type GiftData = z.output<typeof giftInputSchema>;

export const giftSchema = z.object({
  id: z.uuid(),
  kind: giftKindSchema,
  provider: z.string(),
  accountName: z.string(),
  accountNumber: z.string(),
  qr: mediaRefSchema.nullable(),
});
export type Gift = z.infer<typeof giftSchema>;

export const giftListResponseSchema = z.object({ items: z.array(giftSchema) });
export const giftResponseSchema = z.object({ item: giftSchema });
export const giftOrderSchema = z.object({ ids: z.array(z.uuid()) });

// --- FAQ ------------------------------------------------------------------------------------------

export const faqInputSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Pertanyaan wajib diisi")
    .max(200, "Pertanyaan maksimal 200 karakter"),
  answer: z
    .string()
    .trim()
    .min(1, "Jawaban wajib diisi")
    .max(1000, "Jawaban maksimal 1000 karakter"),
});
export type FaqInput = z.input<typeof faqInputSchema>;
export type FaqData = z.output<typeof faqInputSchema>;

export const faqSchema = z.object({ id: z.uuid(), question: z.string(), answer: z.string() });
export type Faq = z.infer<typeof faqSchema>;

export const faqListResponseSchema = z.object({ items: z.array(faqSchema) });
export const faqResponseSchema = z.object({ item: faqSchema });
export const faqOrderSchema = z.object({ ids: z.array(z.uuid()) });

// --- Wishlist hadiah ------------------------------------------------------------------------------

export const wishInputSchema = z.object({
  name: z.string().trim().min(1, "Nama hadiah wajib diisi").max(120, "Nama maksimal 120 karakter"),
  note: optionalText(300, "Keterangan"),
  /** Tautan toko atau produk, opsional. */
  url: z
    .string()
    .trim()
    .max(500, "Tautan maksimal 500 karakter")
    .nullish()
    .transform((value, ctx) => {
      if (!value) return null;
      const parsed = z.url({ protocol: /^https?$/ }).safeParse(value);
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", message: "Tautan harus diawali http:// atau https://" });
        return z.NEVER;
      }
      return value;
    }),
  photoMediaId: photoId,
  /** Sudah ada yang memberikan; diatur admin. */
  isFulfilled: z.boolean().default(false),
});
export type WishInput = z.input<typeof wishInputSchema>;
export type WishData = z.output<typeof wishInputSchema>;

export const wishSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  note: z.string().nullable(),
  url: z.string().nullable(),
  photo: mediaRefSchema.nullable(),
  isFulfilled: z.boolean(),
});
export type Wish = z.infer<typeof wishSchema>;

export const wishListResponseSchema = z.object({ items: z.array(wishSchema) });
export const wishResponseSchema = z.object({ item: wishSchema });
export const wishOrderSchema = z.object({ ids: z.array(z.uuid()) });

// --- Isi undangan untuk tamu ----------------------------------------------------------------------

export const invitationResponseSchema = z.object({
  couple: coupleSchema,
  story: z.array(storyItemSchema),
  gallery: z.array(galleryItemSchema),
  gifts: z.array(giftSchema),
  faqs: z.array(faqSchema),
  wishes: z.array(wishSchema),
});
export type InvitationResponse = z.infer<typeof invitationResponseSchema>;
