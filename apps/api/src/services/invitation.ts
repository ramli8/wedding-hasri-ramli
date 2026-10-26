import {
  type CoupleProfile,
  type CoupleProfileData,
  type CoupleRole,
  type Faq,
  type FaqData,
  type GalleryData,
  type GalleryItem,
  type Gift,
  type GiftData,
  type GiftKind,
  type MediaRef,
  mediaUrl,
  type StoryData,
  type StoryItem,
  type Wish,
  type WishData,
} from "@wedding/shared";
import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import {
  coupleProfiles,
  faqItems,
  galleryItems,
  giftAccounts,
  invitationCover,
  media,
  settings,
  storyItems,
  wishlistClaims,
  wishlistItems,
} from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { discardMedia } from "./media.js";

export const toRef = (row: typeof media.$inferSelect | null): MediaRef | null =>
  row
    ? {
        id: row.id,
        width: row.width,
        height: row.height,
        large: mediaUrl(row.id, "large"),
        thumb: mediaUrl(row.id, "thumb"),
      }
    : null;

/** Gambar yang dipilih harus sudah diunggah dan belum dipakai bagian lain. */
export async function assertPhotoUsable(db: Db, photoId: string | null, own: string | null) {
  if (!photoId || photoId === own) return;
  const [row] = await db.select({ id: media.id }).from(media).where(eq(media.id, photoId)).limit(1);
  if (!row) throw new AppError(400, "VALIDATION_ERROR", "Gambar tidak ditemukan. Unggah ulang.");
  const used = await db.execute(
    sql`select 1 from ${coupleProfiles} where ${coupleProfiles.photoMediaId} = ${photoId}
        union all select 1 from ${storyItems} where ${storyItems.photoMediaId} = ${photoId}
        union all select 1 from ${galleryItems} where ${galleryItems.photoMediaId} = ${photoId}
        union all select 1 from ${giftAccounts} where ${giftAccounts.qrMediaId} = ${photoId}
        union all select 1 from ${wishlistItems} where ${wishlistItems.photoMediaId} = ${photoId}
        union all select 1 from ${invitationCover} where ${invitationCover.photoMediaId} = ${photoId}
        union all select 1 from ${settings} where ${settings.seoImageMediaId} = ${photoId} limit 1`,
  );
  if (used.length > 0) {
    throw new AppError(409, "CONFLICT", "Gambar ini sudah dipakai di bagian lain");
  }
}

// --- Profil mempelai ------------------------------------------------------------------------------

type ProfileRow = typeof coupleProfiles.$inferSelect;

const toProfile = (row: ProfileRow, photo: typeof media.$inferSelect | null): CoupleProfile => ({
  role: row.role as CoupleRole,
  fullName: row.fullName,
  nickname: row.nickname,
  parents: row.parents,
  bio: row.bio,
  instagram: row.instagram,
  photo: toRef(photo),
});

export async function getCouple(db: Db) {
  const rows = await db
    .select({ profile: coupleProfiles, photo: media })
    .from(coupleProfiles)
    .leftJoin(media, eq(media.id, coupleProfiles.photoMediaId));
  const byRole = new Map(rows.map((r) => [r.profile.role, toProfile(r.profile, r.photo)]));
  return { groom: byRole.get("groom") ?? null, bride: byRole.get("bride") ?? null };
}

export async function saveCoupleProfile(
  db: Db,
  dir: string,
  role: CoupleRole,
  input: CoupleProfileData,
): Promise<CoupleProfile> {
  const [existing] = await db
    .select()
    .from(coupleProfiles)
    .where(eq(coupleProfiles.role, role))
    .limit(1);
  await assertPhotoUsable(db, input.photoMediaId, existing?.photoMediaId ?? null);

  const values = {
    fullName: input.fullName,
    nickname: input.nickname,
    parents: input.parents,
    bio: input.bio,
    instagram: input.instagram,
    photoMediaId: input.photoMediaId,
    updatedAt: new Date(),
  };
  await db
    .insert(coupleProfiles)
    .values({ role, ...values })
    .onConflictDoUpdate({ target: coupleProfiles.role, set: values });

  // Foto lama yang diganti atau dilepas tidak dipakai lagi: hapus berkasnya.
  if (existing?.photoMediaId && existing.photoMediaId !== input.photoMediaId) {
    await discardMedia(db, dir, existing.photoMediaId);
  }
  const couple = await getCouple(db);
  const saved = couple[role];
  if (!saved) throw new Error("Gagal menyimpan profil");
  return saved;
}

// --- Cerita ---------------------------------------------------------------------------------------

