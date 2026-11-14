import type { SeserahanItem } from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { type adminClient, createTestContext, loggedInClient } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());
let api: ReturnType<typeof adminClient>;
const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
});

type List = {
  items: SeserahanItem[];
  summary: { count: number; priceTotal: number; byStatus: Record<string, number> };
};

describe("seserahan", () => {
  it("tambah, ubah status, ubah, hapus, rekap, urut kategori, dan ekspor", async () => {
    const hantaran = await api.post("/seserahan", {
      category: "hantaran",
      name: "Kue lapis",
      price: 150_000,
    });
    expect(hantaran.status).toBe(201);
    const mahar = await read<{ item: SeserahanItem }>(
      await api.post("/seserahan", {
        category: "mahar",
        name: "Seperangkat alat salat",
        pic: "Ibu",
        price: 350_000,
      }),
    );
    expect(mahar.item.status).toBe("rencana");

    const status = await api.post(`/seserahan/${mahar.item.id}/status`, { status: "dibeli" });
    expect((await read<{ item: SeserahanItem }>(status)).item.status).toBe("dibeli");

    const list = await read<List>(await api.get("/seserahan"));
    expect(list.items.map((i) => i.category)).toEqual(["mahar", "hantaran"]);
    expect(list.summary).toMatchObject({
      count: 2,
      priceTotal: 500_000,
      byStatus: { rencana: 1, dibeli: 1, dikemas: 0, diserahkan: 0 },
    });

    const edited = await api.put(`/seserahan/${mahar.item.id}`, {
      category: "mahar",
      name: "Seperangkat alat salat + Al-Qur'an",
      status: "dikemas",
    });
    expect((await read<{ item: SeserahanItem }>(edited)).item).toMatchObject({
      pic: null,
      price: null,
      status: "dikemas",
    });

    expect((await api.post("/seserahan", { category: "lain", name: "x" })).status).toBe(400);
    expect((await api.post("/seserahan", { category: "mahar", name: " " })).status).toBe(400);

    const xlsx = await api.get("/seserahan/export.xlsx");
    expect(xlsx.headers.get("content-type")).toContain("spreadsheetml");

    expect((await api.delete(`/seserahan/${mahar.item.id}`)).status).toBe(200);
    expect((await api.delete(`/seserahan/${mahar.item.id}`)).status).toBe(404);
  });
});
