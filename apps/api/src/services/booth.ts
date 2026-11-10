import { join } from "node:path";
import {
  BOOTH_FRAMES,
  type BoothConfig,
  type BoothFrame,
  type BoothPhoto,
  type BoothUpload,
  type BoothUploadResponse,
  mediaUrl,
} from "@wedding/shared";
import { count, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { boothConfig, boothPhotos, devices, media } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { zipFilesStream } from "./export.js";
import { discardMedia, saveMedia } from "./media.js";

/** Bingkai aktif; tanpa baris pengaturan semua bingkai bawaan aktif. */
export async function getBoothConfig(db: Db): Promise<BoothConfig> {
  const [row] = await db.select({ frames: boothConfig.frames }).from(boothConfig).limit(1);
  const frames = (row?.frames ?? []).filter((f): f is BoothFrame =>
    (BOOTH_FRAMES as readonly string[]).includes(f),
  );
  return { frames: frames.length > 0 ? frames : [...BOOTH_FRAMES] };
}

export async function saveBoothConfig(db: Db, input: BoothConfig): Promise<BoothConfig> {
  await db
    .insert(boothConfig)
    .values({ id: 1, frames: input.frames })
    .onConflictDoUpdate({
      target: boothConfig.id,
      set: { frames: input.frames, updatedAt: new Date() },
    });
  return input;
}

/**
 * Menyimpan foto dari booth. Id dibuat perangkat, jadi kiriman ulang (koneksi putus sebelum
 * jawaban sampai) dijawab sukses tanpa menyimpan gambar kedua.
 */
export async function saveBoothPhoto(
  db: Db,
  dir: string,
  deviceId: string,
  meta: BoothUpload,
  buffer: Buffer,
): Promise<BoothUploadResponse> {
  const exists = async () =>
    (await db.select({ id: boothPhotos.id }).from(boothPhotos).where(eq(boothPhotos.id, meta.id)))
      .length > 0;
  if (await exists()) return { id: meta.id, duplicate: true };

  const saved = await saveMedia(db, dir, {
    buffer,
    originalName: `photobooth-${meta.takenAt.slice(0, 19).replace(/[:T]/g, "-")}.jpg`,
  });
  const inserted = await db
    .insert(boothPhotos)
    .values({
      id: meta.id,
      mediaId: saved.id,
      frame: meta.frame,
      deviceId,
      takenAt: new Date(meta.takenAt),
    })
    .onConflictDoNothing({ target: boothPhotos.id })
    .returning({ id: boothPhotos.id });
  if (inserted.length === 0) {
    // Kiriman yang sama masuk bersamaan dan kalah: buang gambarnya sendiri.
    await discardMedia(db, dir, saved.id);
    return { id: meta.id, duplicate: true };
  }
  return { id: meta.id, duplicate: false };
}

export async function listBoothPhotos(
  db: Db,
  { page, pageSize }: { page: number; pageSize: number },
): Promise<{ items: BoothPhoto[]; total: number }> {
  const rows = await db
    .select({
      id: boothPhotos.id,
      frame: boothPhotos.frame,
      takenAt: boothPhotos.takenAt,
      deviceName: devices.name,
      mediaId: media.id,
      width: media.width,
      height: media.height,
    })
    .from(boothPhotos)
    .innerJoin(media, eq(media.id, boothPhotos.mediaId))
    .leftJoin(devices, eq(devices.id, boothPhotos.deviceId))
    .orderBy(desc(boothPhotos.takenAt), desc(boothPhotos.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ n: count() }).from(boothPhotos);

  return {
    total: totalRow?.n ?? 0,
    items: rows.map((row) => ({
      id: row.id,
      frame: row.frame as BoothFrame,
      takenAt: row.takenAt.toISOString(),
      deviceName: row.deviceName,
      media: {
        id: row.mediaId,
        width: row.width,
        height: row.height,
        large: mediaUrl(row.mediaId, "large"),
        thumb: mediaUrl(row.mediaId, "thumb"),
      },
    })),
  };
}

/**
 * ZIP semua foto booth (varian `large`, resolusi asli), urut waktu. Nama berkas memuat waktu WIB
 * agar mudah dicari, mis. `photobooth-2027-05-21_19-12-03-<id8>.webp`.
 */
export async function boothPhotosZip(db: Db, dir: string): Promise<ReadableStream<Uint8Array>> {
  const rows = await db
    .select({ id: boothPhotos.id, mediaId: boothPhotos.mediaId, takenAt: boothPhotos.takenAt })
    .from(boothPhotos)
    .orderBy(boothPhotos.takenAt, boothPhotos.id);
  return zipFilesStream(
    rows.map((row) => {
      const wib = new Date(row.takenAt.getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", "_")
        .replace(/:/g, "-");
      return {
        name: `photobooth-${wib}-${row.id.slice(-8)}.webp`,
        source: join(dir, row.mediaId, "large.webp"),
      };
    }),
  );
}

export async function deleteBoothPhoto(db: Db, dir: string, id: string): Promise<void> {
  const [row] = await db
    .delete(boothPhotos)
    .where(eq(boothPhotos.id, id))
    .returning({ mediaId: boothPhotos.mediaId });
  if (!row) throw new AppError(404, "NOT_FOUND", "Foto tidak ditemukan");
  await discardMedia(db, dir, row.mediaId);
}
