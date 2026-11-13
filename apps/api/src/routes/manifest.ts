import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { getSiteName } from "../services/settings.js";

/**
 * Manifest PWA dengan nama situs dari Pengaturan → Situs (nama aplikasi saat dipasang di HP).
 * Ikon dari /site-icon/*, yang mengikuti logo yang diunggah.
 */
export function manifestRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>().get("/", async (c) => {
    const name = await getSiteName(db);
    c.header("content-type", "application/manifest+json");
    c.header("cache-control", "public, max-age=300");
    return c.body(
      JSON.stringify({
        name,
        short_name: name,
        description: `Admin dan check-in tamu pernikahan ${name}`,
        lang: "id",
        start_url: "/scan",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "/site-icon/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/site-icon/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/site-icon/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      }),
    );
  });
}
