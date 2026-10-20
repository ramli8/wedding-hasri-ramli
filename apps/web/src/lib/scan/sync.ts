import type { PushRequest, SnapshotGuest } from "@wedding/shared";
import { useSyncExternalStore } from "react";
import { ApiError } from "../api.js";
import { loadClockOffset, updateClockOffset } from "./clock.js";
import { db, getMeta, pendingCount, setMeta } from "./db.js";
import { deviceApi } from "./device-api.js";
import { APP_VERSION } from "./version.js";

export type SyncStatus = {
  /** Sinkronisasi terakhir berhasil, artinya server terjangkau. */
  online: boolean;
  syncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
  /** Aplikasi terlalu lama untuk server. Scan tetap jalan; sinkronisasi berhenti sampai diperbarui. */
  outdated: boolean;
  /** Perangkat dicabut admin. */
  revoked: boolean;
};

const BASE_INTERVAL_MS = 5_000;
const MAX_INTERVAL_MS = 30_000;
const PUSH_CHUNK = 200;

/**
 * Mengirim outbox lalu menarik perubahan dari server, berulang selama aplikasi terbuka.
 * Outbox tidak pernah dihapus sebelum server mengonfirmasi, sehingga gagal di tengah jalan
 * hanya berarti dikirim ulang (server idempoten berdasarkan id event).
 */
export class SyncEngine {
  private status: SyncStatus = {
    online: false,
    syncing: false,
    lastSyncAt: null,
    lastError: null,
    outdated: false,
    revoked: false,
  };
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running = false;
  private rerun = false;
  private started = false;
  private failures = 0;

  getSnapshot = () => this.status;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private update(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    for (const listener of this.listeners) listener();
  }

  async start() {
    if (this.started) return;
    this.started = true;
    await loadClockOffset();
    this.update({
      lastSyncAt: (await getMeta("lastSyncAt")) ?? null,
      outdated: (await getMeta("outdated")) ?? false,
      revoked: (await getMeta("revoked")) ?? false,
    });
    window.addEventListener("online", this.trigger);
    this.schedule(0);
  }

  stop() {
    this.started = false;
    clearTimeout(this.timer);
    window.removeEventListener("online", this.trigger);
  }

  /** Sinkronkan segera (mis. setelah check-in baru). */
  trigger = () => {
    if (!this.started) return;
    this.schedule(300);
  };

  /** Sinkronkan sekarang dan tunggu selesai (untuk tombol "Sinkron sekarang"). */
  async syncNow() {
    await this.runOnce();
  }

  private schedule(delay: number) {
    clearTimeout(this.timer);
    if (!this.started || this.status.revoked) return;
    this.timer = setTimeout(() => void this.runOnce(), delay);
  }

  private async runOnce() {
    if (this.running) {
      this.rerun = true;
      return;
    }
    const auth = await getMeta("auth");
    if (!auth || this.status.revoked) return;

    this.running = true;
    this.update({ syncing: true });
    try {
      if (!this.status.outdated) {
        await this.push(auth.token);
        await this.pull(auth.token);
      }
      this.failures = 0;
      const now = Date.now();
      await setMeta("lastSyncAt", now);
      this.update({ online: true, lastError: null, lastSyncAt: now });
    } catch (err) {
      await this.handleError(err);
    } finally {
      this.running = false;
      this.update({ syncing: false });
      const delay = this.rerun
        ? 300
        : Math.min(BASE_INTERVAL_MS * 2 ** this.failures, MAX_INTERVAL_MS);
      this.rerun = false;
      this.schedule(delay);
    }
  }

  private async handleError(err: unknown) {
    this.failures += 1;
    if (err instanceof ApiError) {
      if (err.code === "DEVICE_REVOKED") {
        await setMeta("revoked", true);
        this.update({ revoked: true, online: true, lastError: err.message });
        return;
      }
      if (err.code === "APP_OUTDATED") {
        await setMeta("outdated", true);
        this.update({ outdated: true, online: true, lastError: err.message });
        return;
      }
      this.update({ online: err.code !== "NETWORK" && err.status < 500, lastError: err.message });
      return;
    }
    this.update({ online: false, lastError: err instanceof Error ? err.message : "Gagal sinkron" });
  }

