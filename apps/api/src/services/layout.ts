import {
  type Cover,
  type CoverData,
  type InvitationResponse,
  type LayoutResponse,
  SECTION_KEYS,
  type Section,
  type SectionKey,
} from "@wedding/shared";
import { asc, eq, min } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { events, invitationCover, invitationSections, media } from "../db/schema.js";
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
  return { cover: await getCover(db), sections: await getSections(db) };
}

// --- Untuk tamu -----------------------------------------------------------------------------------

export async function getInvitation(db: Db): Promise<InvitationResponse> {
  const [first] = await db.select({ at: min(events.startsAt) }).from(events);
  return {
    couple: await getCouple(db),
    story: await listStory(db),
    gallery: await listGallery(db),
    gifts: await listGifts(db),
    faqs: await listFaqs(db),
    wishes: await listWishes(db),
    cover: await getCover(db),
    sections: await getSections(db),
    eventDate: first?.at?.toISOString() ?? null,
  };
}
