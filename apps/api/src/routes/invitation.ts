import {
  coupleProfileInputSchema,
  coupleRoleSchema,
  galleryCaptionSchema,
  galleryInputSchema,
  galleryOrderSchema,
  storyInputSchema,
  storyOrderSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  createGalleryItem,
  createStoryItem,
  deleteGalleryItem,
  deleteStoryItem,
  getCouple,
  listGallery,
  listStory,
  reorderGallery,
  reorderStory,
  saveCoupleProfile,
  updateGalleryCaption,
  updateStoryItem,
} from "../services/invitation.js";

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
  );
}
