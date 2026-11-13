import {
  BOOTH_MAX_UPLOAD_BYTES,
  boothConfigSchema,
  boothPhotoQuerySchema,
  boothUploadSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { AppError } from "../http/errors.js";
import { requireDevice } from "../http/middleware.js";
import { validate } from "../http/validate.js";
import {
  boothPhotosZip,
  deleteBoothPhoto,
  getBoothConfig,
  getBoothDeviceConfig,
  listBoothPhotos,
  saveBoothConfig,
  saveBoothPhoto,
} from "../services/booth.js";
import { touchDevice } from "../services/devices.js";

const MAX_MB = BOOTH_MAX_UPLOAD_BYTES / (1024 * 1024);
const tooLarge = () => new AppError(400, "VALIDATION_ERROR", `Ukuran foto maksimal ${MAX_MB} MB`);

/**
 * Photobooth: /api/v1/booth/*. Booth dipasangkan seperti perangkat scanner (token perangkat), tetapi
 * di luar /sync sehingga tidak menyentuh kontrak sinkronisasi check-in.
 */
export function boothRoutes(deps: AppDeps) {
  const { db, config } = deps;
  return new Hono<AppEnv>()
    .use("*", requireDevice(deps, "booth"))
    .get("/config", async (c) => {
      // Booth meminta config tiap 15 detik: sekaligus tanda hidup untuk Beranda.
      await touchDevice(db, c.get("device").id);
      return c.json({ config: await getBoothDeviceConfig(db) });
    })
    .post(
      "/photos",
      bodyLimit({
        maxSize: BOOTH_MAX_UPLOAD_BYTES + 64 * 1024,
        onError: (c) =>
          c.json(
            { error: { code: "VALIDATION_ERROR", message: `Ukuran foto maksimal ${MAX_MB} MB` } },
            413,
          ),
      }),
      async (c) => {
        const body = await c.req.parseBody().catch(() => null);
        const file = body?.file;
        if (!(file instanceof File) || file.size === 0) {
          throw new AppError(400, "VALIDATION_ERROR", "Berkas foto tidak ada");
        }
        if (file.size > BOOTH_MAX_UPLOAD_BYTES) throw tooLarge();
        const meta = boothUploadSchema.safeParse({
          id: body?.id,
          frame: body?.frame,
          takenAt: body?.takenAt,
        });
        if (!meta.success) {
          throw new AppError(400, "VALIDATION_ERROR", "Data foto tidak lengkap atau tidak valid");
        }
        const result = await saveBoothPhoto(
          db,
          config.mediaDir,
          c.get("device").id,
          meta.data,
          Buffer.from(await file.arrayBuffer()),
        );
        return c.json(result, result.duplicate ? 200 : 201);
      },
    );
}

const idParam = z.object({ id: z.uuid() });

/** Admin photobooth: /api/v1/admin/booth/*. */
export function boothAdminRoutes({ db, config }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/config", async (c) => c.json({ config: await getBoothConfig(db) }))
    .put("/config", validate("json", boothConfigSchema), async (c) =>
      c.json({ config: await saveBoothConfig(db, c.req.valid("json")) }),
    )
    .get("/photos", validate("query", boothPhotoQuerySchema), async (c) =>
      c.json(await listBoothPhotos(db, c.req.valid("query"))),
    )
    .get("/photos.zip", async (c) => {
      const today = new Date().toISOString().slice(0, 10);
      c.header("content-disposition", `attachment; filename="photobooth-${today}.zip"`);
      c.header("content-type", "application/zip");
      c.header("cache-control", "no-store");
      return c.body(await boothPhotosZip(db, config.mediaDir));
    })
    .delete("/photos/:id", validate("param", idParam), async (c) => {
      await deleteBoothPhoto(db, config.mediaDir, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}
