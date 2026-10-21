import type { HomeResponse } from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adminClient, createTestContext, loggedInClient } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());

type Api = ReturnType<typeof adminClient>;
let api: Api;
const read = async <T>(res: Response) => (await res.json()) as T;
const home = async () => read<HomeResponse>(await api.get("/home"));

beforeEach(async () => {
  api = await loggedInClient(ctx);
});

describe("beranda admin", () => {
  it("kosong: angka nol, tanpa RSVP dan check-in, dan tidak galat", async () => {
    expect(await home()).toMatchObject({
      eventDate: null,
      guests: { total: 0, neverSent: 0 },
      rsvp: null,
      checkin: null,
      vendors: { due: [], summary: { selectedCount: 0, overdueCount: 0 } },
      gifts: { count: 0, notThanked: 0 },
      guestbookUnreplied: 0,
      coupleFilled: false,
    });
  });

  it("merangkum tamu, RSVP, check-in, vendor, hadiah, ucapan, dan profil mempelai", async () => {
    const event = (
      await read<{ event: { id: string } }>(
        await api.post("/events", {
          slug: "resepsi",
          name: "Resepsi",
          startsAt: "2027-05-21T03:00:00Z",
          endsAt: "2027-05-21T07:00:00Z",
          checkinEnabled: true,
          hasRsvp: true,
        }),
      )
    ).event;
    const mk = async (displayName: string, phone: string) =>
      (
        await read<{ guest: { id: string } }>(
          await api.post("/guests", { displayName, phone, eventIds: [event.id] }),
        )
      ).guest;
    const a = await mk("Pak Joko", "0812-3456-7890");
    await mk("Bu Tini", "0812-3456-7891");
    await mk("Mas Andi", "0812-3456-7892");
    await api.post(`/guests/${a.id}/sent`, { eventId: event.id, via: "whatsapp" });

    // Vendor terpilih yang terlambat.
    const cat = (
      await read<{ category: { id: string } }>(
        await api.post("/vendors/categories", { name: "Katering" }),
      )
    ).category;
    const vendor = (
      await read<{ vendor: { id: string } }>(
        await api.post("/vendors", {
          categoryId: cat.id,
          name: "Dapur Bunda",
          contractAmount: 10_000_000,
          dueOn: "2020-01-01",
        }),
      )
    ).vendor;
    await api.post(`/vendors/${vendor.id}/select`, { selected: true });
    await api.post("/received-gifts", { giverName: "Pak Joko", kind: "amplop", amount: 500_000 });
    await api.put("/invitation/couple/groom", { fullName: "Ramli" });

    const result = await home();
    expect(result.eventDate).toBe("2027-05-21T03:00:00.000Z");
    expect(result.guests).toEqual({ total: 3, neverSent: 2 });
    expect(result.rsvp).toMatchObject({ eventName: "Resepsi", invited: 3, belum: 3 });
    expect(result.checkin).toMatchObject({ eventName: "Resepsi", invited: 3, arrived: 0 });
    expect(result.vendors.summary).toMatchObject({ overdueCount: 1, contractTotal: 10_000_000 });
    expect(result.vendors.due).toEqual([
      expect.objectContaining({
        name: "Dapur Bunda",
        categoryName: "Katering",
        state: "terlambat",
      }),
    ]);
    expect(result.gifts).toMatchObject({ count: 1, amplopTotal: 500_000, notThanked: 1 });
    expect(result.coupleFilled).toBe(false);

    await api.put("/invitation/couple/bride", { fullName: "Hasri" });
    expect((await home()).coupleFilled).toBe(true);
  });

  it("tamu yang dihapus tidak dihitung, dan memerlukan login", async () => {
    const guest = (
      await read<{ guest: { id: string } }>(
        await api.post("/guests", { displayName: "Dihapus", phone: "0812-3456-7899" }),
      )
    ).guest;
    expect((await home()).guests.total).toBe(1);
    await api.delete(`/guests/${guest.id}`);
    expect((await home()).guests.total).toBe(0);
    expect((await adminClient(ctx.makeApp(), "").get("/home")).status).toBe(401);
  });
});
