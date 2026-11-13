import { randomUUID } from "node:crypto";
import {
  type BuwuhCatalogItem,
  type BuwuhData,
  type BuwuhEntry,
  type BuwuhItem,
  type BuwuhSummary,
  type buwuhDeviceEntrySchema,
  DEFAULT_BUWUH_CATALOG,
  formatBuwuhItems,
} from "@wedding/shared";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client.js";
import { buwuhConfig, buwuhEntries, devices } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { type DeviceRow, touchDevice } from "./devices.js";
import { safeCell } from "./guest-import.js";
import { buildXlsx } from "./xlsx-template.js";

type EntryRow = typeof buwuhEntries.$inferSelect;
type DeviceEntry = z.output<typeof buwuhDeviceEntrySchema>;

const notFound = () => new AppError(404, "NOT_FOUND", "Catatan buwuh tidak ditemukan");

const toEntry = (row: EntryRow, deviceName: string | null): BuwuhEntry => ({
  id: row.id,
  name: row.name,
  address: row.address,
  amount: row.amount,
  items: row.items,
  note: row.note,
  deviceName,
  recordedAt: row.recordedAt.toISOString(),
  editedAt: row.editedAt?.toISOString() ?? null,
});

// --- Daftar barang --------------------------------------------------------------------------------

export async function getBuwuhCatalog(db: Db): Promise<BuwuhCatalogItem[]> {
  const [row] = await db.select().from(buwuhConfig).where(eq(buwuhConfig.id, 1));
  return row ? row.catalog : [...DEFAULT_BUWUH_CATALOG];
}

export async function getBuwuhAddresses(db: Db): Promise<string[]> {
  const [row] = await db
    .select({ addresses: buwuhConfig.addresses })
    .from(buwuhConfig)
    .where(eq(buwuhConfig.id, 1));
  return row?.addresses ?? [];
}

export async function saveBuwuhAddresses(db: Db, items: string[]): Promise<string[]> {
  const now = new Date();
  // Baris belum ada: daftar barang diisi bawaan supaya tidak hilang.
  await db
    .insert(buwuhConfig)
    .values({ id: 1, catalog: [...DEFAULT_BUWUH_CATALOG], addresses: items, updatedAt: now })
    .onConflictDoUpdate({ target: buwuhConfig.id, set: { addresses: items, updatedAt: now } });
  return items;
}

export async function saveBuwuhCatalog(
  db: Db,
  items: BuwuhCatalogItem[],
): Promise<BuwuhCatalogItem[]> {
  const now = new Date();
  await db
    .insert(buwuhConfig)
    .values({ id: 1, catalog: items, updatedAt: now })
    .onConflictDoUpdate({ target: buwuhConfig.id, set: { catalog: items, updatedAt: now } });
  return items;
}

// --- HP meja -------------------------------------------------------------------------------------

/**
 * Menerima catatan dari HP meja. Setiap catatan disimpan bila belum ada, atau menimpa bila versinya
 * lebih baru, dan hanya bila catatan itu milik HP ini serta belum diubah admin. Selain itu kiriman
 * tetap "diterima" (HP berhenti mengirim ulang) tanpa mengubah apa pun.
 */
