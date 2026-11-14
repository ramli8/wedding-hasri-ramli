import { randomUUID } from "node:crypto";
import type { DoorprizeDrawResponse, DoorprizeList, Guest } from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { checkinEvents } from "../src/db/schema.js";
import { type adminClient, createTestContext, loggedInClient } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());
let api: ReturnType<typeof adminClient>;
const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
});

async function setup(names: string[], checkedIn: number) {
  const { event } = await read<{ event: { id: string } }>(
    await api.post("/events", { slug: "resepsi", name: "Resepsi", checkinEnabled: true }),
  );
  const list: Guest[] = [];
  for (const [i, displayName] of names.entries()) {
    const { guest } = await read<{ guest: Guest }>(
      await api.post("/guests", {
        displayName,
        phone: `08123456${String(1000 + i)}`,
        eventIds: [event.id],
      }),
    );
    list.push(guest);
    if (i < checkedIn) {
      await ctx.db.insert(checkinEvents).values({
        id: randomUUID(),
        kind: "checkin",
        guestId: guest.id,
        eventId: event.id,
        pax: 1,
        method: "qr",
        scannedAt: new Date(),
      });
    }
  }
  return list;
}

describe("doorprize", () => {
  it("hanya tamu check-in, tidak ada pemenang ganda, kuota dan undi ulang", async () => {
    const guests = await setup(["A", "B", "C", "D"], 3);
    const { prize } = await read<{ prize: { id: string } }>(
      await api.post("/doorprize/prizes", { name: "Kipas angin", quantity: 2 }),
    );
    expect((await read<DoorprizeList>(await api.get("/doorprize"))).poolSize).toBe(3);

    const first = await read<DoorprizeDrawResponse>(
      await api.post(`/doorprize/prizes/${prize.id}/draw`, {}),
    );
    const second = await read<DoorprizeDrawResponse>(
      await api.post(`/doorprize/prizes/${prize.id}/draw`, {}),
    );
    expect(first.winner.guestId).not.toBe(second.winner.guestId);
    const notCheckedIn = guests[3]?.id;
    expect([first.winner.guestId, second.winner.guestId]).not.toContain(notCheckedIn);

    // Kuota 2 sudah penuh.
    expect((await api.post(`/doorprize/prizes/${prize.id}/draw`, {})).status).toBe(409);

    // Pemenang pertama tidak maju: dicoret, undi ulang memilih satu-satunya sisa.
    const redraw = await read<DoorprizeDrawResponse>(
      await api.post(`/doorprize/winners/${first.winner.id}/redraw`, {}),
    );
    expect([first.winner.guestId, second.winner.guestId]).not.toContain(redraw.winner.guestId);
    expect(redraw.prize.winners.filter((w) => !w.forfeitedAt)).toHaveLength(2);
    expect((await api.post(`/doorprize/winners/${first.winner.id}/redraw`, {})).status).toBe(404);

    // Peserta habis untuk hadiah berikutnya.
    const { prize: other } = await read<{ prize: { id: string } }>(
      await api.post("/doorprize/prizes", { name: "Payung", quantity: 1 }),
    );
    expect((await read<DoorprizeList>(await api.get("/doorprize"))).poolSize).toBe(0);
    expect((await api.post(`/doorprize/prizes/${other.id}/draw`, {})).status).toBe(409);

    // Batalkan satu hasil: tamunya ikut diundi lagi.
    expect((await api.delete(`/doorprize/winners/${second.winner.id}`)).status).toBe(200);
    const again = await read<DoorprizeDrawResponse>(
      await api.post(`/doorprize/prizes/${other.id}/draw`, {}),
    );
    expect(again.winner.guestId).toBe(second.winner.guestId);
  });

  it("dua undian bersamaan tidak melebihi kuota", async () => {
    await setup(["A", "B", "C", "D", "E"], 5);
    const { prize } = await read<{ prize: { id: string } }>(
      await api.post("/doorprize/prizes", { name: "Kulkas", quantity: 1 }),
    );
    const results = await Promise.all(
      [1, 2, 3].map(() => api.post(`/doorprize/prizes/${prize.id}/draw`, {})),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409, 409]);
  });
});