type StoryRow = typeof storyItems.$inferSelect;

const toStory = (row: StoryRow, photo: typeof media.$inferSelect | null): StoryItem => ({
  id: row.id,
  whenLabel: row.whenLabel,
  title: row.title,
  body: row.body,
  photo: toRef(photo),
});

export async function listStory(db: Db): Promise<StoryItem[]> {
  const rows = await db
    .select({ item: storyItems, photo: media })
    .from(storyItems)
    .leftJoin(media, eq(media.id, storyItems.photoMediaId))
    .orderBy(asc(storyItems.sortOrder), asc(storyItems.createdAt), asc(storyItems.id));
  return rows.map((r) => toStory(r.item, r.photo));
}

async function getStoryItem(db: Db, id: string): Promise<StoryItem> {
  const [row] = await db
    .select({ item: storyItems, photo: media })
    .from(storyItems)
    .leftJoin(media, eq(media.id, storyItems.photoMediaId))
    .where(eq(storyItems.id, id))
    .limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Butir cerita tidak ditemukan");
  return toStory(row.item, row.photo);
}

export async function createStoryItem(db: Db, input: StoryData): Promise<StoryItem> {
  await assertPhotoUsable(db, input.photoMediaId, null);
  const [row] = await db
    .insert(storyItems)
    .values({
      sortOrder: sql`(select coalesce(max(${storyItems.sortOrder}), 0) + 1 from ${storyItems})`,
      whenLabel: input.whenLabel,
      title: input.title,
      body: input.body,
      photoMediaId: input.photoMediaId,
    })
    .returning({ id: storyItems.id });
  if (!row) throw new Error("Gagal membuat butir cerita");
  return getStoryItem(db, row.id);
}

export async function updateStoryItem(
  db: Db,
  dir: string,
  id: string,
  input: StoryData,
): Promise<StoryItem> {
  const [existing] = await db.select().from(storyItems).where(eq(storyItems.id, id)).limit(1);
  if (!existing) throw new AppError(404, "NOT_FOUND", "Butir cerita tidak ditemukan");
  await assertPhotoUsable(db, input.photoMediaId, existing.photoMediaId);

  await db
    .update(storyItems)
    .set({
      whenLabel: input.whenLabel,
      title: input.title,
      body: input.body,
      photoMediaId: input.photoMediaId,
    })
    .where(eq(storyItems.id, id));
  if (existing.photoMediaId && existing.photoMediaId !== input.photoMediaId) {
    await discardMedia(db, dir, existing.photoMediaId);
  }
  return getStoryItem(db, id);
}

export async function deleteStoryItem(db: Db, dir: string, id: string): Promise<void> {
  const [deleted] = await db
    .delete(storyItems)
    .where(eq(storyItems.id, id))
    .returning({ photoMediaId: storyItems.photoMediaId });
  if (!deleted) throw new AppError(404, "NOT_FOUND", "Butir cerita tidak ditemukan");
  await discardMedia(db, dir, deleted.photoMediaId);
}

/** Mengatur urutan: `ids` harus memuat semua butir cerita tepat satu kali. */
export async function reorderStory(db: Db, ids: string[]): Promise<StoryItem[]> {
  await db.transaction(async (tx) => {
    const current = await tx.select({ id: storyItems.id }).from(storyItems);
    const same =
      ids.length === current.length &&
      new Set(ids).size === ids.length &&
      current.every((row) => ids.includes(row.id));
    if (!same) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Daftar urutan tidak sama dengan isi cerita. Muat ulang halaman.",
      );
    }
    for (const [index, id] of ids.entries()) {
      await tx
        .update(storyItems)
        .set({ sortOrder: index + 1 })
        .where(eq(storyItems.id, id));
    }
  });
  return listStory(db);
}

// --- Galeri ---------------------------------------------------------------------------------------

const toGallery = (row: typeof galleryItems.$inferSelect, photo: typeof media.$inferSelect) => {
  const ref = toRef(photo);
  if (!ref) throw new Error("Foto galeri tanpa gambar");
  return { id: row.id, caption: row.caption, photo: ref } satisfies GalleryItem;
};

export async function listGallery(db: Db): Promise<GalleryItem[]> {
  const rows = await db
    .select({ item: galleryItems, photo: media })
    .from(galleryItems)
    .innerJoin(media, eq(media.id, galleryItems.photoMediaId))
    .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt), asc(galleryItems.id));
  return rows.map((r) => toGallery(r.item, r.photo));
}

