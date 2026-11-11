import type {
  DeviceEvent,
  SnapshotGuest,
  SnapshotResponse,
  StoredEvent,
  WalkinGuest,
} from "@wedding/shared";
import Dexie, { type Table } from "dexie";

/**
 * Event milik perangkat ini. `sentAt` terisi setelah server menerimanya, tetapi event tetap di sini
 * sampai muncul di data server hasil pull; dengan begitu perangkat tidak pernah "lupa" check-in
 * miliknya sendiri di antara push yang berhasil dan pull berikutnya.
 */
export type OutboxEvent = DeviceEvent & { createdAt: number; sentAt?: number };

/** Tamu walk-in yang dibuat di perangkat ini dan belum dikirim. */
export type PendingWalkin = WalkinGuest & { createdAt: number };

/** Event yang ditolak server (mis. lewat batas koreksi). Disimpan agar penjaga tahu. */
export type RejectedEvent = {
  id: string;
  kind: DeviceEvent["kind"];
  guestId: string;
  reason: string;
  at: number;
};

export type LocalGroup = SnapshotResponse["groups"][number];
export type LocalSession = SnapshotResponse["sessions"][number];
export type LocalEvent = SnapshotResponse["event"];

export type AuthMeta = { token: string; deviceId: string; deviceName: string };

/** Kunci dan tipe nilai di tabel `meta`. */
export type MetaMap = {
  auth: AuthMeta;
  event: LocalEvent;
  guestRev: number;
  checkinSeq: number;
  /** Selisih jam server terhadap jam perangkat (ms). */
  serverOffsetMs: number;
  lastSyncAt: number;
  protocol: { version: number; minSupported: number };
  revoked: boolean;
  outdated: boolean;
  sound: boolean;
  /** Kamera pilihan penjaga: belakang (bawaan) atau depan (mis. tablet di dudukan menghadap tamu). */
  cameraFacing: "environment" | "user";
  /** Id kamera terakhir yang dipilih lewat tombol ganti kamera. */
  cameraDeviceId: string;
};

type MetaRow = { key: string; value: unknown };

class ScanDb extends Dexie {
  guests!: Table<SnapshotGuest, string>;
  groups!: Table<LocalGroup, string>;
  sessions!: Table<LocalSession, string>;
  /** Event check-in yang sudah dikenal server (dari semua perangkat). */
  events!: Table<StoredEvent, string>;
  outbox!: Table<OutboxEvent, string>;
  walkins!: Table<PendingWalkin, string>;
  rejected!: Table<RejectedEvent, string>;
  devices!: Table<{ id: string; name: string }, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("wedding-scan");
    // Perubahan skema harus lewat version(n+1).upgrade() yang membawa `outbox` apa adanya
    // (lihat docs/rancangan.md §6.7).
    this.version(1).stores({
      guests: "id, code",
      groups: "id",
      sessions: "groupId",
      events: "id, seq, guestId",
      outbox: "id, createdAt",
      walkins: "id, createdAt",
      rejected: "id, at",
      devices: "id",
      meta: "key",
    });
  }
}

export const db = new ScanDb();

export async function getMeta<K extends keyof MetaMap>(key: K): Promise<MetaMap[K] | undefined> {
  return (await db.meta.get(key))?.value as MetaMap[K] | undefined;
}

export async function setMeta<K extends keyof MetaMap>(key: K, value: MetaMap[K]): Promise<void> {
  await db.meta.put({ key, value });
}

/** Menghapus semua data perangkat. Hanya untuk tes; aplikasi memakai releaseDevice/repairDevice. */
export async function resetDevice(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.guests,
      db.groups,
      db.sessions,
      db.events,
      db.outbox,
      db.walkins,
      db.rejected,
      db.devices,
      db.meta,
    ],
    async () => {
      await Promise.all([
        db.guests.clear(),
        db.groups.clear(),
        db.sessions.clear(),
        db.events.clear(),
        db.outbox.clear(),
        db.walkins.clear(),
        db.rejected.clear(),
        db.devices.clear(),
        db.meta.clear(),
      ]);
    },
  );
}

/** Jumlah check-in dan tamu walk-in yang belum diterima server. */
export async function pendingCount(): Promise<number> {
  return (await db.outbox.filter((e) => !e.sentAt).count()) + (await db.walkins.count());
}

/** Pengaturan perangkat yang tetap disimpan saat dipasangkan ulang. */
const KEEP_ON_REPAIR: (keyof MetaMap)[] = [
  "sound",
  "cameraFacing",
  "cameraDeviceId",
  "serverOffsetMs",
];

/**
 * Memasangkan ulang (mis. setelah dicabut admin): data tamu dan log diunduh ulang dari nol, tetapi
 * check-in dan walk-in yang BELUM terkirim tetap disimpan lalu dikirim dengan token baru. Dulu
 * semuanya dihapus, sehingga check-in yang tertahan karena perangkat dicabut hilang permanen.
 */
export async function repairDevice(auth: AuthMeta): Promise<void> {
  await db.transaction(
    "rw",
    [db.guests, db.groups, db.sessions, db.events, db.rejected, db.devices, db.meta],
    async () => {
      const kept = (await db.meta.bulkGet(KEEP_ON_REPAIR)).filter((row): row is MetaRow => !!row);
      await Promise.all([
        db.guests.clear(),
        db.groups.clear(),
        db.sessions.clear(),
        db.events.clear(),
        db.rejected.clear(),
        db.devices.clear(),
        db.meta.clear(),
      ]);
      await db.meta.bulkPut(kept);
      await setMeta("auth", auth);
    },
  );
}

export class PendingDataError extends Error {
  constructor(readonly pending: number) {
    super(
      `Masih ada ${pending} check-in yang belum terkirim. Hubungkan internet dan tunggu sinkron dulu.`,
    );
  }
}

/**
 * Melepas perangkat: semua data dihapus. Ditolak bila masih ada check-in/walk-in yang belum
 * terkirim; diperiksa di dalam transaksi yang sama, bukan dari angka di layar yang bisa basi.
 */
export async function releaseDevice(): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    const pending = await pendingCount();
    if (pending > 0) throw new PendingDataError(pending);
    await Promise.all(db.tables.map((table) => table.clear()));
  });
}
