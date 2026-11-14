import type { PublicRundown, RundownItem } from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { type adminClient, createTestContext, loggedInClient } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());
let api: ReturnType<typeof adminClient>;
let app: ReturnType<typeof ctx.makeApp>;
const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
  app = ctx.makeApp();
});

async function event(slug: string) {
  const res = await api.post("/events", { slug, name: slug === "akad" ? "Akad" : "Resepsi" });
  return (await read<{ event: { id: string } }>(res)).event.id;
}

async function item(body: Record<string, unknown>) {
  const res = await api.post("/rundown/items", body);
  expect(res.status).toBe(201);
  return (await read<{ item: RundownItem }>(res)).item;
}

describe("rundown", () => {
  it("urut jam, geser jam mulai dari satu kegiatan, dan tautan baca-saja", async () => {
    const akad = await event("akad");
    const resepsi = await event("resepsi");
    const category = await read<{ category: { id: string } }>(
      await api.post("/vendors/categories", { name: "Dokumentasi" }),
    );
    const vendor = await read<{ vendor: { id: string } }>(
      await api.post("/vendors", {
        categoryId: category.category.id,
        name: "Foto Ceria",
        picName: "Mas Andi",
        picPhone: "081234567890",
      }),
    );

    const foto = await item({
      eventId: akad,
      time: "09:45",
      title: "Foto keluarga",
      vendorId: vendor.vendor.id,
    });
    await item({
      eventId: akad,
      time: "09:00",
      title: "Akad nikah",
      durationMin: 45,
      pic: "Penghulu",
    });
    const sambutan = await item({ eventId: akad, time: "10:30", title: "Sambutan" });
    const lain = await item({ eventId: resepsi, time: "10:00", title: "Kirab" });
    expect(
      (await api.post("/rundown/items", { eventId: akad, time: "25:00", title: "x" })).status,
    ).toBe(400);

    const list = await read<{ items: RundownItem[]; token: string }>(await api.get("/rundown"));
    expect(list.items.filter((i) => i.eventId === akad).map((i) => i.time)).toEqual([
      "09:00",
      "09:45",
      "10:30",
    ]);

    // Foto molor 15 menit: foto dan sesudahnya (di acara yang sama) ikut bergeser.
    const shifted = await api.post(`/rundown/items/${foto.id}/shift`, { minutes: 15 });
    expect(await read<{ shifted: number }>(shifted)).toEqual({ shifted: 2 });
    const after = await read<{ items: RundownItem[] }>(await api.get("/rundown"));
    const time = (id: string) => after.items.find((i) => i.id === id)?.time;
    expect(time(foto.id)).toBe("10:00");
    expect(time(sambutan.id)).toBe("10:45");
    expect(time(lain.id)).toBe("10:00");

    const pub = await app.request(`/api/v1/public/rundown/${list.token}`);
    expect(pub.status).toBe(200);
    const data = await read<PublicRundown>(pub);
    const akadItems = data.events.find((e) => e.id === akad)?.items ?? [];
    expect(akadItems.find((i) => i.title === "Foto keluarga")?.vendor).toEqual({
      name: "Foto Ceria",
      picName: "Mas Andi",
      picPhone: "6281234567890",
    });

    const renewed = await read<{ token: string }>(await api.post("/rundown/token"));
    expect((await app.request(`/api/v1/public/rundown/${list.token}`)).status).toBe(404);
    expect((await app.request(`/api/v1/public/rundown/${renewed.token}`)).status).toBe(200);
  });
});
