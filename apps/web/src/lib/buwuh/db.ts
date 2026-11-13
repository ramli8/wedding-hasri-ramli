import {
  type BuwuhCatalogItem,
  type BuwuhDeviceEntry,
  type BuwuhItem,
  type BuwuhKind,
  DEFAULT_BUWUH_CATALOG,
  uuid7,
} from "@wedding/shared";
import Dexie, { type Table } from "dexie";

/**
 * Penyimpanan lokal HP meja buwuh, terpisah dari `wedding-scan` (tidak ikut kontrak sinkron
 * check-in dan pembekuan H-30). Setiap catatan disimpan di sini lebih dulu, baru dikirim saat
 * online; catatan tidak pernah dihapus dari HP selama belum terkirim.
 */
export type BuwuhRow = {
  id: string;
  name: string;
  address: string | null;
  amount: number;
  items: BuwuhItem[];
  /** ISO, jam perangkat saat catatan pertama dibuat. */
  recordedAt: string;
  /** Naik setiap kali diubah atau dihapus di HP ini. */
  version: number;
  /** Versi terakhir yang sudah diterima server; 0 = belum pernah terkirim. */
  syncedVersion: number;
  deleted: boolean;
  /** Pesan penolakan server untuk catatan ini (mis. isian tidak sah), untuk petugas. */
  syncError?: string;
};

export type BuwuhAuth = { token: string; deviceId: string; deviceName: string };

export type BuwuhMetaMap = {
  auth: BuwuhAuth;
  /**
   * Jenis meja yang dipilih saat HP pertama dibuka: penjaga uang dan penjaga barang dibedakan, jadi
   * satu HP hanya mencatat satu jenis. null = belum dipilih (layar pilih jenis tampil).
   */
  mode: BuwuhKind | null;
  /** Daftar barang dari server, disimpan agar tetap ada tanpa internet. */
  catalog: BuwuhCatalogItem[];
  /** Alamat pilihan dari admin (tombol di lembar nama), disimpan agar tetap ada tanpa internet. */
  addresses: string[];
  /** Alasan server menolak token (dicabut, atau bukan jenis meja buwuh); null bila diterima. */
  authError: string | null;
  /** Kapan terakhir berhasil sinkron (ms). */
  lastSyncAt: number;
};

type MetaRow = { key: string; value: unknown };

class BuwuhDb extends Dexie {
  entries!: Table<BuwuhRow, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("wedding-buwuh");
    // Perubahan skema harus lewat version(n+1).upgrade() yang membawa `entries` apa adanya.
    this.version(1).stores({ entries: "id, recordedAt", meta: "key" });
  }
}

export const buwuhDb = new BuwuhDb();

export async function getBuwuhMeta<K extends keyof BuwuhMetaMap>(
  key: K,
): Promise<BuwuhMetaMap[K] | undefined> {
  return (await buwuhDb.meta.get(key))?.value as BuwuhMetaMap[K] | undefined;
}

export async function setBuwuhMeta<K extends keyof BuwuhMetaMap>(
  key: K,
  value: BuwuhMetaMap[K],
): Promise<void> {
  await buwuhDb.meta.put({ key, value });
}

export async function getCatalog(): Promise<BuwuhCatalogItem[]> {
  return (await getBuwuhMeta("catalog")) ?? [...DEFAULT_BUWUH_CATALOG];
}

export type BuwuhDraft = {
  name: string;
  address: string | null;
  amount: number;
  items: BuwuhItem[];
};

/** Menyimpan catatan baru dan mengembalikan id-nya. */
export async function addEntry(draft: BuwuhDraft, now = Date.now()): Promise<string> {
  const id = uuid7(now);
  await buwuhDb.entries.add({
    id,
    ...draft,
    recordedAt: new Date(now).toISOString(),
    version: 1,
    syncedVersion: 0,
    deleted: false,
  });
  return id;
}

export async function updateEntry(id: string, draft: BuwuhDraft): Promise<void> {
  await buwuhDb.entries
    .where("id")
    .equals(id)
    .modify((row) => {
      Object.assign(row, draft);
      row.version += 1;
      row.syncError = undefined;
    });
}

/**
 * Menghapus catatan. Catatan yang belum pernah terkirim langsung dibuang; selebihnya ditandai
 * terhapus dan tetap dikirim agar server ikut menghapusnya.
 */
export async function deleteEntry(id: string): Promise<void> {
  await buwuhDb.transaction("rw", buwuhDb.entries, async () => {
    const row = await buwuhDb.entries.get(id);
    if (!row) return;
    if (row.syncedVersion === 0) {
      await buwuhDb.entries.delete(id);
      return;
    }
    await buwuhDb.entries.update(id, {
      deleted: true,
      version: row.version + 1,
      syncError: undefined,
    });
  });
}

