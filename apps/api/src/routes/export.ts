import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { exportAllData, mediaZipStream } from "../services/export.js";

const today = () => new Date().toISOString().slice(0, 10);

/** Unduhan arsip untuk admin: seluruh data (JSON) dan seluruh foto (ZIP). */
export function exportRoutes({ db, config }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/data.json", async (c) => {
      const data = await exportAllData(db, config.version);
      c.header("content-type", "application/json; charset=utf-8");
      c.header("content-disposition", `attachment; filename="data-pernikahan-${today()}.json"`);
      c.header("cache-control", "no-store");
      return c.body(JSON.stringify(data, null, 2));
    })
    .get("/media.zip", async (c) => {
      c.header("content-disposition", `attachment; filename="foto-undangan-${today()}.zip"`);
      c.header("content-type", "application/zip");
      c.header("cache-control", "no-store");
      return c.body(await mediaZipStream(config.mediaDir));
    });
}
