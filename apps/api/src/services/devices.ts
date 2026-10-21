import { createHash, randomBytes, randomInt } from "node:crypto";
import type { Device, PairResponse } from "@wedding/shared";
import { PAIRING_CODE_LENGTH } from "@wedding/shared";
import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isUniqueViolation } from "../db/errors.js";
import { checkinEvents, devices } from "../db/schema.js";
import { AppError } from "../http/errors.js";

export type DeviceRow = typeof devices.$inferSelect;

// Alfabet yang sama dengan kode tamu (tanpa I, O, 0, 1).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAIRING_TTL_MS = 24 * 60 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function generatePairingCode(): string {
  let code = "";
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** "K7M29QXA" → "K7M2-9QXA" */
export const formatPairingCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

export function toDevice(row: DeviceRow, now = new Date()): Device {
  const pairing = row.pairingExpiresAt && row.pairingExpiresAt > now ? row.pairingExpiresAt : null;
  return {
    id: row.id,
    name: row.name,
    status: row.status as Device["status"],
    appVersion: row.appVersion,
    protocolVersion: row.protocolVersion,
    lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    pendingOutbox: row.pendingOutbox,
    createdAt: row.createdAt.toISOString(),
    pairingExpiresAt: row.status === "pending" ? (pairing?.toISOString() ?? null) : null,
  };
}

export async function listDevices(db: Db): Promise<Device[]> {
  const rows = await db.select().from(devices);
  const now = new Date();
  return rows
    .map((row) => toDevice(row, now))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createDevice(db: Db, name: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePairingCode();
    try {
      const [row] = await db
        .insert(devices)
        .values({
          name,
          pairingCodeHash: sha256(code),
          pairingExpiresAt: new Date(Date.now() + PAIRING_TTL_MS),
        })
        .returning();
      if (!row) throw new Error("Gagal membuat perangkat");
      return { device: toDevice(row), pairingCode: formatPairingCode(code) };
    } catch (err) {
      if (isUniqueViolation(err, "devices_pairing_code_hash_unique")) continue;
      throw err;
    }
  }
  throw new Error("Gagal membuat kode pairing yang unik");
}

/** Mencabut perangkat. Token lama tetap dikenali supaya perangkat tahu dirinya dicabut. */
export async function revokeDevice(db: Db, id: string): Promise<Device> {
  const [row] = await db
    .update(devices)
    .set({ status: "revoked", pairingCodeHash: null, pairingExpiresAt: null })
    .where(eq(devices.id, id))
    .returning();
  if (!row) throw new AppError(404, "NOT_FOUND", "Perangkat tidak ditemukan");
  return toDevice(row);
}

/**
 * Menghapus perangkat yang sudah dicabut atau belum pernah dipasang. Riwayat check-in tetap ada;
 * hanya penanda perangkatnya yang dikosongkan, jadi log tidak lagi menyebut nama perangkat itu.
 */
export async function deleteDevice(db: Db, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ status: devices.status })
      .from(devices)
      .where(eq(devices.id, id));
    if (!row) throw new AppError(404, "NOT_FOUND", "Perangkat tidak ditemukan");
    if (row.status === "active") {
      throw new AppError(409, "CONFLICT", "Perangkat masih aktif. Cabut dulu sebelum dihapus.");
    }
    await tx.update(checkinEvents).set({ deviceId: null }).where(eq(checkinEvents.deviceId, id));
    await tx.delete(devices).where(eq(devices.id, id));
  });
}

/** Menukar kode pairing sekali pakai dengan token perangkat. */
export async function pairDevice(db: Db, code: string): Promise<PairResponse | null> {
  const token = randomBytes(32).toString("base64url");
  const [row] = await db.transaction(async (tx) => {
    const [pending] = await tx
      .select()
      .from(devices)
      .where(eq(devices.pairingCodeHash, sha256(code)))
      .for("update")
      .limit(1);
    const expired = !pending?.pairingExpiresAt || pending.pairingExpiresAt <= new Date();
    if (pending?.status !== "pending" || expired) return [];
    return tx
      .update(devices)
      .set({
        status: "active",
        tokenHash: sha256(token),
        // kode hangus: tidak bisa dipakai di perangkat lain
        pairingCodeHash: null,
        pairingExpiresAt: null,
        lastSeenAt: new Date(),
      })
      .where(eq(devices.id, pending.id))
      .returning();
  });
  return row ? { token, deviceId: row.id, deviceName: row.name } : null;
}

export async function authenticateDevice(db: Db, token: string): Promise<DeviceRow> {
  const [row] = await db
    .select()
    .from(devices)
    .where(eq(devices.tokenHash, sha256(token)))
    .limit(1);
  if (!row) throw new AppError(401, "UNAUTHENTICATED", "Perangkat tidak dikenal");
  if (row.status === "revoked") {
    throw new AppError(401, "DEVICE_REVOKED", "Perangkat ini sudah dicabut oleh admin");
  }
  return row;
}
