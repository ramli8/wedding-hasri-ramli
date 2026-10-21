import {
  adminGuestbookQuerySchema,
  guestbookHideRequestSchema,
  guestbookReplyRequestSchema,
  markRemindedRequestSchema,
  rsvpListQuerySchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  deleteGuestbook,
  hideGuestbook,
  listGuestbookAdmin,
  listRsvps,
  markReminded,
  replyGuestbook,
} from "../services/engage.js";

const idParam = z.object({ id: z.uuid() });

export function rsvpAdminRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", validate("query", rsvpListQuerySchema), async (c) => {
      return c.json(await listRsvps(db, c.req.valid("query").eventId));
    })
    .post(
      "/:id/reminded",
      validate("param", idParam),
      validate("json", markRemindedRequestSchema),
      async (c) => {
        const { eventId, reminded } = c.req.valid("json");
        await markReminded(db, c.req.valid("param").id, eventId, reminded);
        return c.json({ ok: true });
      },
    );
}

export function guestbookAdminRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", validate("query", adminGuestbookQuerySchema), async (c) => {
      return c.json(await listGuestbookAdmin(db, c.req.valid("query")));
    })
    .post(
      "/:id/reply",
      validate("param", idParam),
      validate("json", guestbookReplyRequestSchema),
      async (c) => {
        const entry = await replyGuestbook(db, c.req.valid("param").id, c.req.valid("json").reply);
        return c.json({ entry });
      },
    )
    .post(
      "/:id/hide",
      validate("param", idParam),
      validate("json", guestbookHideRequestSchema),
      async (c) => {
        const entry = await hideGuestbook(db, c.req.valid("param").id, c.req.valid("json").hidden);
        return c.json({ entry });
      },
    )
    .delete("/:id", validate("param", idParam), async (c) => {
      await deleteGuestbook(db, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}
