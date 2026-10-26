import { type SeoResponse, seoInputSchema } from "@wedding/shared";
import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import { getSeo, saveSeo } from "../services/seo.js";

export function seoRoutes({ db, config }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json({ seo: await getSeo(db) } satisfies SeoResponse))
    .put("/", validate("json", seoInputSchema), async (c) => {
      const seo = await saveSeo(db, config.mediaDir, c.req.valid("json"));
      return c.json({ seo } satisfies SeoResponse);
    });
}
