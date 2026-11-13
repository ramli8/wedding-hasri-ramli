import { randomUUID } from "node:crypto";
import {
  type BuwuhDeviceEntry,
  type BuwuhListResponse,
  DEFAULT_BUWUH_CATALOG,
  type Device,
  SYNC_PROTOCOL_VERSION,
  SYNC_VERSION_HEADER,
} from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { type adminClient, createTestContext, loggedInClient } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());

type App = ReturnType<typeof ctx.makeApp>;
let app: App;
let api: ReturnType<typeof adminClient>;

const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
  app = ctx.makeApp();
});

async function pair(name = "HP Meja Buwuh", kind: "buwuh" | "scanner" | "booth" = "buwuh") {
  const created = await read<{ pairingCode: string; device: Device }>(
    await api.post("/devices", { name, kind }),
  );
  const paired = await app.request("/api/v1/device/pair", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [SYNC_VERSION_HEADER]: String(SYNC_PROTOCOL_VERSION),
    },
    body: JSON.stringify({ code: created.pairingCode, kind }),
  });
  expect(paired.status).toBe(200);
  const { token } = await read<{ token: string }>(paired);
  return { id: created.device.id, token };
}

const push = (token: string, entries: BuwuhDeviceEntry[], pending = entries.length) =>
  app.request("/api/v1/buwuh/push", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ entries, pending }),
  });

const entry = (overrides: Partial<Extract<BuwuhDeviceEntry, { deleted: false }>> = {}) =>
  ({
    id: randomUUID(),
    version: 1,
    recordedAt: new Date().toISOString(),
    deleted: false,
    name: "Mbah Sarmi",
    address: "RT 02 Dusun Krajan",
    amount: 50_000,
    items: [],
    ...overrides,
  }) satisfies BuwuhDeviceEntry;

const list = async () => read<BuwuhListResponse>(await api.get("/buwuh"));

describe("HP meja buwuh", () => {
  it("menolak token scanner dan booth, dan token buwuh di /sync", async () => {
    const scanner = await pair("HP Pintu", "scanner");
    expect((await push(scanner.token, [entry()])).status).toBe(403);
    const booth = await pair("Laptop", "booth");
    expect((await push(booth.token, [entry()])).status).toBe(403);

    const meja = await pair();
    const snapshot = await app.request("/api/v1/sync/snapshot", {
      headers: {
        authorization: `Bearer ${meja.token}`,
        [SYNC_VERSION_HEADER]: String(SYNC_PROTOCOL_VERSION),
      },
    });
    expect(snapshot.status).toBe(403);
  });

  it("mengirim daftar barang bawaan sampai admin mengaturnya", async () => {
    const meja = await pair();
    const config = async () =>
      read<{ catalog: unknown[] }>(
        await app.request("/api/v1/buwuh/config", {
          headers: { authorization: `Bearer ${meja.token}` },
        }),
      );
    expect((await config()).catalog).toEqual(DEFAULT_BUWUH_CATALOG);

    const saved = await api.put("/buwuh/catalog", {
      items: [
        { name: "Beras", unit: "kg" },
        { name: "Gula", unit: "kg" },
      ],
    });
    expect(saved.status).toBe(200);
    expect((await config()).catalog).toEqual([
      { name: "Beras", unit: "kg" },
      { name: "Gula", unit: "kg" },
    ]);

    // Alamat pilihan: kosong sampai admin mengisinya, ikut terkirim ke HP meja.
    const config2 = async () =>
      read<{ addresses: string[] }>(
        await app.request("/api/v1/buwuh/config", {
          headers: { authorization: `Bearer ${meja.token}` },
        }),
      );
    expect((await config2()).addresses).toEqual([]);
    expect(
      (await api.put("/buwuh/addresses", { items: ["Dsn Krajan", " Dsn Wetan "] })).status,
    ).toBe(200);
    expect((await config2()).addresses).toEqual(["Dsn Krajan", "Dsn Wetan"]);
    expect((await read<{ items: string[] }>(await api.get("/buwuh/addresses"))).items).toEqual([
      "Dsn Krajan",
      "Dsn Wetan",
    ]);
    // Daftar barang tidak terhapus oleh simpan alamat.
    expect((await config()).catalog).toHaveLength(2);
    expect((await api.put("/buwuh/addresses", { items: ["A", "a"] })).status).toBe(400);

    const dup = await api.put("/buwuh/catalog", {
      items: [
        { name: "Beras", unit: "kg" },
        { name: "beras", unit: "karung" },
      ],
    });
    expect(dup.status).toBe(400);
  });

  it("menyimpan catatan, kirim ulang tidak menggandakan, dan mencatat status perangkat", async () => {
    const meja = await pair();
    const a = entry();
    const b = entry({
      name: "Pak Darto",
      amount: 0,
      items: [{ name: "Gula", quantity: 2, unit: "kg" }],
    });

    const res = await push(meja.token, [a, b], 3);
    expect(res.status).toBe(200);
    expect((await read<{ accepted: unknown[] }>(res)).accepted).toEqual([
      { id: a.id, version: 1 },
      { id: b.id, version: 1 },
    ]);
    expect((await push(meja.token, [a])).status).toBe(200);

    const { items, summary } = await list();
    expect(items).toHaveLength(2);
    expect(items.find((item) => item.id === a.id)?.deviceName).toBe("HP Meja Buwuh");
    expect(summary.amountTotal).toBe(50_000);
    expect(summary.goods).toEqual([{ name: "Gula", unit: "kg", quantity: 2, givers: 1 }]);

    const devices = await read<{ items: Device[] }>(await api.get("/devices"));
    const device = devices.items.find((d) => d.id === meja.id);
    expect(device?.lastSyncAt).not.toBeNull();
  });

  it("menolak catatan tanpa uang dan tanpa barang, juga uang sekaligus barang", async () => {
    const meja = await pair();
    expect((await push(meja.token, [entry({ amount: 0, items: [] })])).status).toBe(400);
    const both = entry({ items: [{ name: "Beras", quantity: 5, unit: "kg" }] });
    expect((await push(meja.token, [both])).status).toBe(400);
  });

  it("menerima ubahan versi lebih baru saja, dan hapus dari HP", async () => {
    const meja = await pair();
    const a = entry();
    await push(meja.token, [a]);
    await push(meja.token, [{ ...a, version: 3, amount: 100_000 }]);
    // Versi lama yang datang terlambat tidak menimpa.
    await push(meja.token, [{ ...a, version: 2, amount: 20_000 }]);
    expect((await list()).items[0]?.amount).toBe(100_000);

    await push(meja.token, [{ id: a.id, version: 4, recordedAt: a.recordedAt, deleted: true }]);
    expect((await list()).items).toHaveLength(0);
    // Isi versi lama setelah dihapus tidak memunculkannya kembali.
    await push(meja.token, [{ ...a, version: 3 }]);
    expect((await list()).items).toHaveLength(0);
  });

  it("hapus yang tiba sebelum isinya tetap terhapus", async () => {
    const meja = await pair();
    const a = entry();
    await push(meja.token, [{ id: a.id, version: 2, recordedAt: a.recordedAt, deleted: true }]);
    await push(meja.token, [a]);
    expect((await list()).items).toHaveLength(0);
  });

  it("ubahan admin mengunci catatan dari HP", async () => {
    const meja = await pair();
    const a = entry();
    await push(meja.token, [a]);
    const edited = await api.put(`/buwuh/${a.id}`, {
      name: "Mbah Sarmini",
      address: "RT 02 Dusun Krajan",
      amount: 50_000,
      items: [],
      note: "nama dibetulkan",
    });
    expect(edited.status).toBe(200);

    const res = await push(meja.token, [{ ...a, version: 2, name: "Salah" }]);
    expect((await read<{ accepted: unknown[] }>(res)).accepted).toEqual([{ id: a.id, version: 2 }]);
    const [item] = (await list()).items;
    expect(item?.name).toBe("Mbah Sarmini");
    expect(item?.editedAt).not.toBeNull();
  });

  it("HP lain tidak bisa menimpa catatan HP pertama", async () => {
    const satu = await pair("Meja 1");
    const dua = await pair("Meja 2");
    const a = entry();
    await push(satu.token, [a]);
    await push(dua.token, [{ ...a, version: 5, name: "Penyusup" }]);
    expect((await list()).items[0]?.name).toBe("Mbah Sarmi");
  });
});