async function getGalleryItem(db: Db, id: string): Promise<GalleryItem> {
  const [row] = await db
    .select({ item: galleryItems, photo: media })
    .from(galleryItems)
    .innerJoin(media, eq(media.id, galleryItems.photoMediaId))
    .where(eq(galleryItems.id, id))
    .limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Foto galeri tidak ditemukan");
  return toGallery(row.item, row.photo);
}

export async function createGalleryItem(db: Db, input: GalleryData): Promise<GalleryItem> {
  await assertPhotoUsable(db, input.mediaId, null);
  const [row] = await db
    .insert(galleryItems)
    .values({
      sortOrder: sql`(select coalesce(max(${galleryItems.sortOrder}), 0) + 1 from ${galleryItems})`,
      caption: input.caption,
      photoMediaId: input.mediaId,
    })
    .returning({ id: galleryItems.id });
  if (!row) throw new Error("Gagal menambah foto galeri");
  return getGalleryItem(db, row.id);
}

export async function updateGalleryCaption(
  db: Db,
  id: string,
  caption: string | null,
): Promise<GalleryItem> {
  const [row] = await db
    .update(galleryItems)
    .set({ caption })
    .where(eq(galleryItems.id, id))
    .returning({ id: galleryItems.id });
  if (!row) throw new AppError(404, "NOT_FOUND", "Foto galeri tidak ditemukan");
  return getGalleryItem(db, id);
}

export async function deleteGalleryItem(db: Db, dir: string, id: string): Promise<void> {
  const [deleted] = await db
    .delete(galleryItems)
    .where(eq(galleryItems.id, id))
    .returning({ photoMediaId: galleryItems.photoMediaId });
  if (!deleted) throw new AppError(404, "NOT_FOUND", "Foto galeri tidak ditemukan");
  await discardMedia(db, dir, deleted.photoMediaId);
}

/** Mengatur urutan: `ids` harus memuat semua foto galeri tepat satu kali. */
export async function reorderGallery(db: Db, ids: string[]): Promise<GalleryItem[]> {
  await db.transaction(async (tx) => {
    const current = await tx.select({ id: galleryItems.id }).from(galleryItems);
    const same =
      ids.length === current.length &&
      new Set(ids).size === ids.length &&
      current.every((row) => ids.includes(row.id));
    if (!same) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Daftar urutan tidak sama dengan isi galeri. Muat ulang halaman.",
      );
    }
    for (const [index, id] of ids.entries()) {
      await tx
        .update(galleryItems)
        .set({ sortOrder: index + 1 })
        .where(eq(galleryItems.id, id));
    }
  });
  return listGallery(db);
}

// --- Amplop digital -------------------------------------------------------------------------------

const toGift = (
  row: typeof giftAccounts.$inferSelect,
  qr: typeof media.$inferSelect | null,
): Gift => ({
  id: row.id,
  kind: row.kind as GiftKind,
  provider: row.provider,
  accountName: row.accountName,
  accountNumber: row.accountNumber,
  qr: toRef(qr),
});

export async function listGifts(db: Db): Promise<Gift[]> {
  const rows = await db
    .select({ item: giftAccounts, qr: media })
    .from(giftAccounts)
    .leftJoin(media, eq(media.id, giftAccounts.qrMediaId))
    .orderBy(asc(giftAccounts.sortOrder), asc(giftAccounts.createdAt), asc(giftAccounts.id));
  return rows.map((r) => toGift(r.item, r.qr));
}

async function getGift(db: Db, id: string): Promise<Gift> {
  const [row] = await db
    .select({ item: giftAccounts, qr: media })
    .from(giftAccounts)
    .leftJoin(media, eq(media.id, giftAccounts.qrMediaId))
    .where(eq(giftAccounts.id, id))
    .limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Rekening tidak ditemukan");
  return toGift(row.item, row.qr);
}

export async function createGift(db: Db, input: GiftData): Promise<Gift> {
  await assertPhotoUsable(db, input.qrMediaId, null);
  const [row] = await db
    .insert(giftAccounts)
    .values({
      sortOrder: sql`(select coalesce(max(${giftAccounts.sortOrder}), 0) + 1 from ${giftAccounts})`,
      kind: input.kind,
      provider: input.provider,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      qrMediaId: input.qrMediaId,
    })
    .returning({ id: giftAccounts.id });
  if (!row) throw new Error("Gagal menambah rekening");
  return getGift(db, row.id);
}

