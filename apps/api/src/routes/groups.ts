import { groupInputSchema } from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import { createGroup, deleteGroup, getGroup, listGroups, updateGroup } from "../services/groups.js";

const idParam = z.object({ id: z.uuid() });

export function groupRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json({ items: await listGroups(db) }))
    .post("/", validate("json", groupInputSchema), async (c) => {
      return c.json({ group: await createGroup(db, c.req.valid("json")) }, 201);
    })
    .get("/:id", validate("param", idParam), async (c) => {
      return c.json({ group: await getGroup(db, c.req.valid("param").id) });
    })
    .put("/:id", validate("param", idParam), validate("json", groupInputSchema), async (c) => {
      const group = await updateGroup(db, c.req.valid("param").id, c.req.valid("json"));
      return c.json({ group });
    })
    .delete("/:id", validate("param", idParam), async (c) => {
      await deleteGroup(db, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}