describe("admin buwuh", () => {
  it("tambah, ubah, hapus, rekap, dan ekspor Excel", async () => {
    const created = await api.post("/buwuh", {
      name: "Bu Lastri",
      address: "Dusun Wetan",
      amount: 0,
      items: [
        { name: "Beras", quantity: 2.5, unit: "kg" },
        { name: "Mie kuning", quantity: 3, unit: "bungkus" },
      ],
    });
    expect(created.status).toBe(201);
    const { entry: saved } = await read<{ entry: { id: string } }>(created);
    await api.post("/buwuh", {
      name: "Pak Kasno",
      items: [{ name: "beras", quantity: 5, unit: "KG" }],
    });
    await api.post("/buwuh", { name: "Pak Darmo", amount: 30_000 });

    const { summary } = await list();
    expect(summary.count).toBe(3);
    expect(summary.amountTotal).toBe(30_000);
    expect(summary.goods[0]).toEqual({ name: "Beras", unit: "kg", quantity: 7.5, givers: 2 });

    expect((await api.post("/buwuh", { name: "Kosong", amount: 0, items: [] })).status).toBe(400);
    const both = {
      name: "Dua",
      amount: 10_000,
      items: [{ name: "Gula", quantity: 1, unit: "kg" }],
    };
    expect((await api.post("/buwuh", both)).status).toBe(400);

    const xlsx = await api.get("/buwuh/export.xlsx");
    expect(xlsx.status).toBe(200);
    expect(xlsx.headers.get("content-type")).toContain("spreadsheetml");

    expect((await api.delete(`/buwuh/${saved.id}`)).status).toBe(200);
    expect((await list()).summary.count).toBe(2);
    expect((await api.delete(`/buwuh/${saved.id}`)).status).toBe(404);
  });

  it("perlu login admin", async () => {
    const res = await ctx.makeApp().request("/api/v1/admin/buwuh");
    expect(res.status).toBe(401);
  });
});