export async function pushBuwuh(
  db: Db,
  device: DeviceRow,
  req: { entries: DeviceEntry[]; pending: number; appVersion?: string | undefined },
) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const ids = req.entries.map((entry) => entry.id);
    const existing = new Map(
      (ids.length
        ? await tx.select().from(buwuhEntries).where(inArray(buwuhEntries.id, ids)).for("update")
        : []
      ).map((row) => [row.id, row]),
    );

    const accepted: { id: string; version: number }[] = [];
    for (const entry of req.entries) {
      accepted.push({ id: entry.id, version: entry.version });
      const current = existing.get(entry.id);
      const content = entry.deleted
        ? null
        : {
            name: entry.name,
            address: entry.address,
            amount: entry.amount,
            items: entry.items,
          };

      if (!current) {
        // Hapus sebelum sempat terkirim: simpan sebagai baris terhapus agar kiriman isi versi lama
        // yang datang belakangan tidak memunculkannya.
        await tx
          .insert(buwuhEntries)
          .values({
            id: entry.id,
            name: content?.name ?? "",
            address: content?.address ?? null,
            amount: content?.amount ?? 0,
            items: content?.items ?? [],
            deviceId: device.id,
            version: entry.version,
            recordedAt: new Date(entry.recordedAt),
            deletedAt: entry.deleted ? now : null,
          })
          // Kiriman ulang yang sama bisa tiba bersamaan (HP mengulang sebelum jawaban pertama sampai):
          // yang kalah tidak boleh gagal 500; versi lebih baru akan masuk lewat kiriman berikutnya.
          .onConflictDoNothing({ target: buwuhEntries.id });
        existing.set(entry.id, {
          id: entry.id,
          version: entry.version,
          deviceId: device.id,
          editedAt: null,
        } as EntryRow);
        continue;
      }
      const ownedByDevice = current.deviceId === device.id;
      if (!ownedByDevice || current.editedAt || entry.version <= current.version) continue;
      await tx
        .update(buwuhEntries)
        .set({
          ...(content ?? {}),
          version: entry.version,
          deletedAt: entry.deleted ? now : null,
          updatedAt: now,
        })
        .where(eq(buwuhEntries.id, entry.id));
      current.version = entry.version;
    }

    await tx
      .update(devices)
      .set({
        lastSeenAt: now,
        lastSyncAt: now,
        pendingOutbox: Math.max(0, req.pending - req.entries.length),
        ...(req.appVersion ? { appVersion: req.appVersion } : {}),
      })
      .where(eq(devices.id, device.id));

    return { accepted };
  });
}

/** Pengaturan untuk HP meja (barang dan alamat pilihan); sekaligus menandai perangkat masih hidup. */
export async function getBuwuhDeviceConfig(db: Db, device: DeviceRow) {
  await touchDevice(db, device.id);
  return { catalog: await getBuwuhCatalog(db), addresses: await getBuwuhAddresses(db) };
}

// --- Admin ---------------------------------------------------------------------------------------

async function activeEntries(db: Db): Promise<BuwuhEntry[]> {
  const rows = await db
    .select({ entry: buwuhEntries, deviceName: devices.name })
    .from(buwuhEntries)
    .leftJoin(devices, eq(devices.id, buwuhEntries.deviceId))
    .where(isNull(buwuhEntries.deletedAt))
    .orderBy(desc(buwuhEntries.recordedAt), desc(buwuhEntries.id));
  return rows.map(({ entry, deviceName }) => toEntry(entry, deviceName));
}

/**
 * Rekap: total uang dan total per barang. Nama dan satuan disamakan tanpa beda huruf besar/kecil;
 * ejaan yang ditampilkan diambil dari catatan paling awal.
 */
export function summarize(entries: BuwuhEntry[]): BuwuhSummary {
  const goods = new Map<string, { name: string; unit: string; quantity: number; givers: number }>();
  let amountTotal = 0;
  for (const entry of [...entries].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))) {
    amountTotal += entry.amount;
    const seen = new Set<string>();
    for (const item of entry.items) {
      const key = `${item.name.trim().toLowerCase()}|${item.unit.trim().toLowerCase()}`;
      const total = goods.get(key) ?? { name: item.name, unit: item.unit, quantity: 0, givers: 0 };
      total.quantity = Math.round((total.quantity + item.quantity) * 100) / 100;
      if (!seen.has(key)) total.givers += 1;
      seen.add(key);
      goods.set(key, total);
    }
  }
  return {
    count: entries.length,
    amountTotal,
    goods: [...goods.values()].sort(
      (a, b) => b.givers - a.givers || a.name.localeCompare(b.name, "id"),
    ),
  };
}