export async function updateGift(db: Db, dir: string, id: string, input: GiftData): Promise<Gift> {
  const [existing] = await db.select().from(giftAccounts).where(eq(giftAccounts.id, id)).limit(1);
  if (!existing) throw new AppError(404, "NOT_FOUND", "Rekening tidak ditemukan");
  await assertPhotoUsable(db, input.qrMediaId, existing.qrMediaId);

  await db
    .update(giftAccounts)
    .set({
      kind: input.kind,
      provider: input.provider,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      qrMediaId: input.qrMediaId,
    })
    .where(eq(giftAccounts.id, id));
  if (existing.qrMediaId && existing.qrMediaId !== input.qrMediaId) {
    await discardMedia(db, dir, existing.qrMediaId);
  }
  return getGift(db, id);
}

export async function deleteGift(db: Db, dir: string, id: string): Promise<void> {
  const [deleted] = await db
    .delete(giftAccounts)
    .where(eq(giftAccounts.id, id))
    .returning({ qrMediaId: giftAccounts.qrMediaId });
  if (!deleted) throw new AppError(404, "NOT_FOUND", "Rekening tidak ditemukan");
  await discardMedia(db, dir, deleted.qrMediaId);
}

/** Mengatur urutan: `ids` harus memuat semua rekening tepat satu kali. */
export async function reorderGifts(db: Db, ids: string[]): Promise<Gift[]> {
  await db.transaction(async (tx) => {
    const current = await tx.select({ id: giftAccounts.id }).from(giftAccounts);
    const same =
      ids.length === current.length &&
      new Set(ids).size === ids.length &&
      current.every((row) => ids.includes(row.id));
    if (!same) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Daftar urutan tidak sama dengan isi amplop. Muat ulang halaman.",
      );
    }
    for (const [index, id] of ids.entries()) {
      await tx
        .update(giftAccounts)
        .set({ sortOrder: index + 1 })
        .where(eq(giftAccounts.id, id));
    }
  });
  return listGifts(db);
}

// --- FAQ ------------------------------------------------------------------------------------------

const toFaq = (row: typeof faqItems.$inferSelect): Faq => ({
  id: row.id,
  question: row.question,
  answer: row.answer,
});

export async function listFaqs(db: Db): Promise<Faq[]> {
  const rows = await db
    .select()
    .from(faqItems)
    .orderBy(asc(faqItems.sortOrder), asc(faqItems.createdAt), asc(faqItems.id));
  return rows.map(toFaq);
}

export async function createFaq(db: Db, input: FaqData): Promise<Faq> {
  const [row] = await db
    .insert(faqItems)
    .values({
      sortOrder: sql`(select coalesce(max(${faqItems.sortOrder}), 0) + 1 from ${faqItems})`,
      question: input.question,
      answer: input.answer,
    })
    .returning();
  if (!row) throw new Error("Gagal menambah FAQ");
  return toFaq(row);
}

export async function updateFaq(db: Db, id: string, input: FaqData): Promise<Faq> {
  const [row] = await db
    .update(faqItems)
    .set({ question: input.question, answer: input.answer })
    .where(eq(faqItems.id, id))
    .returning();
  if (!row) throw new AppError(404, "NOT_FOUND", "FAQ tidak ditemukan");
  return toFaq(row);
}

export async function deleteFaq(db: Db, id: string): Promise<void> {
  const [row] = await db.delete(faqItems).where(eq(faqItems.id, id)).returning({ id: faqItems.id });
  if (!row) throw new AppError(404, "NOT_FOUND", "FAQ tidak ditemukan");
}

/** Mengatur urutan: `ids` harus memuat semua FAQ tepat satu kali. */
export async function reorderFaqs(db: Db, ids: string[]): Promise<Faq[]> {
  await db.transaction(async (tx) => {
    const current = await tx.select({ id: faqItems.id }).from(faqItems);
    const same =
      ids.length === current.length &&
      new Set(ids).size === ids.length &&
      current.every((row) => ids.includes(row.id));
    if (!same) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Daftar urutan tidak sama dengan isinya. Muat ulang halaman.",
      );
    }
    for (const [index, id] of ids.entries()) {
      await tx
        .update(faqItems)
        .set({ sortOrder: index + 1 })
        .where(eq(faqItems.id, id));
    }
  });
  return listFaqs(db);
}

// --- Wishlist hadiah ------------------------------------------------------------------------------

/** Jumlah yang dipilih tamu per hadiah. */
async function claimedTotals(db: Db, wishId?: string): Promise<Map<string, number>> {
  const rows = await db
    .select({
      wishId: wishlistClaims.wishId,
      total: sql<number>`coalesce(sum(${wishlistClaims.quantity}), 0)::int`,
    })
    .from(wishlistClaims)
    .where(wishId ? eq(wishlistClaims.wishId, wishId) : undefined)
    .groupBy(wishlistClaims.wishId);
  return new Map(rows.map((r) => [r.wishId, r.total]));
}

