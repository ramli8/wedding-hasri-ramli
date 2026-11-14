import { seserahanInputSchema, seserahanStatusInputSchema } from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  createSeserahan,
  deleteSeserahan,
  exportSeserahanXlsx,
  listSeserahan,
  updateSeserahan,
} from "../services/seserahan.js";

const idParam = z.object({ id: z.uuid() });

/** Mahar, seserahan, dan hantaran (admin): /api/v1/admin/seserahan. */
export function seserahanRoutes({ db }: AppDeps) {
  return (
    new Hono<AppEnv>()
      .get("/", async (c) => c.json(await listSeserahan(db)))
      // Rute statis harus didaftarkan sebelum "/:id".
      .get("/export.xlsx", async (c) => {
        const today = new Date().toISOString().slice(0, 10);
        c.header(
          "content-type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        c.header("content-disposition", `attachment; filename="seserahan-${today}.xlsx"`);
        c.header("cache-control", "no-store");
        return c.body(new Uint8Array(await exportSeserahanXlsx(db)).buffer);
      })
      .post("/", validate("json", seserahanInputSchema), async (c) =>
        c.json({ item: await createSeserahan(db, c.req.valid("json")) }, 201),
      )
      .put("/:id", validate("param", idParam), validate("json", seserahanInputSchema), async (c) =>
        c.json({ item: await updateSeserahan(db, c.req.valid("param").id, c.req.valid("json")) }),
      )
      .post(
        "/:id/status",
        validate("param", idParam),
        validate("json", seserahanStatusInputSchema),
        async (c) =>
          c.json({
            item: await updateSeserahan(db, c.req.valid("param").id, {
              status: c.req.valid("json").status,
            }),
          }),
      )
      .delete("/:id", validate("param", idParam), async (c) => {
        await deleteSeserahan(db, c.req.valid("param").id);
        return c.json({ ok: true });
      })
  );
}
