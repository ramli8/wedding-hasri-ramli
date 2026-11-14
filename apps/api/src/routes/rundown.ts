import { rundownItemInputSchema, rundownShiftSchema, rundownTokenSchema } from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import { FailureLimiter } from "../auth/rate-limit.js";
import type { AppDeps, AppEnv } from "../http/env.js";
import { AppError } from "../http/errors.js";
import { clientIp } from "../http/middleware.js";
import { validate } from "../http/validate.js";
import {
  createRundownItem,
  deleteRundownItem,
  listRundown,
  publicRundown,
  resetRundownToken,
  rundownTokenMatches,
  shiftRundown,
  updateRundownItem,
} from "../services/rundown.js";

const idParam = z.object({ id: z.uuid() });

/** Rundown (admin): /api/v1/admin/rundown. */
export function rundownAdminRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json(await listRundown(db)))
    .post("/token", async (c) => c.json({ token: await resetRundownToken(db) }))
    .post("/items", validate("json", rundownItemInputSchema), async (c) =>
      c.json({ item: await createRundownItem(db, c.req.valid("json")) }, 201),
    )
    .put(
      "/items/:id",
      validate("param", idParam),
      validate("json", rundownItemInputSchema),
      async (c) =>
        c.json({ item: await updateRundownItem(db, c.req.valid("param").id, c.req.valid("json")) }),
    )
    .post(
      "/items/:id/shift",
      validate("param", idParam),
      validate("json", rundownShiftSchema),
      async (c) =>
        c.json({
          shifted: await shiftRundown(db, c.req.valid("param").id, c.req.valid("json").minutes),
        }),
    )
    .delete("/items/:id", validate("param", idParam), async (c) => {
      await deleteRundownItem(db, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}

const WINDOW_MS = 15 * 60 * 1000;

/** Rundown baca-saja untuk MC dan panitia: /api/v1/public/rundown/:token. */
export function rundownPublicRoutes({ db, config }: AppDeps) {
  const limiter = new FailureLimiter({ max: 30, windowMs: WINDOW_MS });
  return new Hono<AppEnv>().get(
    "/:token",
    validate("param", z.object({ token: rundownTokenSchema })),
    async (c) => {
      const ip = clientIp(c, config.trustProxy);
      if (limiter.isBlocked(ip)) {
        throw new AppError(429, "RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.");
      }
      if (!(await rundownTokenMatches(db, c.req.valid("param").token))) {
        limiter.recordFailure(ip);
        throw new AppError(404, "NOT_FOUND", "Tautan rundown tidak dikenal atau sudah diganti");
      }
      c.header("cache-control", "no-store");
      return c.json(await publicRundown(db));
    },
  );
}