const toWish = (
  row: typeof wishlistItems.$inferSelect,
  photo: typeof media.$inferSelect | null,
  claimed: number,
): Wish => ({
  id: row.id,
  name: row.name,
  note: row.note,
  url: row.url,
  photo: toRef(photo),
  quantity: row.quantity,
  claimed,
  isFulfilled: claimed >= row.quantity,
});

export async function listWishes(db: Db): Promise<Wish[]> {
  const rows = await db
    .select({ item: wishlistItems, photo: media })
    .from(wishlistItems)
    .leftJoin(media, eq(media.id, wishlistItems.photoMediaId))
    .orderBy(asc(wishlistItems.sortOrder), asc(wishlistItems.createdAt), asc(wishlistItems.id));
  const claimed = await claimedTotals(db);
  return rows.map((r) => toWish(r.item, r.photo, claimed.get(r.item.id) ?? 0));
}

export async function getWish(db: Db, id: string): Promise<Wish> {
  const [row] = await db
    .select({ item: wishlistItems, photo: media })
    .from(wishlistItems)
    .leftJoin(media, eq(media.id, wishlistItems.photoMediaId))
    .where(eq(wishlistItems.id, id))
    .limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Hadiah tidak ditemukan");
  const claimed = await claimedTotals(db, id);
  return toWish(row.item, row.photo, claimed.get(id) ?? 0);
}

export async function createWish(db: Db, input: WishData): Promise<Wish> {
  await assertPhotoUsable(db, input.photoMediaId, null);
  const [row] = await db
    .insert(wishlistItems)
    .values({
      sortOrder: sql`(select coalesce(max(${wishlistItems.sortOrder}), 0) + 1 from ${wishlistItems})`,
      name: input.name,
      note: input.note,
      url: input.url,
      photoMediaId: input.photoMediaId,
      quantity: input.quantity,
    })
    .returning({ id: wishlistItems.id });
  if (!row) throw new Error("Gagal menambah hadiah");
  return getWish(db, row.id);
}

export async function updateWish(db: Db, dir: string, id: string, input: WishData): Promise<Wish> {
  const [existing] = await db.select().from(wishlistItems).where(eq(wishlistItems.id, id)).limit(1);
  if (!existing) throw new AppError(404, "NOT_FOUND", "Hadiah tidak ditemukan");
  await assertPhotoUsable(db, input.photoMediaId, existing.photoMediaId);
  const claimed = (await claimedTotals(db, id)).get(id) ?? 0;
  if (input.quantity < claimed) {
    throw new AppError(
      409,
      "CONFLICT",
      `Jumlah dibutuhkan tidak boleh kurang dari yang sudah terpenuhi (${claimed}).`,
    );
  }

  await db
    .update(wishlistItems)
    .set({
      name: input.name,
      note: input.note,
      url: input.url,
      photoMediaId: input.photoMediaId,
      quantity: input.quantity,
    })
    .where(eq(wishlistItems.id, id));
  if (existing.photoMediaId && existing.photoMediaId !== input.photoMediaId) {
    await discardMedia(db, dir, existing.photoMediaId);
  }
  return getWish(db, id);
}

export async function deleteWish(db: Db, dir: string, id: string): Promise<void> {
  const [deleted] = await db
    .delete(wishlistItems)
    .where(eq(wishlistItems.id, id))
    .returning({ photoMediaId: wishlistItems.photoMediaId });
  if (!deleted) throw new AppError(404, "NOT_FOUND", "Hadiah tidak ditemukan");
  await discardMedia(db, dir, deleted.photoMediaId);
}

/** Mengatur urutan: `ids` harus memuat semua hadiah tepat satu kali. */
export async function reorderWishes(db: Db, ids: string[]): Promise<Wish[]> {
  await db.transaction(async (tx) => {
    const current = await tx.select({ id: wishlistItems.id }).from(wishlistItems);
    const same =
      ids.length === current.length &&
      new Set(ids).size === ids.length &&
      current.every((row) => ids.includes(row.id));
    if (!same) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Daftar urutan tidak sama dengan isinya. Muat ulang halaman.",
      );
    }
    for (const [index, id] of ids.entries()) {
      await tx
        .update(wishlistItems)
        .set({ sortOrder: index + 1 })
        .where(eq(wishlistItems.id, id));
    }
  });
  return listWishes(db);
}
