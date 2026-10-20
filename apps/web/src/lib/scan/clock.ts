import { getMeta, setMeta } from "./db.js";

// Jam HP penjaga bisa salah. Setiap sinkronisasi berhasil menghitung selisih terhadap jam server,
// dan semua waktu check-in memakai jam terkoreksi (jam perangkat + selisih terakhir).
let offsetMs = 0;
let loaded = false;

export async function loadClockOffset(): Promise<void> {
  if (loaded) return;
  offsetMs = (await getMeta("serverOffsetMs")) ?? 0;
  loaded = true;
}

export function clockOffset(): number {
  return offsetMs;
}

/** Waktu sekarang menurut server (perkiraan), dalam ms. */
export function correctedNow(): number {
  return Date.now() + offsetMs;
}

export const correctedIso = () => new Date(correctedNow()).toISOString();

/** `sentAt` dan `receivedAt` adalah jam perangkat saat request dikirim dan respons diterima. */
export async function updateClockOffset(serverTimeIso: string, sentAt: number, receivedAt: number) {
  const midpoint = (sentAt + receivedAt) / 2;
  offsetMs = Math.round(Date.parse(serverTimeIso) - midpoint);
  loaded = true;
  await setMeta("serverOffsetMs", offsetMs);
}
