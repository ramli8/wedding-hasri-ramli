import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";

export function healthRoutes({ db, config }: AppDeps) {
  return new Hono<AppEnv>().get("/health", async (c) => {
    const base = { version: config.version, time: new Date().toISOString() };
    try {
      await db.execute(sql`select 1`);
      return c.json({ status: "ok", ...base });
    } catch {
      return c.json({ status: "degraded", ...base }, 503);
    }
  });
}
