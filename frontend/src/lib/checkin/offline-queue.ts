import { isAxiosError } from "axios";
import { guestService } from "@/src/domain/services/guest.service";

// Antrian check-in offline: saat koneksi putus, check-in disimpan di
// localStorage lalu dibalikkan otomatis begitu koneksi kembali.
// Dedupe by key → tamu yang sama tidak ganda meski dipindai ulang.

const QUEUE_KEY = "wd-checkin-queue-v1";

export interface QueuedCheckIn {
  /** Unik: `id:<guestId>` (mode manual) atau `qr:<kode>` (mode scanner). */
  key: string;
  guestId?: string;
  qrCode?: string;
  /** Nama tamu (mode manual) atau kode QR (mode scanner) untuk ditampilkan. */
  label: string;
  /** Jam lokal saat masuk antrian, format HH.mm. */
  at: string;
}

export function readCheckInQueue(): QueuedCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as QueuedCheckIn[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCheckInQueue(queue: QueuedCheckIn[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* storage penuh/blokir — antrian hilang saat refresh, terima saja */
  }
}

export function enqueueCheckIn(
  entry: Omit<QueuedCheckIn, "at"> & { at?: string }
): QueuedCheckIn[] {
  const queue = readCheckInQueue().filter((q) => q.key !== entry.key);
  queue.unshift({
    ...entry,
    at:
      entry.at ??
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
  });
  writeCheckInQueue(queue);
  return queue;
}

export function isNetworkError(err: unknown): boolean {
  if (isAxiosError(err)) {
    return err.code === "ERR_NETWORK" || err.response === undefined;
  }
  if (err instanceof Error) {
    return /network|fetch failed|load failed/i.test(err.message);
  }
  return false;
}

export interface FlushCheckInQueueResult {
  flushedNames: string[];
  /** 409 (sudah check-in di server) ikut flushed; 404 (kode invalid) dibuang. */
  remaining: number;
}

export async function flushCheckInQueue(): Promise<FlushCheckInQueueResult> {
  const queue = readCheckInQueue();
  const flushedNames: string[] = [];
  const remaining: QueuedCheckIn[] = [];

  for (const item of queue) {
    try {
      if (item.guestId) await guestService.checkInByID(item.guestId);
      else if (item.qrCode) await guestService.checkInByQRCode(item.qrCode);
      else continue;
      flushedNames.push(item.label);
    } catch (err) {
      if (isNetworkError(err)) {
        // Masih offline — hentikan flush, sisa antrian dipertahankan urutannya.
        remaining.push(item, ...queue.slice(queue.indexOf(item) + 1));
        break;
      }
      if (
        isAxiosError(err) &&
        (err.response?.status === 409 || err.response?.status === 404)
      ) {
        // 409: sudah check-in di server; 404: kode tidak valid.
        // Keduanya dianggap selesai agar antrian tidak macet selamanya.
        flushedNames.push(item.label);
        continue;
      }
      remaining.push(item);
    }
  }

  writeCheckInQueue(remaining);
  return { flushedNames, remaining: remaining.length };
}
