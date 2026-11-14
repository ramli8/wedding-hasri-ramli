import { randomUUID } from "node:crypto";
import type { Guest, VipFeed } from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { checkinEvents } from "../src/db/schema.js";
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

async function checkIn(guestId: string, eventId: string) {
  const id = randomUUID();
  await ctx.db.insert(checkinEvents).values({
    id,
    kind: "checkin",
    guestId,
    eventId,
    pax: 1,
    method: "qr",
    scannedAt: new Date(),
  });
  return id;
}

describe("kabar VIP", () => {
  it("hanya tamu VIP (atau kelompok VIP) yang datang, check-in dibatalkan tidak dihitung", async () => {
    const { event } = await read<{ event: { id: string } }>(
      await api.post("/events", { slug: "resepsi", name: "Resepsi", checkinEnabled: true }),
    );
    const guest = async (displayName: string, isVip: boolean) =>
      (
        await read<{ guest: Guest }>(
          await api.post("/guests", {
            displayName,
            phone: `0812${Math.floor(Math.random() * 1e8)}`,
            isVip,
            eventIds: [event.id],
          }),
        )
      ).guest;
    const kades = await guest("Pak Kades", true);
    const biasa = await guest("Tamu Biasa", false);
    const camat = await guest("Pak Camat", true);
    expect(kades.isVip).toBe(true);

    const pertama = await checkIn(kades.id, event.id);
    // Dipindai dua perangkat (duplikat): keluarga cukup dikabari sekali.
    await checkIn(kades.id, event.id);
    await checkIn(biasa.id, event.id);
    const batal = await checkIn(camat.id, event.id);
    await ctx.db.insert(checkinEvents).values({
      id: randomUUID(),
      kind: "undo",
      guestId: camat.id,
      eventId: event.id,
      targetId: batal,
      scannedAt: new Date(),
    });

    const feed = await read<VipFeed & { token: string }>(await api.get("/vip"));
    expect(feed.arrivals.map((a) => a.guestName)).toEqual(["Pak Kades"]);
    expect(feed.arrivals[0]?.id).toBe(pertama);
    expect(feed.arrivedCount).toBe(1);
    expect(feed.vipCount).toBe(2);

    const pub = await app.request(`/api/v1/public/vip/${feed.token}`);
    expect(pub.status).toBe(200);
    expect(JSON.stringify(await pub.json())).not.toContain("0812");

    const { token } = await read<{ token: string }>(await api.post("/vip/token"));
    expect((await app.request(`/api/v1/public/vip/${feed.token}`)).status).toBe(404);
    expect((await app.request(`/api/v1/public/vip/${token}`)).status).toBe(200);
  });
});
