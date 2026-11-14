import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { originCheck, requireAdmin } from "../http/middleware.js";
import { boothAdminRoutes } from "./booth.js";
import { buwuhAdminRoutes } from "./buwuh.js";
import { checkinAdminRoutes, deviceAdminRoutes } from "./checkin-admin.js";
import { doorprizeRoutes } from "./doorprize.js";
import { guestbookAdminRoutes, rsvpAdminRoutes } from "./engage.js";
import { eventRoutes } from "./events.js";
import { exportRoutes } from "./export.js";
import { groupRoutes } from "./groups.js";
import { guestRoutes } from "./guests.js";
import { homeRoutes } from "./home.js";
import { invitationAdminRoutes } from "./invitation.js";
import { layarAdminRoutes } from "./layar.js";
import { mediaAdminRoutes } from "./media.js";
import { panitiaAdminRoutes } from "./panitia.js";
import { receivedGiftRoutes } from "./received-gifts.js";
import { rundownAdminRoutes } from "./rundown.js";
import { seoRoutes } from "./seo.js";
import { seserahanRoutes } from "./seserahan.js";
import { settingsRoutes } from "./settings.js";
import { vendorRoutes } from "./vendors.js";
import { vipAdminRoutes } from "./vip.js";
import { voiceAdminRoutes } from "./voice.js";

/** Semua rute di bawah /api/v1/admin memerlukan sesi admin. */
export function adminRoutes(deps: AppDeps, onChange: () => void = () => {}) {
  return (
    new Hono<AppEnv>()
      .use("*", originCheck(deps.config.allowedOrigins), requireAdmin(deps))
      // Setiap perubahan oleh admin membuang cache isi undangan publik (lihat createInvitationCache).
      .use("*", async (c, next) => {
        await next();
        if (c.req.method !== "GET" && c.res.status < 400) onChange();
      })
      .route("/export", exportRoutes(deps))
      .route("/booth", boothAdminRoutes(deps))
      .route("/buwuh", buwuhAdminRoutes(deps))
      .route("/home", homeRoutes(deps))
      .route("/settings", settingsRoutes(deps))
      .route("/seo", seoRoutes(deps))
      .route("/events", eventRoutes(deps))
      .route("/groups", groupRoutes(deps))
      .route("/guests", guestRoutes(deps))
      .route("/devices", deviceAdminRoutes(deps))
      .route("/checkins", checkinAdminRoutes(deps))
      .route("/invitation", invitationAdminRoutes(deps))
      .route("/media", mediaAdminRoutes(deps))
      .route("/received-gifts", receivedGiftRoutes(deps))
      .route("/vendors", vendorRoutes(deps))
      .route("/seserahan", seserahanRoutes(deps))
      .route("/panitia", panitiaAdminRoutes(deps))
      .route("/rundown", rundownAdminRoutes(deps))
      .route("/vip", vipAdminRoutes(deps))
      .route("/layar", layarAdminRoutes(deps))
      .route("/doorprize", doorprizeRoutes(deps))
      .route("/voice", voiceAdminRoutes(deps))
      .route("/rsvps", rsvpAdminRoutes(deps))
      .route("/guestbook", guestbookAdminRoutes(deps))
  );
}
