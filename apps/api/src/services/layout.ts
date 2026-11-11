import {
  type Cover,
  type CoverData,
  type InvitationResponse,
  type LayoutResponse,
  type Live,
  type LiveData,
  SECTION_KEYS,
  type Section,
  type SectionKey,
} from "@wedding/shared";
import { asc, eq, min } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { events, invitationCover, invitationSections, media, settings } from "../db/schema.js";
import {
  assertPhotoUsable,
  getCouple,
  listFaqs,
  listGallery,
  listGifts,
  listStory,
  listWishes,
  toRef,
} from "./invitation.js";
import { discardMedia } from "./media.js";

// --- Sampul ---------------------------------------------------------------------------------------

export async function getCover(db: Db): Promise<Cover> {
  const [row] = await db
    .select({ cover: invitationCover, photo: media })
    .from(invitationCover)
    .leftJoin(media, eq(media.id, invitationCover.photoMediaId))
    .limit(1);
  return { greeting: row?.cover.greeting ?? null, photo: toRef(row?.photo ?? null) };
}

export async function saveCover(db: Db, dir: string, input: CoverData): Promise<Cover> {
  const [existing] = await db.select().from(invitationCover).limit(1);
  await assertPhotoUsable(db, input.photoMediaId, existing?.photoMediaId ?? null);

  const values = {
    greeting: input.greeting,
    photoMediaId: input.photoMediaId,
    updatedAt: new Date(),
  };
  await db
    .insert(invitationCover)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: invitationCover.id, set: values });

  if (existing?.photoMediaId && existing.photoMediaId !== input.photoMediaId) {
    await discardMedia(db, dir, existing.photoMediaId);
  }
  return getCover(db);
}

// --- Siaran langsung ------------------------------------------------------------------------------

export async function getLive(db: Db): Promise<Live | null> {
  const [row] = await db.select().from(invitationCover).limit(1);
  return row?.liveUrl ? { url: row.liveUrl, note: row.liveNote } : null;
}

export async function saveLive(db: Db, input: LiveData): Promise<Live | null> {
  const values = {
    liveUrl: input.url,
    liveNote: input.url ? input.note : null,
    updatedAt: new Date(),
  };
  await db
    .insert(invitationCover)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: invitationCover.id, set: values });
  return getLive(db);
}

// --- Susunan bagian -------------------------------------------------------------------------------

/** Semua bagian berurutan: yang tersimpan menurut urutannya, sisanya (belum diatur) menyusul. */
export async function getSections(db: Db): Promise<Section[]> {
  const rows = await db
    .select()
    .from(invitationSections)
    .orderBy(asc(invitationSections.sortOrder), asc(invitationSections.key));
  const known = new Set<string>(SECTION_KEYS);
  const saved = rows
    .filter((row) => known.has(row.key))
    .map((row) => ({ key: row.key as SectionKey, visible: row.isVisible }));
  const have = new Set(saved.map((s) => s.key));
  const rest = SECTION_KEYS.filter((key) => !have.has(key)).map((key) => ({ key, visible: true }));
  return [...saved, ...rest];
}

export async function saveSections(db: Db, items: Section[]): Promise<Section[]> {
  await db.transaction(async (tx) => {
    await tx.delete(invitationSections);
    await tx.insert(invitationSections).values(
      items.map((item, index) => ({
        key: item.key,
        sortOrder: index + 1,
        isVisible: item.visible,
      })),
    );
  });
  return getSections(db);
}

export async function getLayout(db: Db): Promise<LayoutResponse> {
  return { cover: await getCover(db), sections: await getSections(db), live: await getLive(db) };
}

// --- Untuk tamu -----------------------------------------------------------------------------------

export async function getInvitation(db: Db): Promise<InvitationResponse> {
  // Hitung mundur: waktu di Pengaturan, atau tanggal acara pertama.
  const [first] = await db.select({ at: min(events.startsAt) }).from(events);
  const [config] = await db.select({ at: settings.countdownAt }).from(settings).limit(1);
  return {
    couple: await getCouple(db),
    story: await listStory(db),
    gallery: await listGallery(db),
    gifts: await listGifts(db),
    faqs: await listFaqs(db),
    wishes: await listWishes(db),
    cover: await getCover(db),
    sections: await getSections(db),
    live: await getLive(db),
    eventDate: (config?.at ?? first?.at)?.toISOString() ?? null,
  };
}

/**
 * Isi undangan sama untuk semua pengunjung tetapi butuh ±10 kueri. Saat undangan baru disebar,
 * ribuan orang membukanya bersamaan; tanpa cache API melambat sampai puluhan detik (diukur dengan
 * `pnpm e2e:load`). Hasil disimpan sebentar dan permintaan yang datang bersamaan menunggu satu kueri
 * yang sama. Setiap perubahan oleh admin dan setiap pilihan hadiah tamu membuang cache, jadi
 * perubahan langsung terlihat; TTL hanya jaring pengaman.
 */
export type InvitationCache = {
  /** JSON siap kirim: disusun sekali per isi cache, bukan sekali per pengunjung. */
  get: () => Promise<string>;
  invalidate: () => void;
};

export function createInvitationCache(db: Db, ttlMs = 5_000): InvitationCache {
  let entry: { at: number; value: Promise<string> } | null = null;
  return {
    get() {
      if (!entry || Date.now() - entry.at > ttlMs) {
        const value = getInvitation(db).then((body) => JSON.stringify(body));
        entry = { at: Date.now(), value };
        // Gagal (mis. database sesaat tidak terjangkau) tidak boleh tersimpan.
        value.catch(() => {
          if (entry?.value === value) entry = null;
        });
      }
      return entry.value;
    },
    invalidate() {
      entry = null;
    },
  };
}
