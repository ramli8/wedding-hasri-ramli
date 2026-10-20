import {
  CHECKIN_UNDO_WINDOW_MS,
  type CheckinMethod,
  MAX_PAX,
  type ResolverEvent,
  resolveCheckins,
  type SnapshotGuest,
  type StoredEvent,
  uuid7,
  withinUndoWindow,
} from "@wedding/shared";
import { correctedIso, correctedNow } from "./clock.js";
import { db, getMeta, type LocalGroup, type OutboxEvent, type PendingWalkin } from "./db.js";
import { syncEngine, walkinToGuest } from "./sync.js";

export type GuestView = { guest: SnapshotGuest; group: LocalGroup | null };

export type Outcome =
  | {
      status: "ok";
      view: GuestView;
      pax: number;
      checkinId: string;
      scannedAt: string;
      method: CheckinMethod;
    }
  | {
      status: "already";
      view: GuestView;
      pax: number;
      scannedAt: string;
      /** Nama perangkat yang menerima lebih dulu, atau "perangkat ini". */
      by: string;
    }
  | { status: "invalid"; code: string };

function toResolver(e: StoredEvent | OutboxEvent): ResolverEvent {
  return {
    id: e.id,
    kind: e.kind,
    guestId: e.guestId,
    eventId: e.eventId,
    targetId: "targetId" in e ? (e.targetId ?? null) : null,
    pax: "pax" in e ? (e.pax ?? null) : null,
    scannedAt: e.scannedAt,
  };
}

/** Event yang diketahui perangkat: dari server ditambah outbox milik sendiri. */
async function eventsOf(guestId: string) {
  const known = await db.events.where("guestId").equals(guestId).toArray();
  const mine = (await db.outbox.toArray()).filter((e) => e.guestId === guestId);
  return { known, mine };
}

async function currentState(guestId: string, eventId: string) {
  const { known, mine } = await eventsOf(guestId);
  const states = resolveCheckins([...known, ...mine].map(toResolver));
  return states.find((s) => s.guestId === guestId && s.eventId === eventId) ?? null;
}

async function describeWho(checkinId: string): Promise<string> {
  if (await db.outbox.get(checkinId)) return "perangkat ini";
  const stored = await db.events.get(checkinId);
  const auth = await getMeta("auth");
  if (stored?.deviceId) {
    if (stored.deviceId === auth?.deviceId) return "perangkat ini";
    return (await db.devices.get(stored.deviceId))?.name ?? "perangkat lain";
  }
  return stored?.adminId ? "admin" : "perangkat lain";
}

async function viewOf(guest: SnapshotGuest): Promise<GuestView> {
  return { guest, group: guest.groupId ? ((await db.groups.get(guest.groupId)) ?? null) : null };
}

// Urutan outbox = urutan pengiriman. `createdAt` harus naik ketat: dua event di milidetik yang sama
// (mis. check-in lalu undo) tidak boleh tertukar, sebab server menolak undo yang tiba sebelum targetnya.
let lastStamp = 0;
const stamp = () => {
  lastStamp = Math.max(Date.now(), lastStamp + 1);
  return lastStamp;
};

const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

