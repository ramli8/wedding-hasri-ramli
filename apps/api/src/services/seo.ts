import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  mediaUrl,
  renderSeoText,
  type Seo,
  type SeoInput,
} from "@wedding/shared";
import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { media, settings } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { assertPhotoUsable, toRef } from "./invitation.js";
import { discardMedia } from "./media.js";

async function getRow(db: Db) {
  const [row] = await db.select().from(settings).limit(1);
  return row ?? null;
}

export async function getSeo(db: Db): Promise<Seo> {
  const row = await getRow(db);
  const [image] = row?.seoImageMediaId
    ? await db.select().from(media).where(eq(media.id, row.seoImageMediaId)).limit(1)
    : [];
  return {
    title: row?.seoTitle ?? "",
    description: row?.seoDescription ?? "",
    image: toRef(image ?? null),
  };
}

export async function saveSeo(db: Db, mediaDir: string, input: SeoInput): Promise<Seo> {
  const row = await getRow(db);
  if (!row) {
    throw new AppError(409, "CONFLICT", "Isi data pernikahan dulu (Pengaturan → Pernikahan).");
  }
  const imageId = input.imageMediaId ?? null;
  await assertPhotoUsable(db, imageId, row.seoImageMediaId);
  await db
    .update(settings)
    .set({
      seoTitle: input.title.trim() || null,
      seoDescription: input.description.trim() || null,
      seoImageMediaId: imageId,
      updatedAt: new Date(),
    })
    .where(eq(settings.id, 1));
  if (row.seoImageMediaId && row.seoImageMediaId !== imageId) {
    await discardMedia(db, mediaDir, row.seoImageMediaId);
  }
  return getSeo(db);
}

export type LinkPreview = {
  title: string;
  description: string;
  /** Alamat gambar absolut (WhatsApp dan Instagram menolak alamat relatif); null bila belum diatur. */
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
    description: renderSeoText(row.seoDescription || DEFAULT_SEO_DESCRIPTION, values),
    // Varian thumb (480px) ringan, cukup untuk kartu pratinjau; `large` terlalu besar untuk WhatsApp.
    image: row.seoImageMediaId ? `${base}${mediaUrl(row.seoImageMediaId, "thumb")}` : null,
    url: `${base}${input.path}`,
    siteName: values.mempelai,
  };
}