  private async push(token: string) {
    // Kirim berkala meski kosong: itu yang memberi tahu dashboard bahwa perangkat hidup.
    for (let round = 0; round < 20; round++) {
      const events = await db.outbox
        .orderBy("createdAt")
        .filter((e) => !e.sentAt)
        .limit(PUSH_CHUNK)
        .toArray();
      const walkins = round === 0 ? await db.walkins.orderBy("createdAt").toArray() : [];

      const body: PushRequest = {
        deviceTime: new Date().toISOString(),
        appVersion: APP_VERSION,
        pendingOutbox: await pendingCount(),
        walkins: walkins.map(({ createdAt: _created, ...walkin }) => walkin),
        events: events.map(({ createdAt: _created, sentAt: _sent, ...event }) => event),
      };

      const sentAt = Date.now();
      const response = await deviceApi.push(token, body);
      await updateClockOffset(response.serverTime, sentAt, Date.now());

      await db.transaction("rw", [db.outbox, db.walkins, db.rejected, db.guests], async () => {
        for (const result of response.results) {
          if (result.status === "invalid") {
            const rejected = events.find((e) => e.id === result.id);
            if (rejected) {
              await db.rejected.put({
                id: rejected.id,
                kind: rejected.kind,
                guestId: rejected.guestId,
                reason: result.reason ?? "Ditolak server",
                at: Date.now(),
              });
            }
            await db.outbox.delete(result.id);
          } else {
            // Diterima. Tetap disimpan sampai terlihat di data server (lihat pull).
            await db.outbox.update(result.id, { sentAt: Date.now() });
          }
        }
        for (const { id, code } of response.walkinCodes) {
          await db.guests.update(id, { code });
        }
        await db.walkins.bulkDelete(walkins.map((w) => w.id));
      });

      if (events.length < PUSH_CHUNK) break;
    }
  }

  private async pull(token: string) {
    const storedEvent = await getMeta("event");
    let since = {
      rev: (await getMeta("guestRev")) ?? 0,
      seq: (await getMeta("checkinSeq")) ?? 0,
    };

    for (let attempt = 0; attempt < 2; attempt++) {
      const sentAt = Date.now();
      const snap = await deviceApi.snapshot(token, since);
      await updateClockOffset(snap.serverTime, sentAt, Date.now());

      // Acara check-in berganti: data lama tidak berlaku, unduh ulang dari nol.
      if (storedEvent && storedEvent.id !== snap.event.id && (since.rev > 0 || since.seq > 0)) {
        await db.transaction("rw", [db.guests, db.events], async () => {
          await db.guests.clear();
          await db.events.clear();
        });
        since = { rev: 0, seq: 0 };
        continue;
      }

      const isFull = since.rev === 0;
      await db.transaction(
        "rw",
        [db.guests, db.groups, db.sessions, db.events, db.devices, db.outbox, db.meta],
        async () => {
          if (isFull) await db.guests.clear();
          const toDelete: string[] = [];
          const toPut: SnapshotGuest[] = [];
          for (const guest of snap.guests) {
            if (guest.invited) toPut.push(guest);
            else toDelete.push(guest.id);
          }
          if (toDelete.length) await db.guests.bulkDelete(toDelete);
          if (toPut.length) await db.guests.bulkPut(toPut);

          await db.groups.clear();
          await db.groups.bulkPut(snap.groups);
          await db.sessions.clear();
          await db.sessions.bulkPut(snap.sessions);
          if (snap.devices.length) await db.devices.bulkPut(snap.devices);
          if (snap.events.length) await db.events.bulkPut(snap.events);

          // Event milik sendiri yang sudah terkirim dan kini ada di data server tidak perlu disimpan
          // dua kali. Sisa event lama dari acara lain dibuang.
          const sent = await db.outbox.filter((e) => !!e.sentAt).toArray();
          const confirmed = await db.events.bulkGet(sent.map((e) => e.id));
          const drop = sent
            .filter((e, i) => confirmed[i] || e.eventId !== snap.event.id)
            .map((e) => e.id);
          if (drop.length) await db.outbox.bulkDelete(drop);

          await setMeta("event", snap.event);
          await setMeta("protocol", snap.protocol);
          await setMeta("guestRev", Math.max(since.rev, snap.guestRev));
          await setMeta("checkinSeq", Math.max(since.seq, snap.checkinSeq));
        },
      );
      return;
    }
  }
}

/** Bentuk tamu walk-in yang belum terkirim sebagai tamu lokal (belum punya kode). */
export function walkinToGuest(walkin: {
  id: string;
  displayName: string;
  groupId?: string | null;
  quota: number;
  usherNote?: string | null;
}): SnapshotGuest {
  return {
    id: walkin.id,
    code: null,
    displayName: walkin.displayName,
    fullName: null,
    groupId: walkin.groupId ?? null,
    quota: walkin.quota,
    usherNote: walkin.usherNote ?? null,
    source: "walkin",
    invited: true,
    rev: 0,
  };
}

export const syncEngine = new SyncEngine();

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(syncEngine.subscribe, syncEngine.getSnapshot);
}
