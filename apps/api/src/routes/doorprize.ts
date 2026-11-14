import { doorprizeInputSchema } from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  createDoorprize,
  deleteDoorprize,
  deleteDoorprizeWinner,
  drawDoorprize,
  listDoorprize,
  redrawDoorprize,
  updateDoorprize,
} from "../services/doorprize.js";

const idParam = z.object({ id: z.uuid() });

/** Doorprize (admin): /api/v1/admin/doorprize. */
export function doorprizeRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json(await listDoorprize(db)))
    .post("/prizes", validate("json", doorprizeInputSchema), async (c) =>
      c.json({ prize: await createDoorprize(db, c.req.valid("json")) }, 201),
    )
    .put(
      "/prizes/:id",
      validate("param", idParam),
      validate("json", doorprizeInputSchema),
      async (c) =>
        c.json({ prize: await updateDoorprize(db, c.req.valid("param").id, c.req.valid("json")) }),
    )
    .delete("/prizes/:id", validate("param", idParam), async (c) => {
      await deleteDoorprize(db, c.req.valid("param").id);
      return c.json({ ok: true });
    })
    .post("/prizes/:id/draw", validate("param", idParam), async (c) =>
      c.json(await drawDoorprize(db, c.req.valid("param").id)),
    )
    .post("/winners/:id/redraw", validate("param", idParam), async (c) =>
      c.json(await redrawDoorprize(db, c.req.valid("param").id)),
    )
    .delete("/winners/:id", validate("param", idParam), async (c) => {
      await deleteDoorprizeWinner(db, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}
