import { DEFAULT_BUWUH_CATALOG } from "@wedding/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addEntry,
  BUWUH_EDIT_WINDOW_MS,
  buwuhDb,
  canEdit,
  countPending,
  deleteEntry,
  frequentAddresses,
  getBuwuhMeta,
  getCatalog,
  PendingEntriesError,
  pairBuwuh,
  pendingEntries,
  releaseBuwuh,
  setBuwuhMeta,
  updateEntry,
  visibleEntries,
} from "./db.js";
import { syncBuwuh } from "./sync.js";

const draft = (name = "Mbah Sarmi", address: string | null = "Dusun Krajan") => ({
  name,
  address,
  amount: 50_000,
  items: [],
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(async () => {
  await buwuhDb.entries.clear();
  await buwuhDb.meta.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("penyimpanan meja buwuh", () => {
  it("catatan baru antre, ubahan menaikkan versi, hapus catatan belum terkirim langsung hilang", async () => {
    const id = await addEntry(draft());
    expect(await countPending()).toBe(1);
    await updateEntry(id, { ...draft(), amount: 100_000 });
    const [row] = await pendingEntries();
    expect(row?.version).toBe(2);
    expect(row?.amount).toBe(100_000);

    await deleteEntry(id);
    expect(await buwuhDb.entries.count()).toBe(0);
  });

  it("hapus catatan yang sudah terkirim tetap antre sebagai hapus", async () => {
    const id = await addEntry(draft());
    await buwuhDb.entries.update(id, { syncedVersion: 1 });
    await deleteEntry(id);
    expect(await visibleEntries()).toHaveLength(0);
    const [row] = await pendingEntries();
    expect(row).toMatchObject({ id, deleted: true, version: 2 });
  });

  it("catatan hanya bisa diubah di HP selama 10 menit, kecuali ditolak server", () => {
    const recordedAt = new Date(1_000_000).toISOString();
    expect(canEdit({ recordedAt }, 1_000_000 + BUWUH_EDIT_WINDOW_MS - 1)).toBe(true);
    expect(canEdit({ recordedAt }, 1_000_000 + BUWUH_EDIT_WINDOW_MS)).toBe(false);
    expect(canEdit({ recordedAt, syncError: "Nama wajib diisi" }, 9e12)).toBe(true);
  });

  it("alamat tersering lebih dulu", async () => {
    await addEntry(draft("A", "Dusun Wetan"), 1);
    await addEntry(draft("B", "Dusun Krajan"), 2);
    await addEntry(draft("C", "dusun krajan"), 3);
    await addEntry(draft("D", null), 4);
    expect(frequentAddresses(await visibleEntries())).toEqual(["dusun krajan", "Dusun Wetan"]);
  });

  it("menolak lepas HP selama ada catatan belum terkirim", async () => {
    await pairBuwuh({ token: "t", deviceId: "d", deviceName: "Meja" });
    await addEntry(draft());
    await expect(releaseBuwuh()).rejects.toBeInstanceOf(PendingEntriesError);
    expect(await buwuhDb.entries.count()).toBe(1);
    expect(await getBuwuhMeta("auth")).toBeDefined();
  });

  it("memakai daftar barang bawaan sebelum pernah sinkron", async () => {
    expect(await getCatalog()).toEqual(DEFAULT_BUWUH_CATALOG);
    expect((await getCatalog()).map((item) => item.name)).toEqual([
      "Gula",
      "Beras",
      "Mi kuning kecil",
      "Mi kuning besar",
      "Bihun",
    ]);
  });
});

describe("sinkron meja buwuh", () => {
  beforeEach(() => pairBuwuh({ token: "tok", deviceId: "d", deviceName: "Meja" }));

  it("mengirim antrean dan menandai versi yang diterima", async () => {
    const id = await addEntry(draft());
    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/config")) return json({ catalog: [{ name: "Gula", unit: "kg" }] });
      const body = JSON.parse(String(init?.body)) as { entries: { id: string; version: number }[] };
      return json({ accepted: body.entries.map((e) => ({ id: e.id, version: e.version })) });
    });
    await syncBuwuh();
    expect(await countPending()).toBe(0);
    expect(await getCatalog()).toEqual([{ name: "Gula", unit: "kg" }]);
    expect((await buwuhDb.entries.get(id))?.syncedVersion).toBe(1);
  });

  it("tanpa internet catatan tetap antre", async () => {
    await addEntry(draft());
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await syncBuwuh();
    expect(await countPending()).toBe(1);
  });

  it("token ditolak disimpan sebagai alasan, catatan tetap ada", async () => {
    await addEntry(draft());
    fetchMock.mockResolvedValue(
      json({ error: { code: "DEVICE_REVOKED", message: "Perangkat ini sudah dicabut" } }, 401),
    );
    await syncBuwuh();
    expect(await getBuwuhMeta("authError")).toBe("Perangkat ini sudah dicabut");
    expect(await countPending()).toBe(1);
  });

  it("satu catatan ditolak tidak menahan catatan lain", async () => {
    const bad = await addEntry(draft("Rusak"), 1);
    const good = await addEntry(draft("Baik"), 2);
    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/config")) return json({ catalog: [] });
      const body = JSON.parse(String(init?.body)) as {
        entries: { id: string; version: number; name: string }[];
      };
      if (body.entries.some((e) => e.name === "Rusak")) {
        return json({ error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, 400);
      }
      return json({ accepted: body.entries.map((e) => ({ id: e.id, version: e.version })) });
    });
    await syncBuwuh();
    expect((await buwuhDb.entries.get(good))?.syncedVersion).toBe(1);
    expect((await buwuhDb.entries.get(bad))?.syncError).toBe("Data tidak valid");
    // Putaran berikutnya tidak mengirim ulang yang rusak sebelum diperbaiki.
    fetchMock.mockClear();
    await syncBuwuh();
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/push"))).toHaveLength(0);
  });

  it("isian ditolak server ditandai di catatan", async () => {
    const id = await addEntry(draft());
    await setBuwuhMeta("catalog", []);
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith("/config")
        ? json({ catalog: [] })
        : json({ error: { code: "VALIDATION_ERROR", message: "Nama wajib diisi" } }, 400),
    );
    await syncBuwuh();
    expect((await buwuhDb.entries.get(id))?.syncError).toBe("Nama wajib diisi");
    expect(await countPending()).toBe(1);
  });
});
