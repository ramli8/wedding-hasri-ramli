import {
  panitiaDoneSchema,
  panitiaMemberInputSchema,
  panitiaTaskInputSchema,
  panitiaTokenSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import { FailureLimiter } from "../auth/rate-limit.js";
import type { AppDeps, AppEnv } from "../http/env.js";
import { AppError } from "../http/errors.js";
import { clientIp } from "../http/middleware.js";
import { validate } from "../http/validate.js";
import {
  createMember,
  createTask,
  deleteMember,
  deleteTask,
  findMemberByToken,
  getPanitia,
  myTasks,
  resetMemberToken,
  setTaskDone,
  updateMember,
  updateTask,
} from "../services/panitia.js";

const idParam = z.object({ id: z.uuid() });

/** Panitia dan tugasnya (admin): /api/v1/admin/panitia. */
export function panitiaAdminRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json(await getPanitia(db)))
    .post("/members", validate("json", panitiaMemberInputSchema), async (c) =>
      c.json({ member: await createMember(db, c.req.valid("json")) }, 201),
    )
    .put(
      "/members/:id",
      validate("param", idParam),
      validate("json", panitiaMemberInputSchema),
      async (c) =>
        c.json({ member: await updateMember(db, c.req.valid("param").id, c.req.valid("json")) }),
    )
    .post("/members/:id/token", validate("param", idParam), async (c) =>
      c.json({ member: await resetMemberToken(db, c.req.valid("param").id) }),
    )
    .delete("/members/:id", validate("param", idParam), async (c) => {
      await deleteMember(db, c.req.valid("param").id);
      return c.json({ ok: true });
    })
    .post("/tasks", validate("json", panitiaTaskInputSchema), async (c) =>
      c.json({ task: await createTask(db, c.req.valid("json")) }, 201),
    )
    .put(
      "/tasks/:id",
      validate("param", idParam),
      validate("json", panitiaTaskInputSchema),
      async (c) =>
        c.json({ task: await updateTask(db, c.req.valid("param").id, c.req.valid("json")) }),
    )
    .post(
      "/tasks/:id/done",
      validate("param", idParam),
      validate("json", panitiaDoneSchema),
      async (c) =>
        c.json({
          task: await setTaskDone(db, c.req.valid("param").id, c.req.valid("json").done),
        }),
    )
    .delete("/tasks/:id", validate("param", idParam), async (c) => {
      await deleteTask(db, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Halaman tugas anggota panitia tanpa login: /api/v1/public/tugas/:token. Token (128 bit acak)
 * adalah kredensialnya; tebakan salah dibatasi per IP.
 */
export function panitiaPublicRoutes({ db, config }: AppDeps) {
  const limiter = new FailureLimiter({ max: 30, windowMs: WINDOW_MS });
  const tokenParam = z.object({ token: panitiaTokenSchema });

  async function member(ip: string, token: string) {
    if (limiter.isBlocked(ip)) {
      throw new AppError(429, "RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.");
    }
    const row = await findMemberByToken(db, token);
    if (!row) {
      limiter.recordFailure(ip);
      throw new AppError(404, "NOT_FOUND", "Tautan tugas tidak dikenal atau sudah diganti");
    }
    return row;
  }

  return new Hono<AppEnv>()
    .get("/:token", validate("param", tokenParam), async (c) => {
      const row = await member(clientIp(c, config.trustProxy), c.req.valid("param").token);
      c.header("cache-control", "no-store");
      return c.json(await myTasks(db, row));
    })
    .post(
      "/:token/tasks/:id/done",
      validate("param", tokenParam.extend({ id: z.uuid() })),
      validate("json", panitiaDoneSchema),
      async (c) => {
        const { token, id } = c.req.valid("param");
        const row = await member(clientIp(c, config.trustProxy), token);
        // Hanya tugas milik anggota ini yang bisa dicentang.
        const task = await setTaskDone(db, id, c.req.valid("json").done, row.id);
        return c.json({ task });
      },
    );
}
