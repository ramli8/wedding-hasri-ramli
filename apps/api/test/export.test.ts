import { unzipSync } from "fflate";
import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adminClient,
  createTestContext,
  insertAdmin,
  loggedInClient,
  login,
  ORIGIN,
  resetDb,
} from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());

type Api = ReturnType<typeof adminClient>;
let api: Api;
const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
});

type Exported = {
  format: string;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
};

describe("ekspor data", () => {
  it("memuat seluruh tabel isi tanpa akun admin, sesi, dan token perangkat", async () => {
    const event = (
      await read<{ event: { id: string } }>(
        await api.post("/events", { slug: "resepsi", name: "Resepsi" }),
      )
    ).event;
    await api.post("/guests", {
      displayName: "Pak Joko",
      phone: "0812-3456-7890",
      eventIds: [event.id],
    });
    await api.post("/received-gifts", { giverName: "Pak Joko", kind: "amplop", amount: 500_000 });
    const device = await read<{ pairingCode: string }>(
      await api.post("/devices", { name: "HP A" }),
    );

    const res = await api.get("/export/data.json");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(
      /attachment; filename="data-pernikahan-\d{4}-\d{2}-\d{2}\.json"/,
    );
    const raw = await res.text();
    const data = JSON.parse(raw) as Exported;

    expect(data.format).toBe("wedding-export-v1");
    expect(Number.isNaN(Date.parse(data.exportedAt))).toBe(false);
    expect(Object.keys(data.tables)).toEqual(
      expect.arrayContaining([
        "events",
        "guests",
        "guest_events",
        "rsvps",
        "guestbook",
        "checkin_events",
        "received_gifts",
        "vendors",
        "vendor_payments",
        "media",
        "wishlist_claims",
        "devices",
        "settings",
      ]),
    );
    expect(data.tables.guests).toHaveLength(1);
    expect(data.tables.guests?.[0]).toMatchObject({ displayName: "Pak Joko" });
    expect(data.tables.received_gifts?.[0]).toMatchObject({
      giverName: "Pak Joko",
      amount: 500_000,
    });

    // Rahasia tidak ikut.
    expect(data.tables).not.toHaveProperty("admins");
    expect(data.tables).not.toHaveProperty("admin_sessions");
    expect(data.tables.devices).toHaveLength(1);
    expect(data.tables.devices?.[0]).not.toHaveProperty("tokenHash");
    expect(data.tables.devices?.[0]).not.toHaveProperty("pairingCodeHash");
    expect(raw).not.toContain("passwordHash");
    expect(raw).not.toContain("$argon2");
    expect(raw).not.toContain(device.pairingCode);
  });

  it("memerlukan login admin", async () => {
    const anonymous = adminClient(ctx.makeApp(), "");
    expect((await anonymous.get("/export/data.json")).status).toBe(401);
    expect((await anonymous.get("/export/media.zip")).status).toBe(401);
  });
});

describe("ekspor foto", () => {
  let app: ReturnType<typeof ctx.makeApp>;
  let cookie: string;
  let client: Api;

  beforeEach(async () => {
    await resetDb(ctx.db);
    await insertAdmin(ctx.db);
    app = ctx.makeApp();
    ({ cookie } = await login(app));
    client = adminClient(app, cookie);
  });

  async function upload(name: string) {
    const png = await sharp({
      create: { width: 120, height: 80, channels: 3, background: "#d8ff3e" },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.append("file", new File([new Uint8Array(png)], name));
    const res = await app.request("/api/v1/admin/media", {
      method: "POST",
      headers: { origin: ORIGIN, cookie },
      body: form,
    });
    expect(res.status).toBe(201);
    return (await read<{ media: { id: string } }>(res)).media.id;
  }

  it("menghasilkan ZIP berisi large dan thumb tiap foto", async () => {
    const a = await upload("a.png");
    const b = await upload("b.png");

    const res = await client.get("/export/media.zip");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(res.headers.get("content-disposition")).toMatch(/foto-undangan-\d{4}-\d{2}-\d{2}\.zip/);
    const files = unzipSync(new Uint8Array(await res.arrayBuffer()));

    for (const id of [a, b]) {
      for (const variant of ["large", "thumb"]) {
        const bytes = files[`${id}/${variant}.webp`];
        expect(bytes, `${id}/${variant}.webp`).toBeDefined();
        // Isinya gambar WebP sungguhan (RIFF....WEBP).
        expect(new TextDecoder().decode(bytes?.slice(0, 4))).toBe("RIFF");
        expect(new TextDecoder().decode(bytes?.slice(8, 12))).toBe("WEBP");
      }
    }
    // Folder foto dari uji lain di folder bersama ikut terhitung, jadi cukup memuat keduanya.
    expect(Object.keys(files).length).toBeGreaterThanOrEqual(4);
  });
});
