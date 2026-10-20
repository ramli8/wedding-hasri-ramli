import {
  guestInputSchema,
  guestListQuerySchema,
  importCommitRequestSchema,
  importRequestSchema,
  markSentRequestSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  commitImport,
  exportGuestsCsv,
  importTemplateCsv,
  previewImport,
} from "../services/guest-import.js";
import {
  createGuest,
  deleteGuest,
  getGuest,
  listGuests,
  markSent,
  restoreGuest,
  updateGuest,
} from "../services/guests.js";

const idParam = z.object({ id: z.uuid() });

const csvHeaders = (filename: string) => ({
  "content-type": "text/csv; charset=utf-8",
  "content-disposition": `attachment; filename="${filename}"`,
});

export function guestRoutes({ db }: AppDeps) {
  return (
    new Hono<AppEnv>()
      .get("/", validate("query", guestListQuerySchema), async (c) => {
        return c.json(await listGuests(db, c.req.valid("query")));
      })
      .post("/", validate("json", guestInputSchema), async (c) => {
        return c.json({ guest: await createGuest(db, c.req.valid("json")) }, 201);
      })

      // Rute statis harus didaftarkan sebelum "/:id".
      .get("/export.csv", async (c) =>
        c.body(await exportGuestsCsv(db), 200, csvHeaders("tamu.csv")),
      )
      .get("/template.csv", (c) =>
        c.body(importTemplateCsv(), 200, csvHeaders("template-tamu.csv")),
      )
      .post("/import/preview", validate("json", importRequestSchema), async (c) => {
        return c.json(await previewImport(db, c.req.valid("json").csv));
      })
      .post("/import/commit", validate("json", importCommitRequestSchema), async (c) => {
        const { csv, skipDuplicates } = c.req.valid("json");
        return c.json(await commitImport(db, csv, skipDuplicates));
      })

      .get("/:id", validate("param", idParam), async (c) => {
        return c.json({ guest: await getGuest(db, c.req.valid("param").id) });
      })
      .put("/:id", validate("param", idParam), validate("json", guestInputSchema), async (c) => {
        const guest = await updateGuest(db, c.req.valid("param").id, c.req.valid("json"));
        return c.json({ guest });
      })
      .delete("/:id", validate("param", idParam), async (c) => {
        await deleteGuest(db, c.req.valid("param").id);
        return c.json({ ok: true });
      })
      .post("/:id/restore", validate("param", idParam), async (c) => {
        return c.json({ guest: await restoreGuest(db, c.req.valid("param").id) });
      })
      .post(
        "/:id/sent",
        validate("param", idParam),
        validate("json", markSentRequestSchema),
        async (c) => {
          const guest = await markSent(db, c.req.valid("param").id, c.req.valid("json"));
          return c.json({ guest });
        },
      )
  );
}
