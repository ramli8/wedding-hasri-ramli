import { createHash, randomBytes, randomInt } from "node:crypto";
import type { Device, DeviceKind, PairResponse } from "@wedding/shared";
import { DEVICE_PAIR_PAGE, PAIRING_CODE_LENGTH } from "@wedding/shared";
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { isUniqueViolation } from "../db/errors.js";
import { checkinEvents, devices } from "../db/schema.js";
import { AppError } from "../http/errors.js";

export type DeviceRow = typeof devices.$inferSelect;

// Alfabet yang sama dengan kode tamu (tanpa I, O, 0, 1).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function generatePairingCode(): string {
  let code = "";
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** "K7M29QXA" → "K7M2-9QXA" */
export const formatPairingCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

export function toDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as Device["kind"],
    status: row.status as Device["status"],
    appVersion: row.appVersion,
    protocolVersion: row.protocolVersion,
    lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    pendingOutbox: row.pendingOutbox,
    createdAt: row.createdAt.toISOString(),
    // Kode pairing tidak lagi kedaluwarsa (lihat createDevice); isi kolom lama diabaikan.
    pairingExpiresAt: null,
  };
}

export async function listDevices(db: Db): Promise<Device[]> {
  const rows = await db.select().from(devices);
  return rows.map((row) => toDevice(row)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Membuat perangkat beserta kode pairing. Kode tidak kedaluwarsa: berlaku sampai dipakai sekali,
 * diganti, atau perangkatnya dicabut. Dengan begitu perangkat cadangan bisa disiapkan jauh hari dan
 * dipasang siapa saja di hari-H tanpa perlu membuka admin. Tebakan kode tetap dibatasi per IP.
 */
export async function createDevice(db: Db, name: string, kind: DeviceKind = "scanner") {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePairingCode();
    try {
      const [row] = await db
        .insert(devices)
        .values({
          name,
          kind,
          pairingCodeHash: sha256(code),
          pairingCode: formatPairingCode(code),
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

/**
 * Kode pairing baru untuk perangkat yang belum dipasang (mis. kode lama hilang).
 * Kode lama langsung tidak berlaku karena hash-nya diganti.
 */
export async function renewPairingCode(db: Db, id: string) {
  const [current] = await db
    .select({ status: devices.status })
    .from(devices)
    .where(eq(devices.id, id))
    .limit(1);
  if (!current) throw new AppError(404, "NOT_FOUND", "Perangkat tidak ditemukan");
  if (current.status !== "pending") {
    throw new AppError(
      409,
      "CONFLICT",
      current.status === "active"
        ? "Perangkat sudah terpasang. Kode pairing baru hanya untuk perangkat yang belum dipasang."
        : "Perangkat sudah dicabut. Tambahkan perangkat baru.",
    );
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePairingCode();
    try {
      // Syarat status diulang di WHERE: bila perangkat terpasang di sela-sela, tidak ada yang diubah.
      const [row] = await db
        .update(devices)
        .set({
          pairingCodeHash: sha256(code),
          pairingCode: formatPairingCode(code),
          pairingExpiresAt: null,
        })
        .where(and(eq(devices.id, id), eq(devices.status, "pending")))
        .returning();
      if (!row) {
        throw new AppError(409, "CONFLICT", "Perangkat sudah terpasang atau dicabut");
      }
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
    // Hash dibiarkan: kode perangkat yang dicabut ditolak dengan pesan yang jelas.
    .set({ status: "revoked", pairingExpiresAt: null })
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

const KIND_PAGE: Record<DeviceKind, string> = {
  scanner: `HP penjaga pintu: buka ${DEVICE_PAIR_PAGE.scanner}`,
  booth: `laptop photobooth: buka ${DEVICE_PAIR_PAGE.booth}`,
  buwuh: `HP meja buwuh: buka ${DEVICE_PAIR_PAGE.buwuh}`,
  layar: `layar (TV/proyektor): buka ${DEVICE_PAIR_PAGE.layar}`,
};

/**
 * Menukar kode pairing sekali pakai dengan token perangkat. Jenis perangkat sudah dipilih admin saat
 * membuat kode; kode yang dipakai di halaman pasang jenis lain ditolak (409) tanpa menghanguskannya,
 * supaya kode laptop photobooth di area umum tidak bisa dipakai untuk mengambil daftar tamu.
 */
export async function pairDevice(
  db: Db,
  code: string,
  kind: DeviceKind = "scanner",
): Promise<PairResponse | null> {
  const token = randomBytes(32).toString("base64url");
  const [row] = await db.transaction(async (tx) => {
    const [pending] = await tx
      .select()
      .from(devices)
      .where(eq(devices.pairingCodeHash, sha256(code)))
      .for("update")
      .limit(1);
    if (!pending) return [];
    if (pending.status === "active") {
      throw new AppError(
        409,
        "CONFLICT",
        `Kode ini sudah dipakai untuk memasang “${pending.name}”. Satu kode hanya untuk satu perangkat; minta admin membuat perangkat baru.`,
      );
    }
    if (pending.status === "revoked") {
      throw new AppError(
        409,
        "CONFLICT",
        `Perangkat “${pending.name}” sudah dicabut admin, jadi kodenya tidak bisa dipakai lagi.`,
      );
    }
    if (pending.kind !== kind) {
      throw new AppError(
        409,
        "CONFLICT",
        `Kode ini untuk ${KIND_PAGE[pending.kind as DeviceKind]} dan ketik kodenya di sana.`,
      );
    }
    return tx
      .update(devices)
      .set({
        status: "active",
        tokenHash: sha256(token),
        // Kode tetap tersimpan (cetak ulang kartu, pesan "sudah dipakai"), tetapi tidak bisa
        // memasang lagi karena status tidak lagi pending.
        pairingExpiresAt: null,
        lastSeenAt: new Date(),
      })
      .where(eq(devices.id, pending.id))
      .returning();
  });
  return row ? { token, deviceId: row.id, deviceName: row.name } : null;
}

export type PairingCard = {
  id: string;
  name: string;
  kind: DeviceKind;
  status: Device["status"];
  /** null: perangkat lama yang terpasang sebelum kode disimpan; kodenya tidak bisa ditampilkan. */
  code: string | null;
};

/**
 * Kartu pasang untuk perangkat terpilih, memakai kode yang tersimpan (tidak membuat kode baru).
 * Perangkat pending yang belum punya kode tersimpan (dibuat sebelum fitur ini) diberi kode baru.
 */
export async function pairingCards(db: Db, ids: string[]): Promise<PairingCard[]> {
  if (ids.length === 0) return [];
  const rows = await db.select().from(devices).where(inArray(devices.id, ids));
  const cards: PairingCard[] = [];
  for (const row of rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    if (row.status === "revoked") continue;
    let code = row.pairingCode;
    if (!code && row.status === "pending") code = (await renewPairingCode(db, row.id)).pairingCode;
    cards.push({
      id: row.id,
      name: row.name,
      kind: row.kind as DeviceKind,
      status: row.status as Device["status"],
      code,
    });
  }
  return cards;
}

/** Menandai perangkat masih hidup (untuk "Perangkat online" di Beranda). */
export async function touchDevice(db: Db, id: string): Promise<void> {
  await db.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, id));
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