export async function listBuwuh(db: Db) {
  const items = await activeEntries(db);
  return { items, summary: summarize(items) };
}

async function getEntry(db: Db, id: string): Promise<BuwuhEntry> {
  const [row] = await db
    .select({ entry: buwuhEntries, deviceName: devices.name })
    .from(buwuhEntries)
    .leftJoin(devices, eq(devices.id, buwuhEntries.deviceId))
    .where(and(eq(buwuhEntries.id, id), isNull(buwuhEntries.deletedAt)));
  if (!row) throw notFound();
  return toEntry(row.entry, row.deviceName);
}

/** Catatan yang ditulis admin (mis. dari buku tulis); tidak terkait HP meja. */
export async function createBuwuh(db: Db, adminId: string, input: BuwuhData) {
  const id = randomUUID();
  const now = new Date();
  await db.insert(buwuhEntries).values({
    id,
    ...pick(input),
    adminId,
    recordedAt: now,
    editedAt: now,
  });
  return getEntry(db, id);
}

export async function updateBuwuh(db: Db, adminId: string, id: string, input: BuwuhData) {
  const now = new Date();
  const [row] = await db
    .update(buwuhEntries)
    .set({ ...pick(input), adminId, editedAt: now, updatedAt: now })
    .where(and(eq(buwuhEntries.id, id), isNull(buwuhEntries.deletedAt)))
    .returning({ id: buwuhEntries.id });
  if (!row) throw notFound();
  return getEntry(db, id);
}

export async function deleteBuwuh(db: Db, adminId: string, id: string) {
  const now = new Date();
  const [row] = await db
    .update(buwuhEntries)
    .set({ adminId, deletedAt: now, editedAt: now, updatedAt: now })
    .where(and(eq(buwuhEntries.id, id), isNull(buwuhEntries.deletedAt)))
    .returning({ id: buwuhEntries.id });
  if (!row) throw notFound();
}

const pick = (input: BuwuhData) => ({
  name: input.name,
  address: input.address,
  amount: input.amount,
  items: input.items satisfies BuwuhItem[],
  note: input.note,
});

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
/** "2027-05-21 10:15" dalam WIB. */
const wibTime = (iso: string) =>
  new Date(new Date(iso).getTime() + WIB_OFFSET_MS).toISOString().slice(0, 16).replace("T", " ");

/** Excel dua lembar: Buwuh (satu baris per pemberi) dan Rekap barang. */
export async function exportBuwuhXlsx(db: Db): Promise<Uint8Array> {
  const items = await activeEntries(db);
  const { goods, amountTotal } = summarize(items);
  return buildXlsx([
    {
      name: "Buwuh",
      columns: [
        { header: "waktu", width: 17 },
        { header: "nama", width: 28 },
        { header: "alamat", width: 32 },
        { header: "uang", width: 14, type: "number" },
        { header: "barang", width: 40 },
        { header: "catatan", width: 28 },
        { header: "meja", width: 16 },
      ],
      rows: [...items]
        .reverse()
        .map((entry) => [
          wibTime(entry.recordedAt),
          safeCell(entry.name),
          safeCell(entry.address ?? ""),
          entry.amount || null,
          safeCell(formatBuwuhItems(entry.items)),
          safeCell(entry.note ?? ""),
          safeCell(entry.deviceName ?? (entry.editedAt ? "admin" : "")),
        ]),
    },
    {
      name: "Rekap",
      columns: [
        { header: "barang", width: 24 },
        { header: "jumlah", width: 12, type: "number" },
        { header: "satuan", width: 12 },
        { header: "pemberi", width: 10, type: "number" },
      ],
      rows: [
        ["Uang (Rp)", amountTotal, "", items.filter((entry) => entry.amount > 0).length],
        ...goods.map((g) => [safeCell(g.name), g.quantity, safeCell(g.unit), g.givers]),
      ],
    },
  ]);
}
