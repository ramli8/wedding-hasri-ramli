import { layarPortionsInputSchema } from "@wedding/shared";
import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { requireDevice } from "../http/middleware.js";
import { validate } from "../http/validate.js";
import { getLayarPortions, layarFeed, saveLayarPortions } from "../services/layar.js";

/** Layar sapa/dapur: /api/v1/layar/*. Hanya nama tamu yang baru datang dan angka, tanpa kontak. */
export function layarRoutes(deps: AppDeps) {
  const { db } = deps;
  return new Hono<AppEnv>().use("*", requireDevice(deps, "layar")).get("/feed", async (c) => {
    c.header("cache-control", "no-store");
    return c.json(await layarFeed(db, c.get("device")));
  });
}

/** Porsi makanan siap (admin): /api/v1/admin/layar. */
export function layarAdminRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json(await getLayarPortions(db)))
    .put("/", validate("json", layarPortionsInputSchema), async (c) =>
      c.json(await saveLayarPortions(db, c.req.valid("json"))),
    );
}
