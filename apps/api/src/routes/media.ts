import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, mediaListResponseSchema } from "@wedding/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { AppError } from "../http/errors.js";
import { validate } from "../http/validate.js";
import {
  deleteMedia,
  listMedia,
  readVariant,
  saveMedia,
  sweepOrphanMedia,
} from "../services/media.js";

const idParam = z.object({ id: z.uuid() });

/** Unggah dan kelola gambar (admin). */
export function mediaAdminRoutes({ db, config }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => c.json(mediaListResponseSchema.parse({ items: await listMedia(db) })))
    .post(
      "/",
      // Batas sedikit di atas batas berkas agar bagian multipart lain tidak ikut menolak.
      bodyLimit({
        maxSize: MAX_UPLOAD_BYTES + 512 * 1024,
        onError: (c) =>
          c.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: `Ukuran gambar maksimal ${MAX_UPLOAD_MB} MB`,
              },
            },
            413,
          ),
      }),
      async (c) => {
        const body = await c.req.parseBody().catch(() => null);
        const file = body?.file;
        if (!(file instanceof File)) {
          throw new AppError(400, "VALIDATION_ERROR", "Pilih berkas gambar dulu");
        }
        if (file.size === 0) throw new AppError(400, "VALIDATION_ERROR", "Berkas kosong");
        if (file.size > MAX_UPLOAD_BYTES) {
          throw new AppError(400, "VALIDATION_ERROR", `Ukuran gambar maksimal ${MAX_UPLOAD_MB} MB`);
        }
        await sweepOrphanMedia(db, config.mediaDir);
        const media = await saveMedia(db, config.mediaDir, {
          buffer: Buffer.from(await file.arrayBuffer()),
          originalName: file.name || null,
        });
        return c.json({ media }, 201);
      },
    )
    .delete("/:id", validate("param", idParam), async (c) => {
      await deleteMedia(db, config.mediaDir, c.req.valid("param").id);
      return c.json({ ok: true });
    });
}

const fileParam = z.object({
  id: z.uuid(),
  file: z.enum(["large.webp", "thumb.webp"]),
});

/** Menyajikan gambar tanpa login. Id acak dan tidak pernah berubah isinya, jadi boleh di-cache lama. */
export function mediaPublicRoutes({ config }: AppDeps) {
  return new Hono<AppEnv>().get("/:id/:file", validate("param", fileParam), async (c) => {
    const { id, file } = c.req.valid("param");
    const variant = file === "large.webp" ? "large" : "thumb";
    const data = await readVariant(config.mediaDir, id, variant);
    if (!data) throw new AppError(404, "NOT_FOUND", "Gambar tidak ditemukan");
    return c.body(new Uint8Array(data), 200, {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    });
  });
}
