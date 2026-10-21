import { dueState, type Vendor, type VendorCategory, type VendorOverview } from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adminClient, createTestContext, loggedInClient } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());

type Api = ReturnType<typeof adminClient>;
let api: Api;

const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
});

const overview = async () => read<VendorOverview>(await api.get("/vendors"));
async function category(name: string) {
  const res = await api.post("/vendors/categories", { name });
  expect(res.status).toBe(201);
  return (await read<{ category: VendorCategory }>(res)).category;
}
async function vendor(categoryId: string, extra: Record<string, unknown> = {}) {
  const res = await api.post("/vendors", { categoryId, name: "Vendor", ...extra });
  expect(res.status).toBe(201);
  return (await read<{ vendor: Vendor }>(res)).vendor;
}
const select = async (id: string, selected = true) =>
  read<{ vendor: Vendor }>(await api.post(`/vendors/${id}/select`, { selected }));

describe("kategori vendor", () => {
  it("menambah, mengganti nama, menolak nama kembar, dan menambah kategori umum sekali saja", async () => {
    const katering = await category("Katering");
    expect((await api.post("/vendors/categories", { name: "Katering" })).status).toBe(409);
    expect((await api.post("/vendors/categories", { name: "  " })).status).toBe(400);

    const renamed = await api.put(`/vendors/categories/${katering.id}`, { name: "Katering & Kue" });
    expect((await read<{ category: VendorCategory }>(renamed)).category.name).toBe(
      "Katering & Kue",
    );
    await category("Dekorasi");
    expect((await api.put(`/vendors/categories/${katering.id}`, { name: "Dekorasi" })).status).toBe(
      409,
    );

    const first = await read<{ added: number }>(await api.post("/vendors/categories/common"));
    expect(first.added).toBeGreaterThan(5);
    const again = await read<{ added: number }>(await api.post("/vendors/categories/common"));
    expect(again.added).toBe(0);
    // "Dekorasi" yang sudah dibuat sendiri tidak digandakan.
    const names = (await overview()).categories.map((c) => c.name);
    expect(names.filter((n) => n === "Dekorasi")).toHaveLength(1);
  });

  it("hanya bisa dihapus bila tidak ada vendor aktif; vendor terhapus ikut dibersihkan", async () => {
    const cat = await category("Fotografi");
    const v = await vendor(cat.id);
    expect((await api.delete(`/vendors/categories/${cat.id}`)).status).toBe(409);
    expect((await api.delete(`/vendors/${v.id}`)).status).toBe(200);
    expect((await api.delete(`/vendors/categories/${cat.id}`)).status).toBe(200);
    expect((await api.delete(`/vendors/categories/${cat.id}`)).status).toBe(404);
    expect((await overview()).categories).toEqual([]);
  });
});

describe("vendor", () => {
  it("menyimpan vendor dengan kontak dinormalkan dan menolak isian tidak wajar", async () => {
    const cat = await category("Dekorasi");
    const v = await vendor(cat.id, {
      name: "  Bunga Indah ",
      phone: "0812-3456-7890",
      instagram: "@Bunga.Indah",
      referencePrice: 15_000_000,
    });
    expect(v).toMatchObject({
      name: "Bunga Indah",
      instagram: "bunga.indah",
      referencePrice: 15_000_000,
      contractAmount: null,
      isSelected: false,
      paymentStatus: null,
      paidTotal: 0,
    });
    expect(v.phone).toMatch(/^\+?62812/);

    const bad = async (extra: Record<string, unknown>) =>
      (await api.post("/vendors", { categoryId: cat.id, name: "X", ...extra })).status;
    expect(await bad({ name: " " })).toBe(400);
    expect(await bad({ phone: "abc" })).toBe(400);
    expect(await bad({ referencePrice: 0 })).toBe(400);
    expect(await bad({ contractAmount: 1.5 })).toBe(400);
    expect(await bad({ categoryId: "00000000-0000-4000-8000-000000000000" })).toBe(400);
    expect((await adminClient(ctx.makeApp(), "").get("/vendors")).status).toBe(401);
  });

  it("satu terpilih per kategori: memilih kandidat baru melepas yang lama", async () => {
    const cat = await category("Katering");
    const other = await category("Dekorasi");
    const a = await vendor(cat.id, { name: "A" });
    const b = await vendor(cat.id, { name: "B" });
    const x = await vendor(other.id, { name: "X" });

    expect((await select(a.id)).vendor.isSelected).toBe(true);
    await select(x.id);
    expect((await select(b.id)).vendor.isSelected).toBe(true);

    const { vendors } = await overview();
    const flags = Object.fromEntries(vendors.map((v) => [v.name, v.isSelected]));
    expect(flags).toEqual({ A: false, B: true, X: true });

    expect((await select(b.id, false)).vendor.isSelected).toBe(false);
    expect((await overview()).vendors.filter((v) => v.isSelected)).toHaveLength(1);
  });

  it("pindah kategori melepas status terpilih; hapus melepasnya dan menyembunyikan vendor", async () => {
    const cat = await category("Katering");
    const other = await category("Dekorasi");
    const a = await vendor(cat.id, { name: "A" });
    const x = await vendor(other.id, { name: "X" });
    await select(a.id);
    await select(x.id);

    const moved = await api.put(`/vendors/${a.id}`, { categoryId: other.id, name: "A" });
    expect((await read<{ vendor: Vendor }>(moved)).vendor).toMatchObject({
      categoryId: other.id,
      isSelected: false,
    });
    // X tetap satu-satunya yang terpilih di kategorinya.
    expect((await overview()).vendors.find((v) => v.name === "X")?.isSelected).toBe(true);

    await api.delete(`/vendors/${x.id}`);
    const { vendors } = await overview();
    expect(vendors.map((v) => v.name)).toEqual(["A"]);
    expect((await api.delete(`/vendors/${x.id}`)).status).toBe(404);
    expect((await api.put(`/vendors/${x.id}`, { categoryId: other.id, name: "X" })).status).toBe(
      404,
    );
    // Setelah X terhapus, kandidat lain bisa dipilih tanpa bentrok indeks.
    expect((await select(a.id)).vendor.isSelected).toBe(true);
  });

  it("dua permintaan memilih bersamaan tidak pernah menghasilkan dua terpilih", async () => {
    const cat = await category("Katering");
    const a = await vendor(cat.id, { name: "A" });
    const b = await vendor(cat.id, { name: "B" });
    const results = await Promise.all([
      api.post(`/vendors/${a.id}/select`, { selected: true }),
      api.post(`/vendors/${b.id}/select`, { selected: true }),
    ]);
    expect(results.every((r) => r.status === 200 || r.status === 409)).toBe(true);
    expect((await overview()).vendors.filter((v) => v.isSelected)).toHaveLength(1);
  });
});

