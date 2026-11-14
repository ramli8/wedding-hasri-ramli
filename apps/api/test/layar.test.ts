import { randomUUID } from "node:crypto";
import {
  type Device,
  type Guest,
  type LayarFeed,
  SYNC_PROTOCOL_VERSION,
  SYNC_VERSION_HEADER,
} from "@wedding/shared";
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

async function pair(kind: "layar" | "scanner") {
  const created = await read<{ pairingCode: string; device: Device }>(
    await api.post("/devices", { name: `Perangkat ${kind}`, kind }),
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
  return (await read<{ token: string }>(paired)).token;
}

const feed = (token: string) =>
  app.request("/api/v1/layar/feed", { headers: { authorization: `Bearer ${token}` } });

describe("layar sapa/dapur", () => {
  it("tanpa acara check-in aktif tetap tampil kosong", async () => {
    const token = await pair("layar");
    const res = await feed(token);
    expect(res.status).toBe(200);
    const body = await read<LayarFeed>(res);
    expect(body.eventName).toBeNull();
    expect(body.recent).toEqual([]);
    expect(body.kitchen).toMatchObject({ arrivedPax: 0, portionsReady: 0 });
  });

  it("nama tamu yang datang dan porsi dari admin, tanpa kontak; scanner ditolak", async () => {
    const { event } = await read<{ event: { id: string } }>(
      await api.post("/events", { slug: "resepsi", name: "Resepsi", checkinEnabled: true }),
    );
    const { guest } = await read<{ guest: Guest }>(
      await api.post("/guests", {
        displayName: "Bu Lurah",
        phone: "081234567890",
        eventIds: [event.id],
      }),
    );
    await ctx.db.insert(checkinEvents).values({
      id: randomUUID(),
      kind: "checkin",
      guestId: guest.id,
      eventId: event.id,
      pax: 3,
      method: "qr",
      scannedAt: new Date(),
    });
    expect((await api.put("/layar", { portionsReady: 250 })).status).toBe(200);
    expect((await api.put("/layar", { portionsReady: -1 })).status).toBe(400);

    const token = await pair("layar");
    const res = await feed(token);
    const body = await read<LayarFeed>(res);
    expect(body.eventName).toBe("Resepsi");
    expect(body.recent.map((r) => r.name)).toEqual(["Bu Lurah"]);
    expect(body.kitchen).toMatchObject({ arrivedPax: 3, portionsReady: 250 });
    expect(JSON.stringify(body)).not.toContain("0812");

    const scanner = await pair("scanner");
    expect((await feed(scanner)).status).toBe(403);
    expect((await feed("salah")).status).toBe(401);
  });
});
