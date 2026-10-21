import {
  receivedGiftInputSchema,
  receivedGiftListQuerySchema,
  receivedGiftThankedSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import {
  createReceivedGift,
  deleteReceivedGift,
  exportReceivedGiftsCsv,
  listReceivedGifts,
  setThanked,
  updateReceivedGift,
} from "../services/received-gifts.js";

const idParam = z.object({ id: z.uuid() });

/** Catatan amplop, transfer, dan barang yang diterima (admin). */
export function receivedGiftRoutes({ db }: AppDeps) {
  return (
    new Hono<AppEnv>()
      .get("/", validate("query", receivedGiftListQuerySchema), async (c) => {
        return c.json(await listReceivedGifts(db, c.req.valid("query")));
      })
      // Rute statis harus didaftarkan sebelum "/:id".
      .get("/export.csv", validate("query", receivedGiftListQuerySchema), async (c) => {
        c.header("content-type", "text/csv; charset=utf-8");
        c.header("content-disposition", 'attachment; filename="hadiah-masuk.csv"');
        return c.body(await exportReceivedGiftsCsv(db, c.req.valid("query")));
      })
      .post("/", validate("json", receivedGiftInputSchema), async (c) => {
        const gift = await createReceivedGift(db, c.get("admin").id, c.req.valid("json"));
        return c.json({ gift }, 201);
      })
      .put(
        "/:id",
        validate("param", idParam),
        validate("json", receivedGiftInputSchema),
        async (c) => {
          const gift = await updateReceivedGift(db, c.req.valid("param").id, c.req.valid("json"));
          return c.json({ gift });
        },
      )
      .post(
        "/:id/thanked",
        validate("param", idParam),
        validate("json", receivedGiftThankedSchema),
        async (c) => {
          const gift = await setThanked(db, c.req.valid("param").id, c.req.valid("json").thanked);
          return c.json({ gift });
        },
      )
      .delete("/:id", validate("param", idParam), async (c) => {
        await deleteReceivedGift(db, c.req.valid("param").id);
        return c.json({ ok: true });
      })
  );
}
