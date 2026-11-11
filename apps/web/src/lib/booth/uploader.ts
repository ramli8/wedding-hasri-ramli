import {
  boothConfigResponseSchema,
  boothUploadResponseSchema,
  errorResponseSchema,
} from "@wedding/shared";
import type { z } from "zod";
import { ApiError } from "../api.js";
import { boothDb, getBoothMeta, pendingPhotos, setBoothMeta } from "./db.js";

async function call<T>(
  path: string,
  schema: z.ZodType<T>,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1/booth${path}`, {
      ...init,
      headers: { authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Tidak bisa terhubung ke server");
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = errorResponseSchema.safeParse(json);
    throw new ApiError(
      res.status,
      parsed.success ? parsed.data.error.code : "INTERNAL",
      parsed.success ? parsed.data.error.message : "Terjadi kesalahan pada server",
    );
  }
  return schema.parse(json);
}

export type SyncResult = { uploaded: number; failed: number; offline: boolean };

/**
 * Satu putaran sinkron: ambil bingkai aktif, lalu unggah foto yang tertunda satu per satu. Galat
 * jaringan menghentikan putaran (dicoba lagi nanti); penolakan server ditandai di foto itu dan
 * putaran lanjut ke foto berikutnya. Foto tidak pernah dihapus di sini.
 */
export async function syncBooth(): Promise<SyncResult> {
  const auth = await getBoothMeta("auth");
  const result: SyncResult = { uploaded: 0, failed: 0, offline: false };
  if (!auth) return result;

  try {
    const { config } = await call("/config", boothConfigResponseSchema, auth.token);
    await setBoothMeta("frames", config.frames);
    await setBoothMeta("photoBaseUrl", config.photoBaseUrl);
    await setBoothMeta("authError", null);
  } catch (err) {
    if (await handleFatal(err)) return { ...result, offline: isNetwork(err) };
  }

  for (const photo of await pendingPhotos()) {
    const form = new FormData();
    form.append("id", photo.id);
    form.append("frame", photo.frame);
    form.append("takenAt", photo.takenAt);
    form.append("file", new File([photo.blob], `${photo.id}.jpg`, { type: "image/jpeg" }));
    try {
      await call("/photos", boothUploadResponseSchema, auth.token, {
        method: "POST",
        body: form,
      });
      await boothDb.photos.update(photo.id, { uploadedAt: Date.now(), uploadError: undefined });
      result.uploaded += 1;
    } catch (err) {
      if (await handleFatal(err)) return { ...result, offline: isNetwork(err) };
      await boothDb.photos.update(photo.id, {
        uploadError: err instanceof Error ? err.message : "Gagal mengunggah",
      });
      result.failed += 1;
    }
  }
  return result;
}

const isNetwork = (err: unknown) => err instanceof ApiError && err.code === "NETWORK";

/**
 * Galat yang membuat sisa putaran percuma: jaringan putus, server bermasalah, atau token ditolak
 * (dicabut admin, atau perangkat dipasangkan sebagai scanner). Alasan penolakan token disimpan
 * untuk ditampilkan ke petugas.
 */
async function handleFatal(err: unknown): Promise<boolean> {
  if (!(err instanceof ApiError)) return true;
  if (err.status === 401 || err.status === 403) {
    await setBoothMeta("authError", err.message);
    return true;
  }
  return err.code === "NETWORK" || err.status >= 500 || err.status === 429;
}

const INTERVAL_MS = 15_000;

/** Menjalankan sinkron berkala selama halaman booth terbuka. Mengembalikan fungsi berhenti. */
export function startBoothSync(onResult?: (result: SyncResult) => void): {
  stop: () => void;
  now: () => void;
} {
  let running = false;
  let stopped = false;
  const run = async () => {
    if (running || stopped) return;
    running = true;
    try {
      // Jangan ditulis `onResult?.(await syncBooth())`: tanpa onResult, `?.()` melewati argumennya
      // juga, sehingga syncBooth tidak pernah jalan dan foto tidak pernah terunggah.
      const result = await syncBooth();
      onResult?.(result);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void run(), INTERVAL_MS);
  const onOnline = () => void run();
  window.addEventListener("online", onOnline);
  void run();
  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
    },
    now: () => void run(),
  };
}
