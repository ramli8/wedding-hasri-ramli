import { eventInputSchema } from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import { createEvent, deleteEvent, getEvent, listEvents, updateEvent } from "../services/events.js";

const idParam = z.object({ id: z.uuid() });

export function eventRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json({ items: await listEvents(db) }))
    .post("/", validate("json", eventInputSchema), async (c) => {
      return c.json({ event: await createEvent(db, c.req.valid("json")) }, 201);
    })
    .get("/:id", validate("param", idParam), async (c) => {
      return c.json({ event: await getEvent(db, c.req.valid("param").id) });
    })
    .put("/:id", validate("param", idParam), validate("json", eventInputSchema), async (c) => {
      const event = await updateEvent(db, c.req.valid("param").id, c.req.valid("json"));
      return c.json({ event });
    })
    .delete("/:id", validate("param", idParam), async (c) => {
      await deleteEvent(db, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}