describe("pembayaran vendor", () => {
  const pay = (id: string, body: Record<string, unknown>) =>
    api.post(`/vendors/${id}/payments`, body);

  it("menghitung status belum, sebagian, lunas dari total pembayaran terhadap kontrak", async () => {
    const cat = await category("Katering");
    const v = await vendor(cat.id, { contractAmount: 10_000_000 });
    expect(v.paymentStatus).toBe("belum");

    const dp = await pay(v.id, { amount: 3_000_000, paidOn: "2027-01-10", note: "DP" });
    expect(dp.status).toBe(201);
    const afterDp = (await read<{ vendor: Vendor }>(dp)).vendor;
    expect(afterDp).toMatchObject({ paidTotal: 3_000_000, paymentStatus: "sebagian" });
    expect(afterDp.payments[0]).toMatchObject({ paidOn: "2027-01-10", note: "DP" });

    const rest = (await read<{ vendor: Vendor }>(await pay(v.id, { amount: 7_000_000 }))).vendor;
    expect(rest).toMatchObject({ paidTotal: 10_000_000, paymentStatus: "lunas" });
    expect(rest.payments[1]?.paidOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("mengubah dan menghapus pembayaran, dan menolak nominal tidak wajar atau vendor lain", async () => {
    const cat = await category("Katering");
    const v = await vendor(cat.id, { contractAmount: 5_000_000 });
    const other = await vendor(cat.id, { name: "Lain" });
    const created = (await read<{ vendor: Vendor }>(await pay(v.id, { amount: 1_000_000 }))).vendor;
    const paymentId = created.payments[0]?.id ?? "";

    expect((await pay(v.id, { amount: 0 })).status).toBe(400);
    expect((await pay(v.id, { amount: 1.5 })).status).toBe(400);
    expect((await pay(v.id, { amount: 100, paidOn: "kemarin" })).status).toBe(400);
    expect((await pay("00000000-0000-4000-8000-000000000000", { amount: 100 })).status).toBe(404);

    const edited = await api.put(`/vendors/${v.id}/payments/${paymentId}`, { amount: 5_000_000 });
    expect((await read<{ vendor: Vendor }>(edited)).vendor.paymentStatus).toBe("lunas");
    // Pembayaran milik vendor lain tidak bisa disentuh lewat vendor ini.
    expect((await api.delete(`/vendors/${other.id}/payments/${paymentId}`)).status).toBe(404);

    const removed = await api.delete(`/vendors/${v.id}/payments/${paymentId}`);
    expect((await read<{ vendor: Vendor }>(removed)).vendor).toMatchObject({
      paidTotal: 0,
      paymentStatus: "belum",
    });
    expect((await api.delete(`/vendors/${v.id}/payments/${paymentId}`)).status).toBe(404);
  });

  it("ringkasan hanya menghitung vendor terpilih; sisa tidak pernah negatif", async () => {
    const cat = await category("Katering");
    const other = await category("Dekorasi");
    const a = await vendor(cat.id, { name: "A", contractAmount: 10_000_000 });
    const b = await vendor(cat.id, { name: "B", contractAmount: 8_000_000 });
    const x = await vendor(other.id, { name: "X", contractAmount: 4_000_000 });
    await pay(a.id, { amount: 2_000_000 });
    await pay(b.id, { amount: 500_000 });
    await pay(x.id, { amount: 5_000_000 }); // dibayar melebihi kontrak
    await select(a.id);
    await select(x.id);

    expect((await overview()).summary).toMatchObject({
      selectedCount: 2,
      categoryCount: 2,
      contractTotal: 14_000_000,
      paidTotal: 7_000_000,
      remaining: 7_000_000,
    });

    await pay(a.id, { amount: 9_000_000 });
    expect((await overview()).summary.remaining).toBe(0);
  });

  it("pembayaran vendor yang dihapus tidak ikut tampil dan vendor tidak bisa dibayar lagi", async () => {
    const cat = await category("Katering");
    const v = await vendor(cat.id, { contractAmount: 1_000_000 });
    await pay(v.id, { amount: 100_000 });
    await api.delete(`/vendors/${v.id}`);
    expect((await overview()).vendors).toEqual([]);
    expect((await pay(v.id, { amount: 100_000 })).status).toBe(404);
  });
});

describe("jatuh tempo pembayaran", () => {
  const day = (offset: number) =>
    new Date(Date.now() + 7 * 3600_000 + offset * 86_400_000).toISOString().slice(0, 10);

  it("dueState: hanya vendor terpilih yang belum lunas; terlambat, segera (14 hari), atau kosong", () => {
    const today = "2027-03-10";
    const base = { isSelected: true, status: "sebagian" as const };
    expect(dueState({ ...base, dueOn: "2027-03-09" }, today)).toBe("terlambat");
    expect(dueState({ ...base, dueOn: "2027-03-10" }, today)).toBe("segera");
    expect(dueState({ ...base, dueOn: "2027-03-24" }, today)).toBe("segera");
    expect(dueState({ ...base, dueOn: "2027-03-25" }, today)).toBeNull();
    expect(dueState({ ...base, dueOn: null }, today)).toBeNull();
    expect(dueState({ ...base, status: "lunas", dueOn: "2027-03-01" }, today)).toBeNull();
    expect(dueState({ ...base, isSelected: false, dueOn: "2027-03-01" }, today)).toBeNull();
    expect(dueState({ ...base, status: null, dueOn: "2027-03-01" }, today)).toBe("terlambat");
  });

  it("menyimpan jatuh tempo, menghitung keadaannya, dan memasukkannya ke ringkasan", async () => {
    const cat = await category("Katering");
    const dekor = await category("Dekorasi");
    const foto = await category("Fotografi");
    const late = await vendor(cat.id, {
      name: "Telat",
      contractAmount: 5_000_000,
      dueOn: day(-3),
      dueAmount: 2_000_000,
    });
    const soon = await vendor(dekor.id, {
      name: "Segera",
      contractAmount: 5_000_000,
      dueOn: day(7),
    });
    const far = await vendor(foto.id, { name: "Jauh", contractAmount: 5_000_000, dueOn: day(60) });
    const candidate = await vendor(cat.id, {
      name: "Kandidat",
      contractAmount: 1_000_000,
      dueOn: day(-10),
    });
    expect(late).toMatchObject({ dueOn: day(-3), dueAmount: 2_000_000, dueState: null });

    for (const v of [late, soon, far]) await select(v.id);
    const { vendors, summary } = await overview();
    const state = Object.fromEntries(vendors.map((v) => [v.name, v.dueState]));
    expect(state).toEqual({ Telat: "terlambat", Segera: "segera", Jauh: null, Kandidat: null });
    expect(summary).toMatchObject({ overdueCount: 1, dueSoonCount: 1 });
    expect(candidate.isSelected).toBe(false);

    // Setelah lunas, tidak lagi dianggap terlambat.
    await api.post(`/vendors/${late.id}/payments`, { amount: 5_000_000 });
    const after = await overview();
    expect(after.vendors.find((v) => v.name === "Telat")?.dueState).toBeNull();
    expect(after.summary.overdueCount).toBe(0);
  });

  it("memperbarui tanggal lewat ubah vendor, dan menolak tanggal atau nominal tidak wajar", async () => {
    const cat = await category("Katering");
    const v = await vendor(cat.id, { contractAmount: 1_000_000 });
    const put = (extra: Record<string, unknown>) =>
      api.put(`/vendors/${v.id}`, { categoryId: cat.id, name: "Vendor", ...extra });
    const ok = await put({ dueOn: "2027-06-01", dueAmount: 500_000 });
    expect((await read<{ vendor: Vendor }>(ok)).vendor).toMatchObject({
      dueOn: "2027-06-01",
      dueAmount: 500_000,
    });
    expect((await put({ dueOn: "besok" })).status).toBe(400);
    expect((await put({ dueOn: "2027-06-01", dueAmount: 0 })).status).toBe(400);
    const cleared = await put({});
    expect((await read<{ vendor: Vendor }>(cleared)).vendor).toMatchObject({
      dueOn: null,
      dueAmount: null,
    });
  });
});
