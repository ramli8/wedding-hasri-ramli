import {
  type CoupleProfile,
  type CoupleProfileData,
  type CoupleRole,
  type InvitationResponse,
  type MediaRef,
  mediaUrl,
  type StoryData,
  type StoryItem,
} from "@wedding/shared";
import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { coupleProfiles, media, storyItems } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { discardMedia } from "./media.js";

const toRef = (row: typeof media.$inferSelect | null): MediaRef | null =>
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
async function assertPhotoUsable(db: Db, photoId: string | null, own: string | null) {
  if (!photoId || photoId === own) return;
  const [row] = await db.select({ id: media.id }).from(media).where(eq(media.id, photoId)).limit(1);
  if (!row) throw new AppError(400, "VALIDATION_ERROR", "Gambar tidak ditemukan. Unggah ulang.");
  const used = await db.execute(
    sql`select 1 from ${coupleProfiles} where ${coupleProfiles.photoMediaId} = ${photoId}
        union all select 1 from ${storyItems} where ${storyItems.photoMediaId} = ${photoId} limit 1`,
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

// --- Untuk tamu -----------------------------------------------------------------------------------

export async function getInvitation(db: Db): Promise<InvitationResponse> {
  return { couple: await getCouple(db), story: await listStory(db) };
}
