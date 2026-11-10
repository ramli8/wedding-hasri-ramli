import { BOOTH_FRAMES, type BoothFrame } from "@wedding/shared";
import Dexie, { type Table } from "dexie";

/**
 * Penyimpanan lokal photobooth, terpisah dari `wedding-scan` agar booth tidak menyentuh data check-in
 * (dan tidak ikut pembekuan H-30). Setiap foto disimpan di sini lebih dulu, baru diunggah saat
 * online; foto tidak pernah dihapus otomatis.
 */
export type BoothPhotoRow = {
  id: string;
  blob: Blob;
  frame: BoothFrame;
  /** ISO, jam perangkat. */
  takenAt: string;
  number: number;
  printCount: number;
  /** Terisi setelah server menerima foto. */
  uploadedAt?: number;
  /** Pesan galat unggah terakhir (mis. berkas ditolak), untuk ditampilkan ke petugas. */
  uploadError?: string;
};

export type BoothAuth = { token: string; deviceId: string; deviceName: string };

export type BoothMetaMap = {
  auth: BoothAuth;
  /** Bingkai aktif dari server (disimpan agar tetap ada tanpa internet). */
  frames: BoothFrame[];
  /** Nomor foto terakhir di perangkat ini. */
  counter: number;
  cameraDeviceId: string;
  /**
   * Alasan server menolak token (dicabut admin, atau perangkat bukan jenis booth); null bila token
   * diterima. Selama terisi, foto tetap disimpan di laptop dan menunggu pairing ulang.
   */
  authError: string | null;
};

type MetaRow = { key: string; value: unknown };

class BoothDb extends Dexie {
  photos!: Table<BoothPhotoRow, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("wedding-booth");
    // Perubahan skema harus lewat version(n+1).upgrade() yang membawa `photos` apa adanya.
    this.version(1).stores({ photos: "id, takenAt, uploadedAt", meta: "key" });
  }
}

export const boothDb = new BoothDb();

export async function getBoothMeta<K extends keyof BoothMetaMap>(
  key: K,
): Promise<BoothMetaMap[K] | undefined> {
  return (await boothDb.meta.get(key))?.value as BoothMetaMap[K] | undefined;
}

export async function setBoothMeta<K extends keyof BoothMetaMap>(
  key: K,
  value: BoothMetaMap[K],
): Promise<void> {
  await boothDb.meta.put({ key, value });
}

/** Bingkai yang boleh dipilih; sebelum pernah sinkron, semua bingkai bawaan. */
export async function activeFrames(): Promise<BoothFrame[]> {
  const frames = await getBoothMeta("frames");
  return frames && frames.length > 0 ? frames : [...BOOTH_FRAMES];
}

/** Menaikkan penghitung foto secara atomik dan mengembalikan nomor baru. */
export async function nextPhotoNumber(): Promise<number> {
  return boothDb.transaction("rw", boothDb.meta, async () => {
    const next = ((await getBoothMeta("counter")) ?? 0) + 1;
    await setBoothMeta("counter", next);
    return next;
  });
}

export async function savePhoto(row: BoothPhotoRow): Promise<void> {
  await boothDb.photos.put(row);
}

export async function markPrinted(id: string): Promise<void> {
  await boothDb.photos
    .where("id")
    .equals(id)
    .modify((row) => {
      row.printCount += 1;
    });
}

/** Foto yang belum diterima server, yang paling lama lebih dulu. */
export async function pendingPhotos(): Promise<BoothPhotoRow[]> {
  return (await boothDb.photos.orderBy("takenAt").toArray()).filter((row) => !row.uploadedAt);
}

export function countPending(): Promise<number> {
  return boothDb.photos.filter((row) => !row.uploadedAt).count();
}

/**
 * Menyimpan token baru setelah pairing. Foto dan nomor foto TIDAK dihapus: foto yang belum
 * terunggah (mis. karena perangkat lama dicabut) akan diunggah dengan token baru. Kirim ulang
 * aman karena id foto dibuat perangkat.
 */
export async function pairBooth(auth: BoothAuth): Promise<void> {
  await boothDb.transaction("rw", boothDb.meta, async () => {
    await setBoothMeta("auth", auth);
    await setBoothMeta("authError", null);
  });
}

export class PendingPhotosError extends Error {
  constructor(readonly pending: number) {
    super(`Masih ada ${pending} foto yang belum terunggah. Sambungkan internet dulu.`);
  }
}

/**
 * Melepas booth: menghapus semua foto dan pengaturan di laptop ini. Ditolak bila masih ada foto
 * yang belum terunggah; dicek di dalam transaksi yang sama agar tidak bisa terlewat.
 */
export async function releaseBooth(): Promise<void> {
  await boothDb.transaction("rw", [boothDb.photos, boothDb.meta], async () => {
    const pending = await countPending();
    if (pending > 0) throw new PendingPhotosError(pending);
    await boothDb.photos.clear();
    await boothDb.meta.clear();
  });
}

/**
 * Meminta penyimpanan permanen agar browser tidak menghapus foto saat ruang disk menipis (tanpa
 * ini IndexedDB berstatus "best-effort"). Mengembalikan status akhirnya.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
