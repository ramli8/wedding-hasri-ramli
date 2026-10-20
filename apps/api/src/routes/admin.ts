import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { originCheck, requireAdmin } from "../http/middleware.js";
import { eventRoutes } from "./events.js";
import { groupRoutes } from "./groups.js";
import { guestRoutes } from "./guests.js";
import { settingsRoutes } from "./settings.js";

/** Semua rute di bawah /api/v1/admin memerlukan sesi admin. */
export function adminRoutes(deps: AppDeps) {
  return new Hono<AppEnv>()
    .use("*", originCheck(deps.config.allowedOrigins), requireAdmin(deps))
    .route("/settings", settingsRoutes(deps))
    .route("/events", eventRoutes(deps))
    .route("/groups", groupRoutes(deps))
    .route("/guests", guestRoutes(deps));
}
