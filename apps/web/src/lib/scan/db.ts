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
export type PendingWalkin = Omit<WalkinGuest, "quota"> & { quota: number; createdAt: number };

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

/** Menghapus semua data perangkat (setelah dicabut atau dipasangkan ulang). */
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
