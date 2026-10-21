import {
  coupleProfileInputSchema,
  coupleRoleSchema,
  faqInputSchema,
  faqOrderSchema,
  galleryCaptionSchema,
  galleryInputSchema,
  galleryOrderSchema,
  giftInputSchema,
  giftOrderSchema,
  storyInputSchema,
  storyOrderSchema,
  wishInputSchema,
  wishOrderSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  createFaq,
  createGalleryItem,
  createGift,
  createStoryItem,
  createWish,
  deleteFaq,
  deleteGalleryItem,
  deleteGift,
  deleteStoryItem,
  deleteWish,
  getCouple,
  listFaqs,
  listGallery,
  listGifts,
  listStory,
  reorderFaqs,
  reorderGallery,
  reorderGifts,
  reorderStory,
  reorderWishes,
  saveCoupleProfile,
  updateFaq,
  updateGalleryCaption,
  updateGift,
  updateStoryItem,
  updateWish,
} from "../services/invitation.js";
import { adminWish, listAdminWishes, removeClaim } from "../services/wish-claims.js";

const idParam = z.object({ id: z.uuid() });
const roleParam = z.object({ role: coupleRoleSchema });

/** Isi undangan yang diedit admin: profil mempelai dan cerita. */
export function invitationAdminRoutes({ db, config }: AppDeps) {
  return (
    new Hono<AppEnv>()
      .get("/couple", async (c) => c.json({ couple: await getCouple(db) }))
      .put(
        "/couple/:role",
        validate("param", roleParam),
        validate("json", coupleProfileInputSchema),
        async (c) => {
          const profile = await saveCoupleProfile(
            db,
            config.mediaDir,
            c.req.valid("param").role,
            c.req.valid("json"),
          );
          return c.json({ profile });
        },
      )
      .get("/story", async (c) => c.json({ items: await listStory(db) }))
      .post("/story", validate("json", storyInputSchema), async (c) => {
        return c.json({ item: await createStoryItem(db, c.req.valid("json")) }, 201);
      })
      // Harus sebelum "/story/:id" agar "order" tidak dibaca sebagai id.
      .put("/story/order", validate("json", storyOrderSchema), async (c) => {
        return c.json({ items: await reorderStory(db, c.req.valid("json").ids) });
      })
      .put(
        "/story/:id",
        validate("param", idParam),
        validate("json", storyInputSchema),
        async (c) => {
          const item = await updateStoryItem(
            db,
            config.mediaDir,
            c.req.valid("param").id,
            c.req.valid("json"),
          );
          return c.json({ item });
        },
      )
      .delete("/story/:id", validate("param", idParam), async (c) => {
        await deleteStoryItem(db, config.mediaDir, c.req.valid("param").id);
        return c.json({ ok: true });
      })
      .get("/gallery", async (c) => c.json({ items: await listGallery(db) }))
      .post("/gallery", validate("json", galleryInputSchema), async (c) => {
        return c.json({ item: await createGalleryItem(db, c.req.valid("json")) }, 201);
      })
      // Harus sebelum "/gallery/:id" agar "order" tidak dibaca sebagai id.
      .put("/gallery/order", validate("json", galleryOrderSchema), async (c) => {
        return c.json({ items: await reorderGallery(db, c.req.valid("json").ids) });
      })
      .put(
        "/gallery/:id",
        validate("param", idParam),
        validate("json", galleryCaptionSchema),
        async (c) => {
          const item = await updateGalleryCaption(
            db,
            c.req.valid("param").id,
            c.req.valid("json").caption,
          );
          return c.json({ item });
        },
      )
      .delete("/gallery/:id", validate("param", idParam), async (c) => {
        await deleteGalleryItem(db, config.mediaDir, c.req.valid("param").id);
        return c.json({ ok: true });
      })
      .get("/gifts", async (c) => c.json({ items: await listGifts(db) }))
      .post("/gifts", validate("json", giftInputSchema), async (c) => {
        return c.json({ item: await createGift(db, c.req.valid("json")) }, 201);
      })
      // Harus sebelum "/gifts/:id" agar "order" tidak dibaca sebagai id.
      .put("/gifts/order", validate("json", giftOrderSchema), async (c) => {
        return c.json({ items: await reorderGifts(db, c.req.valid("json").ids) });
      })
      .put(
        "/gifts/:id",
        validate("param", idParam),
        validate("json", giftInputSchema),
        async (c) => {
          const item = await updateGift(
            db,
            config.mediaDir,
            c.req.valid("param").id,
            c.req.valid("json"),
          );
          return c.json({ item });
        },
      )
      .delete("/gifts/:id", validate("param", idParam), async (c) => {
        await deleteGift(db, config.mediaDir, c.req.valid("param").id);
        return c.json({ ok: true });
      })
      .get("/faqs", async (c) => c.json({ items: await listFaqs(db) }))
      .post("/faqs", validate("json", faqInputSchema), async (c) => {
        return c.json({ item: await createFaq(db, c.req.valid("json")) }, 201);
      })
      // Harus sebelum "/faqs/:id" agar "order" tidak dibaca sebagai id.
      .put("/faqs/order", validate("json", faqOrderSchema), async (c) => {
        return c.json({ items: await reorderFaqs(db, c.req.valid("json").ids) });
      })
      .put("/faqs/:id", validate("param", idParam), validate("json", faqInputSchema), async (c) => {
        return c.json({ item: await updateFaq(db, c.req.valid("param").id, c.req.valid("json")) });
      })
      .delete("/faqs/:id", validate("param", idParam), async (c) => {
        await deleteFaq(db, c.req.valid("param").id);
        return c.json({ ok: true });
      })
      .get("/wishes", async (c) => c.json({ items: await listAdminWishes(db) }))
      .post("/wishes", validate("json", wishInputSchema), async (c) => {
        const created = await createWish(db, c.req.valid("json"));
        return c.json({ item: await adminWish(db, created.id) }, 201);
      })
      // Harus sebelum "/wishes/:id" agar "order" tidak dibaca sebagai id.
      .put("/wishes/order", validate("json", wishOrderSchema), async (c) => {
        await reorderWishes(db, c.req.valid("json").ids);
        return c.json({ items: await listAdminWishes(db) });
      })
      .put(
        "/wishes/:id",
        validate("param", idParam),
        validate("json", wishInputSchema),
        async (c) => {
          const { id } = c.req.valid("param");
          await updateWish(db, config.mediaDir, id, c.req.valid("json"));
          return c.json({ item: await adminWish(db, id) });
        },
      )
      .delete(
        "/wishes/:id/claims/:guestId",
        validate("param", z.object({ id: z.uuid(), guestId: z.uuid() })),
        async (c) => {
          const { id, guestId } = c.req.valid("param");
          await removeClaim(db, id, guestId);
          return c.json({ item: await adminWish(db, id) });
        },
      )
      .delete("/wishes/:id", validate("param", idParam), async (c) => {
        await deleteWish(db, config.mediaDir, c.req.valid("param").id);
        return c.json({ ok: true });
      })
  );
}
