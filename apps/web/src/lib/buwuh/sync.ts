import {
  type BuwuhPushRequest,
  buwuhDeviceConfigSchema,
  buwuhPushResponseSchema,
  errorResponseSchema,
} from "@wedding/shared";
import { useSyncExternalStore } from "react";
import type { z } from "zod";
import { ApiError } from "../api.js";
import { APP_VERSION } from "../scan/version.js";
import {
  type BuwuhRow,
  buwuhDb,
  getBuwuhMeta,
  markSynced,
  pendingEntries,
  setBuwuhMeta,
  toDeviceEntry,
} from "./db.js";

async function call<T>(
  path: string,
  schema: z.ZodType<T>,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1/buwuh${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
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

/** Banyaknya catatan per kiriman; sisa antrean dikirim di kiriman berikutnya dalam putaran sama. */
const BATCH = 50;

export type BuwuhSyncStatus = {
  online: boolean;
  syncing: boolean;
  lastSyncAt: number | null;
  authError: string | null;
};

let status: BuwuhSyncStatus = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  syncing: false,
  lastSyncAt: null,
  authError: null,
};
const listeners = new Set<() => void>();
const setStatus = (patch: Partial<BuwuhSyncStatus>) => {
  status = { ...status, ...patch };
  for (const listener of listeners) listener();
};

export function useBuwuhSyncStatus(): BuwuhSyncStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
  );
}

const isNetwork = (err: unknown) => err instanceof ApiError && err.code === "NETWORK";

/**
 * Satu putaran sinkron: ambil daftar barang, lalu kirim antrean per kelompok. Galat jaringan atau
 * server menghentikan putaran (dicoba lagi nanti). Penolakan isian (400) ditandai di catatan
 * kelompok itu supaya petugas bisa memperbaikinya; catatan tidak pernah dihapus di sini.
 */
async function sendOneByOne(token: string, rows: BuwuhRow[], pending: number) {
  for (const row of rows) {
    try {
      const { accepted } = await call("/push", buwuhPushResponseSchema, token, {
        method: "POST",
        body: JSON.stringify({ entries: [toDeviceEntry(row)], pending, appVersion: APP_VERSION }),
      });
      await markSynced(accepted);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        await buwuhDb.entries.update(row.id, { syncError: err.message });
        continue;
      }
      throw err;
    }
  }
}

export async function syncBuwuh(): Promise<void> {
  const auth = await getBuwuhMeta("auth");
  if (!auth) return;
  setStatus({
    syncing: true,
    authError: (await getBuwuhMeta("authError")) ?? null,
    lastSyncAt: (await getBuwuhMeta("lastSyncAt")) ?? status.lastSyncAt,
  });
  try {
    const config = await call("/config", buwuhDeviceConfigSchema, auth.token);
    await setBuwuhMeta("catalog", config.catalog);
    await setBuwuhMeta("addresses", config.addresses);
    await setBuwuhMeta("authError", null);
    setStatus({ online: true, authError: null });

    for (;;) {
      // Catatan yang pernah ditolak server menunggu diperbaiki petugas (ubah = galatnya dihapus).
      const pending = (await pendingEntries()).filter((row) => !row.syncError);
      const batch = pending.slice(0, BATCH);
      if (batch.length === 0) break;
      const body: BuwuhPushRequest = {
        entries: batch.map(toDeviceEntry),
        pending: pending.length,
        appVersion: APP_VERSION,
      };
      try {
        const { accepted } = await call("/push", buwuhPushResponseSchema, auth.token, {
          method: "POST",
          body: JSON.stringify(body),
        });
        await markSynced(accepted);
        if (accepted.length === 0) break;
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          // Satu catatan rusak tidak boleh menahan yang lain: kirim satu per satu dan tandai hanya
          // yang ditolak; putaran berlanjut dengan sisa antrean.
          await sendOneByOne(auth.token, batch, pending.length);
          continue;
        }
        throw err;
      }
    }
    const now = Date.now();
    await setBuwuhMeta("lastSyncAt", now);
    setStatus({ lastSyncAt: now });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      await setBuwuhMeta("authError", err.message);
      setStatus({ authError: err.message, online: true });
    } else {
      setStatus({ online: !isNetwork(err) && navigator.onLine });
    }
  } finally {
    setStatus({ syncing: false });
  }
}

const INTERVAL_MS = 10_000;

/** Menjalankan sinkron berkala selama halaman meja terbuka. */
export function startBuwuhSync(): { stop: () => void; now: () => void } {
  let running: Promise<void> | null = null;
  let again = false;
  let stopped = false;
  const run = () => {
    if (stopped) return;
    if (running) {
      // Catatan baru disimpan saat putaran berjalan: ulangi sekali lagi sesudahnya.
      again = true;
      return;
    }
    running = syncBuwuh().finally(() => {
      running = null;
      if (again) {
        again = false;
        run();
      }
    });
  };
  const timer = setInterval(run, INTERVAL_MS);
  const onOnline = () => {
    setStatus({ online: true });
    run();
  };
  const onOffline = () => setStatus({ online: false });
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  run();
  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    },
    now: run,
  };
}
