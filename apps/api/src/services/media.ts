import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  MAX_LARGE_SIDE,
  MEDIA_JPEG_FILE,
  MEDIA_OG_FILE,
  type Media,
  type MediaVariant,
  mediaUrl,
  OG_HEIGHT,
  OG_WIDTH,
  SITE_ICONS,
  type SiteIconName,
  THUMB_SIDE,
} from "@wedding/shared";
import { and, desc, eq, lt, sql } from "drizzle-orm";
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
  { table: "gallery_items", column: "photo_media_id" },
  { table: "gift_accounts", column: "qr_media_id" },
  { table: "wishlist_items", column: "photo_media_id" },
  { table: "invitation_cover", column: "photo_media_id" },
  { table: "settings", column: "seo_image_media_id" },
  { table: "settings", column: "logo_media_id" },
  { table: "booth_photos", column: "media_id" },
  { table: "vendor_payments", column: "proof_media_id" },
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
  // Satu kueri untuk semua kandidat: tanpa ini setiap gambar lama (mis. ratusan foto booth) dicek
  // ke setiap tabel pemakai satu per satu pada setiap unggahan.
  const unused = and(
    ...MEDIA_USERS.map(
      ({ table, column }) =>
        sql`not exists (select 1 from ${sql.identifier(table)} where ${sql.identifier(column)} = ${media.id})`,
    ),
  );
  const old = await db
    .select({ id: media.id })
    .from(media)
    .where(and(lt(media.createdAt, new Date(now - ORPHAN_TTL_MS)), unused));
  let removed = 0;
  for (const { id } of old) {
    // Cek ulang per gambar: bisa saja baru dipakai di antara kueri di atas dan penghapusan.
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

/**
 * Salinan JPEG untuk foto yang diunduh/dibagikan tamu (`photo.jpg`, lihat MEDIA_JPEG_FILE).
 * Kualitas 95 tanpa pengurangan warna (4:4:4), jadi selisihnya dengan aslinya tidak terlihat.
 * Ditulis lewat berkas sementara lalu di-rename, agar permintaan yang bersamaan tidak pernah
 * membaca berkas setengah jadi.
 */
export async function saveJpegCopy(dir: string, id: string, input: Buffer): Promise<Buffer> {
  const data = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({
      width: MAX_LARGE_SIDE,
      height: MAX_LARGE_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
  const tmp = join(dir, id, `${MEDIA_JPEG_FILE}.${randomUUID()}.tmp`);
  await writeFile(tmp, data);
  await rename(tmp, join(dir, id, MEDIA_JPEG_FILE));
  return data;
}

/**
 * Isi salinan JPEG, atau null bila gambarnya tidak ada. Foto lama yang belum punya salinan dibuat
 * sekali dari varian `large` (near-lossless) lalu disimpan.
 */
export async function readJpeg(dir: string, id: string): Promise<Buffer | null> {
  try {
    return await readFile(join(dir, id, MEDIA_JPEG_FILE));
  } catch {
    const large = await readVariant(dir, id, "large");
    if (!large) return null;
    return saveJpegCopy(dir, id, large);
  }
}

/** Memastikan salinan JPEG ada (dibuat dari `large` bila belum) tanpa membaca isinya. */
export async function ensureJpeg(dir: string, id: string): Promise<void> {
  try {
    await access(join(dir, id, MEDIA_JPEG_FILE));
  } catch {
    await readJpeg(dir, id);
  }
}

/** Menulis berkas turunan lewat berkas sementara lalu rename (tidak pernah terbaca setengah jadi). */
async function writeDerived(dir: string, id: string, file: string, data: Buffer) {
  const tmp = join(dir, id, `${file}.${randomUUID()}.tmp`);
  await writeFile(tmp, data);
  await rename(tmp, join(dir, id, file));
}

/** Membaca berkas turunan; bila belum ada, dibuat sekali dari varian `large` lalu disimpan. */
async function readDerived(
  dir: string,
  id: string,
  file: string,
  make: (large: Buffer) => Promise<Buffer>,
): Promise<Buffer | null> {
  try {
    return await readFile(join(dir, id, file));
  } catch {
    const large = await readVariant(dir, id, "large");
    if (!large) return null;
    const data = await make(large);
    await writeDerived(dir, id, file, data);
    return data;
  }
}

/** Gambar kartu tautan: JPEG 1200 × 630, potongan tengah (lihat MEDIA_OG_FILE). */
export function readOgImage(dir: string, id: string): Promise<Buffer | null> {
  return readDerived(dir, id, MEDIA_OG_FILE, (large) =>
    sharp(large, { limitInputPixels: MAX_INPUT_PIXELS })
      .resize({ width: OG_WIDTH, height: OG_HEIGHT, fit: "cover", position: "centre" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer(),
  );
}

/** Satu ikon situs dari logo (lihat SITE_ICONS), PNG, disimpan di samping gambarnya. */
export function readSiteIcon(dir: string, id: string, name: SiteIconName): Promise<Buffer | null> {
  const { size, mode } = SITE_ICONS[name];
  return readDerived(dir, id, `icon-${name}`, async (large) => {
    const transparent = { r: 255, g: 255, b: 255, alpha: 0 };
    // Ikon maskable: logo di 80% tengah, sisanya latar, agar tidak terpotong lingkaran Android.
    const inner = mode === "maskable" ? Math.round(size * 0.8) : size;
    const logo = await sharp(large, { limitInputPixels: MAX_INPUT_PIXELS })
      .resize({ width: inner, height: inner, fit: "contain", background: transparent })
      .png()
      .toBuffer();
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: mode === "transparent" ? transparent : { r: 255, g: 255, b: 255, alpha: 1 },
      },
    });
    return canvas
      .composite([{ input: logo, gravity: "centre" }])
      .png({ compressionLevel: 9 })
      .toBuffer();
  });
}