/**
 * Petugas boleh mengubah atau menghapus catatan di HP hanya sebentar setelah mencatat (salah ketik,
 * salah nominal). Sesudahnya perbaikan lewat admin. Catatan yang ditolak server selalu boleh
 * diperbaiki supaya bisa terkirim.
 */
export const BUWUH_EDIT_WINDOW_MS = 10 * 60 * 1000;

export function editableUntil(row: Pick<BuwuhRow, "recordedAt">): number {
  return new Date(row.recordedAt).getTime() + BUWUH_EDIT_WINDOW_MS;
}

export function canEdit(row: Pick<BuwuhRow, "recordedAt" | "syncError">, now = Date.now()) {
  return !!row.syncError || now < editableUntil(row);
}

const isPending = (row: BuwuhRow) => row.version > row.syncedVersion;

/** Catatan yang perlu dikirim (baru, diubah, atau dihapus), yang paling lama lebih dulu. */
export async function pendingEntries(): Promise<BuwuhRow[]> {
  return (await buwuhDb.entries.orderBy("recordedAt").toArray()).filter(isPending);
}

export function countPending(): Promise<number> {
  return buwuhDb.entries.filter(isPending).count();
}

/** Menandai versi yang sudah diterima server (versi lebih baru yang ditulis sementara tetap antre). */
export async function markSynced(accepted: { id: string; version: number }[]): Promise<void> {
  await buwuhDb.transaction("rw", buwuhDb.entries, async () => {
    for (const { id, version } of accepted) {
      await buwuhDb.entries
        .where("id")
        .equals(id)
        .modify((row) => {
          row.syncedVersion = Math.max(row.syncedVersion, version);
          row.syncError = undefined;
        });
    }
  });
}

/** Bentuk kiriman ke server. */
export function toDeviceEntry(row: BuwuhRow): BuwuhDeviceEntry {
  return row.deleted
    ? { id: row.id, version: row.version, recordedAt: row.recordedAt, deleted: true }
    : {
        id: row.id,
        version: row.version,
        recordedAt: row.recordedAt,
        deleted: false,
        name: row.name,
        address: row.address,
        amount: row.amount,
        items: row.items,
      };
}

/** Catatan yang tampil di Riwayat (tanpa yang dihapus), terbaru lebih dulu. */
export async function visibleEntries(): Promise<BuwuhRow[]> {
  return (await buwuhDb.entries.orderBy("recordedAt").reverse().toArray()).filter(
    (row) => !row.deleted,
  );
}

/**
 * Alamat yang paling sering dicatat di HP ini (paling banyak `limit`), untuk tombol pintas.
 * Ejaan yang dipakai adalah yang terakhir diketik.
 */
export function frequentAddresses(rows: BuwuhRow[], limit = 6): string[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const row of [...rows].reverse()) {
    const label = row.address?.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    const current = counts.get(key);
    counts.set(key, { label, count: (current?.count ?? 0) + 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => item.label);
}

/**
 * Menyimpan token baru setelah pairing. Catatan TIDAK dihapus: yang belum terkirim (mis. karena
 * perangkat lama dicabut) akan dikirim dengan token baru. Kirim ulang aman karena id dibuat
 * perangkat. Ubahan atas catatan yang dulu terkirim lewat token lama diabaikan server (catatan itu
 * milik perangkat lama); perbaikannya lewat admin.
 */
export async function pairBuwuh(auth: BuwuhAuth): Promise<void> {
  await buwuhDb.transaction("rw", buwuhDb.meta, async () => {
    await setBuwuhMeta("auth", auth);
    await setBuwuhMeta("authError", null);
  });
}

export class PendingEntriesError extends Error {
  constructor(readonly pending: number) {
    super(`Masih ada ${pending} catatan yang belum terkirim. Sambungkan internet dulu.`);
  }
}

/**
 * Melepas HP meja: menghapus semua catatan dan pengaturan di HP ini. Ditolak bila masih ada catatan
 * yang belum terkirim; dicek di dalam transaksi yang sama agar tidak bisa terlewat.
 */
export async function releaseBuwuh(): Promise<void> {
  await buwuhDb.transaction("rw", [buwuhDb.entries, buwuhDb.meta], async () => {
    const pending = await countPending();
    if (pending > 0) throw new PendingEntriesError(pending);
    await buwuhDb.entries.clear();
    await buwuhDb.meta.clear();
  });
}
