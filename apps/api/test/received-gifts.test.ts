import type { ReceivedGift, ReceivedGiftSummary } from "@wedding/shared";
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

async function add(body: Record<string, unknown>) {
  const res = await api.post("/received-gifts", body);
  return { res, gift: res.status === 201 ? (await read<{ gift: ReceivedGift }>(res)).gift : null };
}
const list = async (query = "") =>
  read<{ items: ReceivedGift[]; summary: ReceivedGiftSummary }>(
    await api.get(`/received-gifts${query}`),
  );

describe("hadiah masuk", () => {
  it("mencatat amplop, transfer, dan barang dengan tanggal bawaan hari ini (WIB)", async () => {
    const amplop = await add({ giverName: "  Pak Joko ", kind: "amplop", amount: 500_000 });
    expect(amplop.res.status).toBe(201);
    expect(amplop.gift).toMatchObject({
      giverName: "Pak Joko",
      kind: "amplop",
      amount: 500_000,
      itemDescription: null,
      thankedAt: null,
      recordedBy: "Ramli",
    });
    expect(amplop.gift?.receivedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const transfer = await add({
      giverName: "Sari",
      kind: "transfer",
      amount: 1_000_000,
      receivedOn: "2027-05-20",
      note: "BCA",
    });
    expect(transfer.gift).toMatchObject({ receivedOn: "2027-05-20", note: "BCA" });

    // Barang tidak menyimpan nominal; amplop tidak menyimpan nama barang.
    const barang = await add({
      giverName: "Budi",
      kind: "barang",
      itemDescription: "Rice cooker",
      amount: 999,
    });
    expect(barang.gift).toMatchObject({ amount: null, itemDescription: "Rice cooker" });
    const stray = await add({
      giverName: "X",
      kind: "amplop",
      amount: 10_000,
      itemDescription: "tidak dipakai",
    });
    expect(stray.gift?.itemDescription).toBeNull();

    expect((await list()).summary).toEqual({
      count: 4,
      amplopTotal: 510_000,
      transferTotal: 1_000_000,
      barangCount: 1,
      notThanked: 4,
    });
  });

  it("menolak isian yang tidak lengkap atau tidak masuk akal", async () => {
    const bad = async (body: Record<string, unknown>) => (await add(body)).res.status;
    expect(await bad({ giverName: "A", kind: "amplop" })).toBe(400);
    expect(await bad({ giverName: "A", kind: "transfer", amount: 0 })).toBe(400);
    expect(await bad({ giverName: "A", kind: "amplop", amount: -5 })).toBe(400);
    expect(await bad({ giverName: "A", kind: "amplop", amount: 1.5 })).toBe(400);
    expect(await bad({ giverName: "A", kind: "amplop", amount: 20_000_000_000 })).toBe(400);
    expect(await bad({ giverName: "A", kind: "barang" })).toBe(400);
    expect(await bad({ kind: "amplop", amount: 1000 })).toBe(400);
    expect(await bad({ giverName: "A", kind: "kripto", amount: 1000 })).toBe(400);
    expect(await bad({ giverName: "A", kind: "amplop", amount: 1000, receivedOn: "kemarin" })).toBe(
      400,
    );
    expect((await list()).summary.count).toBe(0);
  });

  it("memilih tamu terdaftar mengisi namanya, dan menolak tamu yang tidak ada", async () => {
    const guest = (
      await read<{ guest: { id: string } }>(
        await api.post("/guests", { displayName: "Bpk. Budi & Keluarga", phone: "0812-3456-7890" }),
      )
    ).guest;
    const linked = await add({ guestId: guest.id, kind: "amplop", amount: 200_000 });
    expect(linked.gift).toMatchObject({ guestId: guest.id, giverName: "Bpk. Budi & Keluarga" });
    // Nomor HP tamu tertaut ikut (untuk ucapan terima kasih); pemberi bebas tidak punya.
    expect(linked.gift?.phone).toMatch(/^\+?62812/);
    const free = await add({ giverName: "Orang Lain", kind: "amplop", amount: 1000 });
    expect(free.gift?.phone).toBeNull();

    const renamed = await add({
      guestId: guest.id,
      giverName: "Keluarga Budi",
      kind: "amplop",
      amount: 1000,
    });
    expect(renamed.gift?.giverName).toBe("Keluarga Budi");

    const ghost = await add({
      guestId: "00000000-0000-4000-8000-000000000000",
      kind: "amplop",
      amount: 1000,
    });
    expect(ghost.res.status).toBe(400);

    // Catatan tetap ada (dengan nama) saat tamunya dihapus; tamu terhapus tidak bisa dipilih lagi.
    await api.delete(`/guests/${guest.id}`);
    expect((await list()).items.find((g) => g.id === linked.gift?.id)?.giverName).toBe(
      "Bpk. Budi & Keluarga",
    );
    const archived = await add({ guestId: guest.id, kind: "amplop", amount: 1000 });
    expect(archived.res.status).toBe(400);
  });

  it("menyaring menurut jenis, status terima kasih, dan pencarian; ringkasan tidak ikut tersaring", async () => {
    const a = (await add({ giverName: "Pak Joko", kind: "amplop", amount: 100_000 })).gift;
    await add({ giverName: "Bu Sari", kind: "transfer", amount: 200_000 });
    await add({ giverName: "Budi", kind: "barang", itemDescription: "Blender" });

    const thanked = await api.post(`/received-gifts/${a?.id}/thanked`, { thanked: true });
    expect((await read<{ gift: ReceivedGift }>(thanked)).gift.thankedAt).not.toBeNull();

    expect((await list("?kind=transfer")).items.map((g) => g.giverName)).toEqual(["Bu Sari"]);
    expect((await list("?thanked=true")).items.map((g) => g.giverName)).toEqual(["Pak Joko"]);
    expect((await list("?thanked=false")).items).toHaveLength(2);
    expect((await list("?q=jok")).items).toHaveLength(1);
    expect((await list("?q=blend")).items.map((g) => g.giverName)).toEqual(["Budi"]);
    const filtered = await list("?kind=barang");
    expect(filtered.items).toHaveLength(1);
    expect(filtered.summary).toMatchObject({ count: 3, notThanked: 2 });

    const undo = await api.post(`/received-gifts/${a?.id}/thanked`, { thanked: false });
    expect((await read<{ gift: ReceivedGift }>(undo)).gift.thankedAt).toBeNull();
  });

  it("mengubah (termasuk jenis) dan menghapus catatan; urutan terbaru dulu", async () => {
    const old = (
      await add({ giverName: "Lama", kind: "amplop", amount: 1000, receivedOn: "2027-05-01" })
    ).gift;
    const recent = (
      await add({ giverName: "Baru", kind: "amplop", amount: 2000, receivedOn: "2027-05-21" })
    ).gift;
    expect((await list()).items.map((g) => g.id)).toEqual([recent?.id, old?.id]);

    const changed = await api.put(`/received-gifts/${old?.id}`, {
      giverName: "Lama",
      kind: "barang",
      itemDescription: "Set piring",
      receivedOn: "2027-05-01",
    });
    expect((await read<{ gift: ReceivedGift }>(changed)).gift).toMatchObject({
      kind: "barang",
      amount: null,
      itemDescription: "Set piring",
    });
    expect(
      (await api.put(`/received-gifts/${old?.id}`, { giverName: "Lama", kind: "amplop" })).status,
    ).toBe(400);

    expect((await api.delete(`/received-gifts/${old?.id}`)).status).toBe(200);
    expect((await api.delete(`/received-gifts/${old?.id}`)).status).toBe(404);
    expect(
      (
        await api.put(`/received-gifts/${old?.id}`, {
          giverName: "x",
          kind: "barang",
          itemDescription: "y",
        })
      ).status,
    ).toBe(404);
    expect((await api.post(`/received-gifts/${old?.id}/thanked`, { thanked: true })).status).toBe(
      404,
    );
  });

  it("mengekspor CSV: angka polos, tanda terima kasih, filter yang sama, dan sel aman dari rumus", async () => {
    await add({ giverName: "Pak Joko", kind: "amplop", amount: 500_000, receivedOn: "2027-05-21" });
    await add({
      giverName: '=HYPERLINK("http://jahat")',
      kind: "transfer",
      amount: 1_250_000,
      note: "BCA, titipan Bu Tini",
      receivedOn: "2027-05-20",
    });
    const rice = (await add({ giverName: "Budi", kind: "barang", itemDescription: "Rice cooker" }))
      .gift;
    await api.post(`/received-gifts/${rice?.id}/thanked`, { thanked: true });

    const res = await api.get("/received-gifts/export.csv");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("hadiah-masuk.csv");
    const bytes = new Uint8Array(await res.arrayBuffer());
    // BOM UTF-8 di awal agar Excel membaca huruf non-ASCII dengan benar (text() membuangnya).
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const csv = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes).slice(1);
    expect(csv.startsWith("tanggal_diterima,pemberi,jenis,nominal,barang,catatan,")).toBe(true);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(4);
    expect(csv).toContain("2027-05-21,Pak Joko,Amplop (tunai),500000,,,tidak,,Ramli");
    expect(csv).toContain('"BCA, titipan Bu Tini"');
    expect(csv).toContain(",1250000,");
    // Rumus dinetralkan dengan awalan apostrof.
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toMatch(/,=HYPERLINK/);
    const barangLine = lines.find((l) => l.includes("Rice cooker")) ?? "";
    expect(barangLine).toMatch(/,ya,\d{4}-\d{2}-\d{2},Ramli$/);

    const onlyTransfer = await (await api.get("/received-gifts/export.csv?kind=transfer")).text();
    expect(onlyTransfer.trim().split("\n")).toHaveLength(2);
    const notThanked = await (await api.get("/received-gifts/export.csv?thanked=false")).text();
    expect(notThanked).not.toContain("Rice cooker");
  });

  it("memerlukan login admin", async () => {
    const anonymous = adminClient(ctx.makeApp(), "");
    expect((await anonymous.get("/received-gifts")).status).toBe(401);
    expect((await anonymous.get("/received-gifts/export.csv")).status).toBe(401);
    expect(
      (await anonymous.post("/received-gifts", { giverName: "A", kind: "amplop", amount: 1000 }))
        .status,
    ).toBe(401);
  });
});
