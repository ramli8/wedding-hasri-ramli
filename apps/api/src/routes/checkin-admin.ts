import {
  adminSetPaxRequestSchema,
  createDeviceRequestSchema,
  dashboardQuerySchema,
  logQuerySchema,
  resolveRequestSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  adminSetPax,
  adminUndo,
  buildDashboard,
  listLog,
  resolveReview,
  reviewQueue,
} from "../services/checkin-admin.js";
import { createDevice, listDevices, revokeDevice } from "../services/devices.js";

const idParam = z.object({ id: z.uuid() });

export function deviceAdminRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json({ items: await listDevices(db) }))
    .post("/", validate("json", createDeviceRequestSchema), async (c) => {
      return c.json(await createDevice(db, c.req.valid("json").name), 201);
    })
    .post("/:id/revoke", validate("param", idParam), async (c) => {
      return c.json({ device: await revokeDevice(db, c.req.valid("param").id) });
    });
}

export function checkinAdminRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/dashboard", validate("query", dashboardQuerySchema), async (c) => {
      return c.json(await buildDashboard(db, c.req.valid("query").eventId));
    })
    .get("/review", validate("query", dashboardQuerySchema), async (c) => {
      return c.json({ items: await reviewQueue(db, c.req.valid("query").eventId) });
    })
    .post("/resolve", validate("json", resolveRequestSchema), async (c) => {
      await resolveReview(db, c.get("admin").id, c.req.valid("json"));
      return c.json({ ok: true });
    })
    .get("/log", validate("query", logQuerySchema), async (c) => {
      return c.json(await listLog(db, c.req.valid("query")));
    })
    .post("/:id/undo", validate("param", idParam), async (c) => {
      await adminUndo(db, c.get("admin").id, c.req.valid("param").id);
      return c.json({ ok: true });
    })
    .post(
      "/:id/pax",
      validate("param", idParam),
      validate("json", adminSetPaxRequestSchema),
      async (c) => {
        await adminSetPax(db, c.get("admin").id, c.req.valid("param").id, c.req.valid("json").pax);
        return c.json({ ok: true });
      },
    );
}
