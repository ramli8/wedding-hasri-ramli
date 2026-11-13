import {
  buwuhAddressListSchema,
  buwuhCatalogSchema,
  buwuhInputSchema,
  buwuhPushRequestSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { requireDevice } from "../http/middleware.js";
import { validate } from "../http/validate.js";
import {
  createBuwuh,
  deleteBuwuh,
  exportBuwuhXlsx,
  getBuwuhAddresses,
  getBuwuhCatalog,
  getBuwuhDeviceConfig,
  listBuwuh,
  pushBuwuh,
  saveBuwuhAddresses,
  saveBuwuhCatalog,
  updateBuwuh,
} from "../services/buwuh.js";

/**
 * HP meja buwuh: /api/v1/buwuh/*. Dipasangkan seperti scanner (token perangkat), tetapi tidak
 * pernah menerima data tamu; hanya daftar barang dan tempat mengirim catatan.
 */
export function buwuhRoutes(deps: AppDeps) {
  const { db } = deps;
  return new Hono<AppEnv>()
    .use("*", requireDevice(deps, "buwuh"))
    .get("/config", async (c) => c.json(await getBuwuhDeviceConfig(db, c.get("device"))))
    .post("/push", validate("json", buwuhPushRequestSchema), async (c) =>
      c.json(await pushBuwuh(db, c.get("device"), c.req.valid("json"))),
    );
}

const idParam = z.object({ id: z.uuid() });

/** Admin meja buwuh: /api/v1/admin/buwuh/*. */
export function buwuhAdminRoutes({ db }: AppDeps) {
  return (
    new Hono<AppEnv>()
      .get("/", async (c) => c.json(await listBuwuh(db)))
      // Rute statis harus didaftarkan sebelum "/:id".
      .get("/export.xlsx", async (c) => {
        const today = new Date().toISOString().slice(0, 10);
        c.header(
          "content-type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        c.header("content-disposition", `attachment; filename="buwuh-${today}.xlsx"`);
        c.header("cache-control", "no-store");
        return c.body(new Uint8Array(await exportBuwuhXlsx(db)).buffer);
      })
      .get("/catalog", async (c) => c.json({ items: await getBuwuhCatalog(db) }))
      .put("/catalog", validate("json", buwuhCatalogSchema), async (c) =>
        c.json({ items: await saveBuwuhCatalog(db, c.req.valid("json").items) }),
      )
      .get("/addresses", async (c) => c.json({ items: await getBuwuhAddresses(db) }))
      .put("/addresses", validate("json", buwuhAddressListSchema), async (c) =>
        c.json({ items: await saveBuwuhAddresses(db, c.req.valid("json").items) }),
      )
      .post("/", validate("json", buwuhInputSchema), async (c) => {
        const entry = await createBuwuh(db, c.get("admin").id, c.req.valid("json"));
        return c.json({ entry }, 201);
      })
      .put("/:id", validate("param", idParam), validate("json", buwuhInputSchema), async (c) => {
        const entry = await updateBuwuh(
          db,
          c.get("admin").id,
          c.req.valid("param").id,
          c.req.valid("json"),
        );
        return c.json({ entry });
      })
      .delete("/:id", validate("param", idParam), async (c) => {
        await deleteBuwuh(db, c.get("admin").id, c.req.valid("param").id);
        return c.json({ ok: true });
      })
  );
}
