import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { originCheck, requireAdmin } from "../http/middleware.js";
import { checkinAdminRoutes, deviceAdminRoutes } from "./checkin-admin.js";
import { guestbookAdminRoutes, rsvpAdminRoutes } from "./engage.js";
import { eventRoutes } from "./events.js";
import { groupRoutes } from "./groups.js";
import { guestRoutes } from "./guests.js";
import { invitationAdminRoutes } from "./invitation.js";
import { mediaAdminRoutes } from "./media.js";
import { receivedGiftRoutes } from "./received-gifts.js";
import { settingsRoutes } from "./settings.js";

/** Semua rute di bawah /api/v1/admin memerlukan sesi admin. */
export function adminRoutes(deps: AppDeps) {
  return new Hono<AppEnv>()
    .use("*", originCheck(deps.config.allowedOrigins), requireAdmin(deps))
    .route("/settings", settingsRoutes(deps))
    .route("/events", eventRoutes(deps))
    .route("/groups", groupRoutes(deps))
    .route("/guests", guestRoutes(deps))
    .route("/devices", deviceAdminRoutes(deps))
    .route("/checkins", checkinAdminRoutes(deps))
    .route("/invitation", invitationAdminRoutes(deps))
    .route("/media", mediaAdminRoutes(deps))
    .route("/received-gifts", receivedGiftRoutes(deps))
    .route("/rsvps", rsvpAdminRoutes(deps))
    .route("/guestbook", guestbookAdminRoutes(deps));
}
