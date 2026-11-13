import { SITE_ICONS, type SiteIconName } from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import { settings } from "../db/schema.js";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import { readSiteIcon } from "../services/media.js";

const nameParam = z.object({
  name: z.enum(Object.keys(SITE_ICONS) as [SiteIconName, ...SiteIconName[]]),
});

/**
 * Favicon dan ikon aplikasi (/site-icon/<nama>) dari logo di Pengaturan → Situs. Tanpa logo,
 * dialihkan ke ikon bawaan aplikasi web (/icons/<nama>). Di-cache sejam, karena logo bisa diganti
 * sementara alamatnya tetap.
 */
export function siteIconRoutes({ db, config }: AppDeps) {
  return new Hono<AppEnv>().get("/:name", validate("param", nameParam), async (c) => {
    const { name } = c.req.valid("param");
    const [row] = await db.select({ logo: settings.logoMediaId }).from(settings).limit(1);
    const data = row?.logo ? await readSiteIcon(config.mediaDir, row.logo, name) : null;
    if (!data) {
      c.header("cache-control", "public, max-age=300");
      return c.redirect(`/icons/${name}`, 302);
    }
    return c.body(new Uint8Array(data), 200, {
      "content-type": "image/png",
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    });
  });
}
