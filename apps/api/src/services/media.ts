import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  MAX_LARGE_SIDE,
  type Media,
  type MediaVariant,
  mediaUrl,
  THUMB_SIDE,
} from "@wedding/shared";
import { desc, eq, lt, sql } from "drizzle-orm";
import sharp from "sharp";
import type { Db } from "../db/client.js";
import { media } from "../db/schema.js";
import { AppError } from "../http/errors.js";

// Batas piksel gambar masukan (mencegah "bom dekompresi": berkas kecil yang terurai jadi raksasa).
const MAX_INPUT_PIXELS = 50_000_000;

/**
 * Tabel dan kolom yang menunjuk ke `media.id`. Gambar yang masih dipakai tidak boleh dihapus.
 * Tambahkan di sini setiap kali ada kolom foto baru.
 */
export const MEDIA_USERS: { table: string; column: string }[] = [
  { table: "couple_profiles", column: "photo_media_id" },
  { table: "story_items", column: "photo_media_id" },
];

const toMedia = (row: typeof media.$inferSelect): Media => ({
  id: row.id,
  width: row.width,
  height: row.height,
  bytes: row.bytes,
  originalName: row.originalName,
  createdAt: row.createdAt.toISOString(),
  large: mediaUrl(row.id, "large"),
  thumb: mediaUrl(row.id, "thumb"),
});

const unsupported = () =>
  new AppError(400, "VALIDATION_ERROR", "Berkas bukan gambar yang didukung (JPEG, PNG, atau WebP)");

/**
 * Mengodekan ke WebP: putar sesuai EXIF lalu buang metadata (termasuk lokasi GPS). Varian `large`
 * tidak diperkecil (kecuali melewati MAX_LARGE_SIDE) dan memakai mode near-lossless: selisih
 * piksel terhadap aslinya di bawah 1 dari 255, jadi detail halus dan warna tetap terjaga. WebP
 * berlossy biasa, bahkan di kualitas 95, masih mengurangi detail warna (selisih 2-5). Hanya
 * `thumb` yang dikecilkan dan berlossy.
 */
async function render(input: Buffer, variant: MediaVariant) {
  const side = variant === "large" ? MAX_LARGE_SIDE : THUMB_SIDE;
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width: side, height: side, fit: "inside", withoutEnlargement: true })
    .webp(variant === "large" ? { nearLossless: true, quality: 95 } : { quality: 80 })
    .toBuffer({ resolveWithObject: true });
}

export async function saveMedia(
  db: Db,
  dir: string,
  input: { buffer: Buffer; originalName: string | null },
): Promise<Media> {
  let large: Awaited<ReturnType<typeof render>>;
  let thumb: Awaited<ReturnType<typeof render>>;
  try {
    large = await render(input.buffer, "large");
    thumb = await render(input.buffer, "thumb");
  } catch {
    throw unsupported();
  }

  const id = randomUUID();
  const folder = join(dir, id);
  await mkdir(folder, { recursive: true });
  try {
    await writeFile(join(folder, "large.webp"), large.data);
    await writeFile(join(folder, "thumb.webp"), thumb.data);
    const [row] = await db
      .insert(media)
      .values({
        id,
        width: large.info.width,
        height: large.info.height,
        bytes: large.info.size,
        originalName: input.originalName?.slice(0, 200) || null,
      })
      .returning();
    if (!row) throw new Error("Gagal menyimpan gambar");
    return toMedia(row);
  } catch (err) {
    await rm(folder, { recursive: true, force: true });
    throw err;
  }
}

export async function listMedia(db: Db): Promise<Media[]> {
  const rows = await db.select().from(media).orderBy(desc(media.createdAt), desc(media.id));
  return rows.map(toMedia);
}

export async function isMediaReferenced(db: Db, id: string): Promise<boolean> {
  for (const { table, column } of MEDIA_USERS) {
    const rows = await db.execute(
      sql`select 1 from ${sql.identifier(table)} where ${sql.identifier(column)} = ${id} limit 1`,
    );
    if (rows.length > 0) return true;
  }
  return false;
}

/** Menghapus baris dan berkasnya. Menolak gambar yang masih dipakai bagian undangan. */
export async function deleteMedia(db: Db, dir: string, id: string): Promise<void> {
  const [row] = await db.select({ id: media.id }).from(media).where(eq(media.id, id)).limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Gambar tidak ditemukan");
  if (await isMediaReferenced(db, id)) {
    throw new AppError(409, "CONFLICT", "Gambar masih dipakai di undangan. Lepaskan dulu.");
  }
  await db.delete(media).where(eq(media.id, id));
  await rm(join(dir, id), { recursive: true, force: true });
}

/** Menghapus gambar yang sudah tidak dipakai (mis. foto lama yang diganti); tanpa galat bila sudah hilang. */
export async function discardMedia(db: Db, dir: string, id: string | null | undefined) {
  if (!id) return;
  try {
    await deleteMedia(db, dir, id);
  } catch (err) {
    if (err instanceof AppError && (err.status === 404 || err.status === 409)) return;
    throw err;
  }
}

/** Gambar yang diunggah tetapi tidak dipakai apa pun lebih lama dari ini dianggap terbuang. */
const ORPHAN_TTL_MS = 60 * 60 * 1000;

/**
 * Menghapus gambar yatim: diunggah di formulir yang lalu dibatalkan atau tidak pernah disimpan.
 * Dipanggil setiap ada unggahan baru, jadi tidak perlu penjadwal. Gambar yang sedang dipakai
 * tidak pernah disentuh (dicek lewat isMediaReferenced).
 */
export async function sweepOrphanMedia(db: Db, dir: string, now = Date.now()): Promise<number> {
  const old = await db
    .select({ id: media.id })
    .from(media)
    .where(lt(media.createdAt, new Date(now - ORPHAN_TTL_MS)));
  let removed = 0;
  for (const { id } of old) {
    if (await isMediaReferenced(db, id)) continue;
    await db.delete(media).where(eq(media.id, id));
    await rm(join(dir, id), { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

/** Isi berkas varian untuk disajikan, atau null bila tidak ada. */
export async function readVariant(
  dir: string,
  id: string,
  variant: MediaVariant,
): Promise<Buffer | null> {
  try {
    return await readFile(join(dir, id, `${variant}.webp`));
  } catch {
    return null;
  }
}
