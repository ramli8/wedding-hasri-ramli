import {
  vendorCategoryInputSchema,
  vendorInputSchema,
  vendorPaymentInputSchema,
  vendorSelectSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  addCommonCategories,
  addPayment,
  createCategory,
  createVendor,
  deleteCategory,
  deletePayment,
  deleteVendor,
  exportVendorsXlsx,
  getOverview,
  renameCategory,
  setSelected,
  updatePayment,
  updateVendor,
} from "../services/vendors.js";

const idParam = z.object({ id: z.uuid() });
const paymentParam = z.object({ id: z.uuid(), paymentId: z.uuid() });

/** Vendor pernikahan: kategori, kandidat, vendor terpilih, dan pembayaran (admin). */
export function vendorRoutes({ db, config }: AppDeps) {
  return (
    new Hono<AppEnv>()
      .get("/", async (c) => c.json(await getOverview(db)))
      .get("/export.xlsx", async (c) => {
        const today = new Date().toISOString().slice(0, 10);
        c.header(
          "content-type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        c.header("content-disposition", `attachment; filename="vendor-${today}.xlsx"`);
        c.header("cache-control", "no-store");
        return c.body(new Uint8Array(await exportVendorsXlsx(db)).buffer);
      })

      // Rute kategori didaftarkan sebelum "/:id".
      .post("/categories", validate("json", vendorCategoryInputSchema), async (c) => {
        return c.json({ category: await createCategory(db, c.req.valid("json").name) }, 201);
      })
      .post("/categories/common", async (c) => c.json({ added: await addCommonCategories(db) }))
      .put(
        "/categories/:id",
        validate("param", idParam),
        validate("json", vendorCategoryInputSchema),
        async (c) => {
          const category = await renameCategory(
            db,
            c.req.valid("param").id,
            c.req.valid("json").name,
          );
          return c.json({ category });
        },
      )
      .delete("/categories/:id", validate("param", idParam), async (c) => {
        await deleteCategory(db, c.req.valid("param").id);
        return c.json({ ok: true });
      })

      .post("/", validate("json", vendorInputSchema), async (c) => {
        return c.json({ vendor: await createVendor(db, c.req.valid("json")) }, 201);
      })
      .put("/:id", validate("param", idParam), validate("json", vendorInputSchema), async (c) => {
        return c.json({
          vendor: await updateVendor(db, c.req.valid("param").id, c.req.valid("json")),
        });
      })
      .delete("/:id", validate("param", idParam), async (c) => {
        await deleteVendor(db, c.req.valid("param").id);
        return c.json({ ok: true });
      })
      .post(
        "/:id/select",
        validate("param", idParam),
        validate("json", vendorSelectSchema),
        async (c) => {
          const vendor = await setSelected(
            db,
            c.req.valid("param").id,
            c.req.valid("json").selected,
          );
          return c.json({ vendor });
        },
      )

      .post(
        "/:id/payments",
        validate("param", idParam),
        validate("json", vendorPaymentInputSchema),
        async (c) => {
          const vendor = await addPayment(db, c.req.valid("param").id, c.req.valid("json"));
          return c.json({ vendor }, 201);
        },
      )
      .put(
        "/:id/payments/:paymentId",
        validate("param", paymentParam),
        validate("json", vendorPaymentInputSchema),
        async (c) => {
          const { id, paymentId } = c.req.valid("param");
          return c.json({
            vendor: await updatePayment(db, config.mediaDir, id, paymentId, c.req.valid("json")),
          });
        },
      )
      .delete("/:id/payments/:paymentId", validate("param", paymentParam), async (c) => {
        const { id, paymentId } = c.req.valid("param");
        return c.json({ vendor: await deletePayment(db, config.mediaDir, id, paymentId) });
      })
  );
}