/** QR berisi kode mentah; tautan /u/KODE yang disalin tamu juga diterima. */
export function extractCode(raw: string): string | null {
  const text = raw.trim().toUpperCase();
  if (CODE_PATTERN.test(text)) return text;
  const fromLink = /\/U\/([A-Z0-9]{6})(?:[/?#]|$)/.exec(text)?.[1];
  return fromLink && CODE_PATTERN.test(fromLink) ? fromLink : null;
}

/**
 * Mencatat check-in tamu. Jumlah orang bawaan = kuota; penjaga mengubahnya setelahnya (dalam 2
 * menit) bila yang datang berbeda. Bila tamu sudah tercatat, tidak ada yang ditulis.
 */
export async function checkIn(guest: SnapshotGuest, method: CheckinMethod): Promise<Outcome> {
  const event = await getMeta("event");
  if (!event) throw new Error("Data acara belum diunduh. Hubungkan ke internet sekali.");

  const outcome = await db.transaction(
    "rw",
    [db.events, db.outbox, db.devices, db.groups, db.meta],
    async (): Promise<Outcome> => {
      const view = await viewOf(guest);
      const state = await currentState(guest.id, event.id);
      if (state) {
        return {
          status: "already",
          view,
          pax: state.pax,
          scannedAt: state.primary.scannedAt,
          by: await describeWho(state.primary.id),
        };
      }
      const id = uuid7();
      const scannedAt = correctedIso();
      await db.outbox.add({
        id,
        kind: "checkin",
        guestId: guest.id,
        eventId: event.id,
        pax: guest.quota,
        method,
        scannedAt,
        createdAt: stamp(),
      });
      return { status: "ok", view, pax: guest.quota, checkinId: id, scannedAt, method };
    },
  );
  if (outcome.status === "ok") syncEngine.trigger();
  return outcome;
}

export async function handleScan(raw: string, method: CheckinMethod = "qr"): Promise<Outcome> {
  const code = extractCode(raw);
  if (!code) return { status: "invalid", code: raw.trim().slice(0, 40) };
  const guest = await db.guests.where("code").equals(code).first();
  if (!guest) return { status: "invalid", code };
  return checkIn(guest, method);
}

// --- Koreksi ------------------------------------------------------------------------------------------

async function correctableTarget(checkinId: string) {
  const mine = await db.outbox.get(checkinId);
  const stored = mine ? undefined : await db.events.get(checkinId);
  const target = mine ?? stored;
  if (target?.kind !== "checkin") throw new Error("Check-in tidak ditemukan.");

  const auth = await getMeta("auth");
  if (!mine && stored?.deviceId !== auth?.deviceId) {
    throw new Error("Hanya perangkat yang sama yang boleh mengoreksi.");
  }
  if (!withinUndoWindow(target, correctedIso())) {
    throw new Error("Batas waktu koreksi (2 menit) sudah lewat. Minta admin.");
  }
  return target;
}

export async function undoCheckin(checkinId: string): Promise<void> {
  const target = await correctableTarget(checkinId);
  await db.outbox.add({
    id: uuid7(),
    kind: "undo",
    guestId: target.guestId,
    eventId: target.eventId,
    targetId: checkinId,
    scannedAt: correctedIso(),
    createdAt: stamp(),
  });
  syncEngine.trigger();
}

export async function changePax(checkinId: string, pax: number): Promise<void> {
  if (!Number.isInteger(pax) || pax < 1 || pax > MAX_PAX) {
    throw new Error(`Jumlah orang harus 1 sampai ${MAX_PAX}.`);
  }
  const target = await correctableTarget(checkinId);
  await db.outbox.add({
    id: uuid7(),
    kind: "set_pax",
    guestId: target.guestId,
    eventId: target.eventId,
    targetId: checkinId,
    pax,
    scannedAt: correctedIso(),
    createdAt: stamp(),
  });
  syncEngine.trigger();
}

/** Sisa waktu (ms) untuk membatalkan atau mengubah jumlah sebuah check-in. */
export function undoRemainingMs(scannedAt: string): number {
  return Math.max(0, Date.parse(scannedAt) + CHECKIN_UNDO_WINDOW_MS - correctedNow());
}

// --- Walk-in ------------------------------------------------------------------------------------------

export type WalkinInput = {
  displayName: string;
  phone?: string;
  instagram?: string;
  groupId?: string | null;
  quota: number;
  usherNote?: string;
};

/** Tamu yang tidak ada di daftar: dibuat di perangkat, langsung check-in, dikirim saat sinkron. */
export async function addWalkin(input: WalkinInput): Promise<Outcome> {
  const event = await getMeta("event");
  if (!event) throw new Error("Data acara belum diunduh. Hubungkan ke internet sekali.");

  const walkin: PendingWalkin = {
    id: uuid7(),
    eventId: event.id,
    displayName: input.displayName.trim(),
    phone: input.phone?.trim() || null,
    instagram: input.instagram?.trim() || null,
    groupId: input.groupId ?? null,
    quota: input.quota,
    usherNote: input.usherNote?.trim() || null,
    createdAt: stamp(),
  };
  await db.transaction("rw", [db.walkins, db.guests], async () => {
    await db.walkins.add(walkin);
    await db.guests.put(walkinToGuest(walkin));
  });
  return checkIn(walkinToGuest(walkin), "walkin");
}

/** Apakah tamu sudah tercatat masuk (menurut data yang diketahui perangkat ini). */
export async function isCheckedIn(guestId: string): Promise<boolean> {
  const event = await getMeta("event");
  return event ? (await currentState(guestId, event.id)) !== null : false;
}
