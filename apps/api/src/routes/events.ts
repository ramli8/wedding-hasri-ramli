import { eventInputSchema, eventMessageSchema, eventReminderSchema } from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  setEventMessage,
  setEventReminder,
  updateEvent,
} from "../services/events.js";

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
    .put(
      "/:id/message",
      validate("param", idParam),
      validate("json", eventMessageSchema),
      async (c) => {
        const { id } = c.req.valid("param");
        return c.json({
          event: await setEventMessage(db, id, c.req.valid("json").messageTemplate),
        });
      },
    )
    .put(
      "/:id/reminder",
      validate("param", idParam),
      validate("json", eventReminderSchema),
      async (c) => {
        const { id } = c.req.valid("param");
        return c.json({
          event: await setEventReminder(db, id, c.req.valid("json").reminderTemplate),
        });
      },
    )
    .delete("/:id", validate("param", idParam), async (c) => {
      await deleteEvent(db, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}
