import {
  DEFAULT_SEO_TITLE,
  mediaOgUrl,
  renderSeoText,
  type Seo,
  type SeoInput,
} from "@wedding/shared";
import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { media, settings } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { assertPhotoUsable, toRef } from "./invitation.js";
import { discardMedia, isMediaReferenced } from "./media.js";

async function getRow(db: Db) {
  const [row] = await db.select().from(settings).limit(1);
  return row ?? null;
}

export async function getSeo(db: Db): Promise<Seo> {
  const row = await getRow(db);
  const load = async (id: string | null | undefined) =>
    id ? ((await db.select().from(media).where(eq(media.id, id)).limit(1))[0] ?? null) : null;
  return {
    title: row?.seoTitle ?? "",
    description: row?.seoDescription ?? "",
    image: toRef(await load(row?.seoImageMediaId)),
    logo: toRef(await load(row?.logoMediaId)),
  };
}

export async function saveSeo(db: Db, mediaDir: string, input: SeoInput): Promise<Seo> {
  const row = await getRow(db);
  if (!row) {
    throw new AppError(409, "CONFLICT", "Isi data pernikahan dulu (Pengaturan → Situs).");
  }
  const imageId = input.imageMediaId ?? null;
  const logoId = input.logoMediaId ?? null;
  if (imageId && imageId === logoId) {
    throw new AppError(409, "CONFLICT", "Logo dan gambar kartu harus berkas yang berbeda");
  }
  await assertPhotoUsable(db, imageId, row.seoImageMediaId);
  if (logoId && logoId !== row.logoMediaId) {
    const [found] = await db.select({ id: media.id }).from(media).where(eq(media.id, logoId));
    if (!found) throw new AppError(400, "VALIDATION_ERROR", "Logo tidak ditemukan. Unggah ulang.");
    if (await isMediaReferenced(db, logoId)) {
      throw new AppError(409, "CONFLICT", "Gambar ini sudah dipakai di bagian lain");
    }
  }
  await db
    .update(settings)
    .set({
      seoTitle: input.title.trim() || null,
      seoDescription: input.description.trim() || null,
      seoImageMediaId: imageId,
      logoMediaId: logoId,
      updatedAt: new Date(),
    })
    .where(eq(settings.id, 1));
  if (row.seoImageMediaId && row.seoImageMediaId !== imageId) {
    await discardMedia(db, mediaDir, row.seoImageMediaId);
  }
  if (row.logoMediaId && row.logoMediaId !== logoId) {
    await discardMedia(db, mediaDir, row.logoMediaId);
  }
  return getSeo(db);
}

export type LinkPreview = {
  title: string;
  /** Kosong: kartu hanya berisi gambar, judul, dan alamat (isi pesan diatur di Pesan WhatsApp). */
  description: string | null;
  /**
   * Alamat gambar absolut (WhatsApp dan Instagram menolak alamat relatif), JPEG OG_WIDTH ×
   * OG_HEIGHT; null bila belum diatur.
   */
  image: string | null;
  url: string;
  siteName: string;
};

/** Bahan tag Open Graph untuk satu tamu; null bila pengaturan pernikahan belum diisi. */
export async function buildPreview(
  db: Db,
  input: { panggilan: string; path: string },
): Promise<LinkPreview | null> {
  const row = await getRow(db);
  if (!row) return null;
  const values = {
    panggilan: input.panggilan,
    mempelai: `${row.brideName} & ${row.groomName}`,
  };
  const base = row.publicBaseUrl.replace(/\/+$/, "");
  return {
    title: renderSeoText(row.seoTitle || DEFAULT_SEO_TITLE, values),
    description: row.seoDescription ? renderSeoText(row.seoDescription, values) : null,
    // JPEG 1200 × 630: ukuran yang membuat WhatsApp menampilkan gambar besar; WebP sering ditolak.
    image: row.seoImageMediaId ? `${base}${mediaOgUrl(row.seoImageMediaId)}` : null,
    url: `${base}${input.path}`,
    siteName: values.mempelai,
  };
}

/** Bahan tag Open Graph untuk satu foto photobooth (/foto/<id>); null bila pengaturan kosong. */
export async function buildPhotoPreview(
  db: Db,
  input: { id: string; mediaId: string },
): Promise<LinkPreview | null> {
  const row = await getRow(db);
  if (!row) return null;
  const mempelai = `${row.brideName} & ${row.groomName}`;
  const base = row.publicBaseUrl.replace(/\/+$/, "");
  return {
    title: `Foto photobooth · ${mempelai}`,
    description:
      "Kenangan dari photobooth pernikahan kami. Buka untuk melihat dan mengunduh fotonya.",
    image: `${base}${mediaOgUrl(input.mediaId)}`,
    url: `${base}/foto/${input.id}`,
    siteName: mempelai,
  };
}
