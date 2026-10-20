import { pairRequestSchema, pushRequestSchema, snapshotQuerySchema } from "@wedding/shared";
import { Hono } from "hono";
import { FailureLimiter } from "../auth/rate-limit.js";
import type { AppDeps, AppEnv } from "../http/env.js";
import { AppError } from "../http/errors.js";
import { clientIp, requireDevice, requireSyncVersion } from "../http/middleware.js";
import { validate } from "../http/validate.js";
import { pairDevice } from "../services/devices.js";
import { buildSnapshot, pushEvents } from "../services/sync.js";

const WINDOW_MS = 15 * 60 * 1000;

/** Pairing perangkat: /api/v1/device/pair. Dibatasi per IP agar kode tidak bisa ditebak. */
export function deviceRoutes({ db, config }: AppDeps) {
  const limiter = new FailureLimiter({ max: 10, windowMs: WINDOW_MS });

  return new Hono<AppEnv>().post(
    "/pair",
    requireSyncVersion,
    validate("json", pairRequestSchema),
    async (c) => {
      const ip = clientIp(c, config.trustProxy);
      if (limiter.isBlocked(ip)) {
        throw new AppError(429, "RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.");
      }
      const result = await pairDevice(db, c.req.valid("json").code);
      if (!result) {
        limiter.recordFailure(ip);
        throw new AppError(
          401,
          "UNAUTHENTICATED",
          "Kode pairing salah, sudah dipakai, atau kedaluwarsa",
        );
      }
      return c.json(result);
    },
  );
}

/** Sinkronisasi perangkat: /api/v1/sync/*. */
export function syncRoutes(deps: AppDeps) {
  const { db } = deps;
  return new Hono<AppEnv>()
    .use("*", requireSyncVersion, requireDevice(deps))
    .get("/snapshot", validate("query", snapshotQuerySchema), async (c) => {
      const { sinceRev, sinceSeq } = c.req.valid("query");
      return c.json(await buildSnapshot(db, c.get("device"), { rev: sinceRev, seq: sinceSeq }));
    })
    .post("/push", validate("json", pushRequestSchema), async (c) => {
      return c.json(
        await pushEvents(db, c.get("device"), c.get("syncVersion"), c.req.valid("json")),
      );
    });
}
