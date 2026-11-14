import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import { deleteVoice, listVoice, setVoiceHidden, voiceFile, voiceZip } from "../services/voice.js";

const idParam = z.object({ id: z.uuid() });

/** Pesan suara (admin): /api/v1/admin/voice. Diputar langsung dari berkasnya, mendukung Range. */
export function voiceAdminRoutes({ db, config }: AppDeps) {
  return (
    new Hono<AppEnv>()
      .get("/", async (c) => c.json({ items: await listVoice(db) }))
      // Rute statis harus didaftarkan sebelum "/:id".
      .get("/export.zip", async (c) => {
        const today = new Date().toISOString().slice(0, 10);
        c.header("content-type", "application/zip");
        c.header("content-disposition", `attachment; filename="pesan-suara-${today}.zip"`);
        c.header("cache-control", "no-store");
        return c.body(await voiceZip(db, config.mediaDir));
      })
      .get("/:id/audio", validate("param", idParam), async (c) => {
        const file = await voiceFile(db, config.mediaDir, c.req.valid("param").id);
        c.header("content-type", file.mimeType);
        c.header("accept-ranges", "bytes");
        c.header("cache-control", "private, max-age=3600");
        // Safari memutar audio hanya bila server menjawab permintaan Range (206).
        const range = /^bytes=(\d*)-(\d*)$/.exec(c.req.header("range") ?? "");
        let start = 0;
        let end = file.size - 1;
        if (range) {
          if (range[1]) start = Number(range[1]);
          if (range[2]) end = Math.min(end, Number(range[2]));
          if (!range[1] && range[2]) {
            start = Math.max(0, file.size - Number(range[2]));
            end = file.size - 1;
          }
          if (start > end || start >= file.size) {
            c.header("content-range", `bytes */${file.size}`);
            return c.body(null, 416);
          }
          c.header("content-range", `bytes ${start}-${end}/${file.size}`);
          c.status(206);
        }
        c.header("content-length", String(end - start + 1));
        const stream = Readable.toWeb(createReadStream(file.path, { start, end }));
        return c.body(stream as ReadableStream<Uint8Array>);
      })
      .post(
        "/:id/hide",
        validate("param", idParam),
        validate("json", z.object({ hidden: z.boolean() })),
        async (c) =>
          c.json({
            item: await setVoiceHidden(db, c.req.valid("param").id, c.req.valid("json").hidden),
          }),
      )
      .delete("/:id", validate("param", idParam), async (c) => {
        await deleteVoice(db, config.mediaDir, c.req.valid("param").id);
        return c.json({ ok: true });
      })
  );
}
