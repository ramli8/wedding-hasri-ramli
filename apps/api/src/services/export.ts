import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTableColumns, getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { Zip, ZipPassThrough } from "fflate";
import type { Db } from "../db/client.js";
import * as schema from "../db/schema.js";

/** Tabel yang tidak ikut diekspor: akun admin dan sesinya (berisi kata sandi dan token). */
const EXCLUDED_TABLES = new Set(["admins", "admin_sessions"]);
/** Kolom rahasia yang dibuang dari tabel lain. */
const SECRET_COLUMNS: Record<string, string[]> = {
  devices: ["pairingCodeHash", "tokenHash"],
};

export const EXPORT_FORMAT = "wedding-export-v1";

/**
 * Seluruh isi database sebagai satu objek JSON (tamu, undangan, check-in, hadiah, vendor, dst.),
 * tanpa akun admin, sesi, dan token perangkat. Untuk arsip pribadi dan pemindahan data; cadangan
 * utama tetap pg_dump (lihat docs/backup.md).
 */
export async function exportAllData(db: Db, appVersion: string) {
  const tables: Record<string, unknown[]> = {};
  const all = (Object.values(schema) as unknown[]).filter((value): value is PgTable =>
    is(value, PgTable),
  );
  for (const table of all) {
    const name = getTableName(table);
    if (EXCLUDED_TABLES.has(name)) continue;
    const secret = new Set(SECRET_COLUMNS[name] ?? []);
    const columns = Object.fromEntries(
      Object.entries(getTableColumns(table)).filter(([key]) => !secret.has(key)),
    );
    tables[name] = await db.select(columns).from(table);
  }
  return { format: EXPORT_FORMAT, exportedAt: new Date().toISOString(), appVersion, tables };
}

/**
 * ZIP seluruh foto (`<id>/large.webp` dan `thumb.webp`) sebagai aliran: satu berkas diproses per
 * tarikan, jadi memori tetap kecil walau fotonya banyak dan besar. WebP sudah terkompresi,
 * jadi disimpan tanpa kompresi ulang.
 */
export async function mediaZipStream(dir: string): Promise<ReadableStream<Uint8Array>> {
  let ids: string[] = [];
  try {
    ids = (await readdir(dir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    // Folder belum ada: ZIP kosong.
  }
  const queue = ids.flatMap((id) => ["large", "thumb"].map((variant) => ({ id, variant })));

  let controllerRef: ReadableStreamDefaultController<Uint8Array>;
  let finished = false;
  const zip = new Zip((error, chunk, final) => {
    if (error) controllerRef.error(error);
    else {
      controllerRef.enqueue(chunk);
      if (final) {
        finished = true;
        controllerRef.close();
      }
    }
  });

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
    async pull() {
      if (finished) return;
      const next = queue.shift();
      if (!next) {
        zip.end();
        return;
      }
      const path = `${next.id}/${next.variant}.webp`;
      try {
        const data = await readFile(join(dir, next.id, `${next.variant}.webp`));
        const entry = new ZipPassThrough(path);
        zip.add(entry);
        entry.push(data, true);
      } catch {
        // Berkas hilang (mis. dihapus saat ekspor berjalan): dilewati.
      }
    },
  });
}
