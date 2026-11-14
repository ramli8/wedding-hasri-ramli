import { vipTokenSchema } from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import { FailureLimiter } from "../auth/rate-limit.js";
import type { AppDeps, AppEnv } from "../http/env.js";
import { AppError } from "../http/errors.js";
import { clientIp } from "../http/middleware.js";
import { validate } from "../http/validate.js";
import { getVipToken, resetVipToken, vipFeed, vipTokenMatches } from "../services/vip.js";

/** Kabar VIP (admin): /api/v1/admin/vip. */
export function vipAdminRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json({ ...(await vipFeed(db)), token: await getVipToken(db) }))
    .post("/token", async (c) => c.json({ token: await resetVipToken(db) }));
}

const WINDOW_MS = 15 * 60 * 1000;

/** Kabar VIP untuk HP keluarga: /api/v1/public/vip/:token (nama tamu VIP saja, tanpa kontak). */
export function vipPublicRoutes({ db, config }: AppDeps) {
  const limiter = new FailureLimiter({ max: 30, windowMs: WINDOW_MS });
  return new Hono<AppEnv>().get(
    "/:token",
    validate("param", z.object({ token: vipTokenSchema })),
    async (c) => {
      const ip = clientIp(c, config.trustProxy);
      if (limiter.isBlocked(ip)) {
        throw new AppError(429, "RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.");
      }
      if (!(await vipTokenMatches(db, c.req.valid("param").token))) {
        limiter.recordFailure(ip);
        throw new AppError(404, "NOT_FOUND", "Tautan Kabar VIP tidak dikenal atau sudah diganti");
      }
      c.header("cache-control", "no-store");
      return c.json(await vipFeed(db));
    },
  );
}
