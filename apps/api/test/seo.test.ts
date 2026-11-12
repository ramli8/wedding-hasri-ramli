import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Media, SeoResponse } from "@wedding/shared";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boothPhotos, guests } from "../src/db/schema.js";
import { adminClient, createTestContext, insertAdmin, login, ORIGIN, resetDb } from "./helpers.js";

const INDEX = `<!doctype html><html><head><title>Hasri & Ramli</title></head><body><div id="root"></div></body></html>`;

let server: Server;
let ctx: ReturnType<typeof createTestContext>;

beforeAll(async () => {
  server = createServer((_req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(INDEX);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  ctx = createTestContext({ WEB_INDEX_URL: `http://127.0.0.1:${port}/index.html` });
});

afterAll(async () => {
  await ctx.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

let app: ReturnType<typeof ctx.makeApp>;
let cookie: string;
let api: ReturnType<typeof adminClient>;

beforeEach(async () => {
  await resetDb(ctx.db);
  await insertAdmin(ctx.db);
  app = ctx.makeApp();
  ({ cookie } = await login(app));
  api = adminClient(app, cookie);
});

async function uploadPhoto(): Promise<Media> {
  const png = await sharp({
    create: { width: 600, height: 315, channels: 3, background: "#aa3355" },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.append("file", new File([new Uint8Array(png)], "sampul.png"));
  const res = await app.request("/api/v1/admin/media", {
    method: "POST",
    headers: { origin: ORIGIN, cookie },
    body: form,
  });
  return ((await res.json()) as { media: Media }).media;
}

const saveSettings = () =>
  api.put("/settings", {
    groomName: "Ramli",
    brideName: "Hasri",
    publicBaseUrl: "https://contoh.com/",
  });

describe("pengaturan pratinjau tautan", () => {
  it("menolak disimpan sebelum data pernikahan diisi", async () => {
    const res = await api.put("/seo", { title: "Judul", description: "Isi", imageMediaId: null });
    expect(res.status).toBe(409);
  });

  it("menyimpan judul, deskripsi, dan gambar", async () => {
    await saveSettings();
    const photo = await uploadPhoto();
    const res = await api.put("/seo", {
      title: "Kami menikah",
      description: "Halo {panggilan}",
      imageMediaId: photo.id,
    });
    expect(res.status).toBe(200);
    const { seo } = (await res.json()) as SeoResponse;
    expect(seo.title).toBe("Kami menikah");
    expect(seo.image?.id).toBe(photo.id);
    expect(((await (await api.get("/seo")).json()) as SeoResponse).seo.description).toBe(
      "Halo {panggilan}",
    );
  });

  it("menolak judul yang terlalu panjang", async () => {
    await saveSettings();
    const res = await api.put("/seo", {
      title: "x".repeat(71),
      description: "",
      imageMediaId: null,
    });
    expect(res.status).toBe(400);
  });
});

describe("halaman tamu dengan tag Open Graph", () => {
  async function addGuest() {
    const [guest] = await ctx.db
      .insert(guests)
      .values({ displayName: "Bpk. Budi & Keluarga", code: "ABC234", phone: "6281234567890" })
      .returning();
    return guest;
  }

  it("menyisipkan judul, deskripsi, dan gambar milik tamu", async () => {
    await saveSettings();
    const photo = await uploadPhoto();
    await api.put("/seo", {
      title: "Undangan {mempelai}",
      description: "Untuk {panggilan}",
      imageMediaId: photo.id,
    });
    await addGuest();

    const res = await app.request("/u/ABC234");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<title>Undangan Hasri &amp; Ramli</title>");
    expect(html).toContain('property="og:description" content="Untuk Bpk. Budi &amp; Keluarga"');
    expect(html).toContain(`content="https://contoh.com/media/${photo.id}/thumb.webp"`);
    expect(html).toContain('property="og:url" content="https://contoh.com/u/ABC234"');
    expect(html).toContain('<div id="root">');
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
  });

  it("memakai teks bawaan bila belum diatur dan kode juga berlaku di /undangan", async () => {
    await saveSettings();
    await addGuest();
    const html = await (await app.request("/u/abc234/undangan")).text();
    expect(html).toContain("Undangan pernikahan Hasri &amp; Ramli");
    expect(html).toContain('property="og:url" content="https://contoh.com/u/ABC234/undangan"');
    expect(html).not.toContain("og:image");
  });

  it("kode tidak dikenal tetap menyajikan aplikasi tanpa tag pratinjau", async () => {
    await saveSettings();
    const html = await (await app.request("/u/ZZZZZZ")).text();
    expect(html).toContain("<title>Hasri & Ramli</title>");
    expect(html).not.toContain("og:title");
  });

  it("nama tamu berisi pola $ tidak menyalin potongan HTML ke dalam tag", async () => {
    await saveSettings();
    await ctx.db
      .insert(guests)
      .values({ displayName: "Budi $' $& $`", code: "ABC234", phone: "6281234567890" });
    const html = await (await app.request("/u/ABC234")).text();
    expect(html).toContain('property="og:description" content="');
    expect(html).toContain("Budi $' $&amp; $`");
    expect(html.match(/<div id="root">/g)).toHaveLength(1);
  });

  it("tebakan kode berulang dari satu IP tidak lagi membocorkan nama tamu", async () => {
    await saveSettings();
    await addGuest();
    for (let i = 0; i < 30; i++) await app.request("/u/ZZZZZZ");
    const html = await (await app.request("/u/ABC234")).text();
    expect(html).not.toContain("Bpk. Budi");
    expect(html).toContain('<div id="root">');
  });
});

describe("halaman foto photobooth dengan tag Open Graph", () => {
  const ID = "0190f4c2-6b1e-7a3c-9d2e-1f2a3b4c5d6e";

  it("pratinjau tautan berisi foto itu; id tidak dikenal tanpa pratinjau", async () => {
    await saveSettings();
    const photo = await uploadPhoto();
    await ctx.db.insert(boothPhotos).values({
      id: ID,
      mediaId: photo.id,
      frame: "poster",
      takenAt: new Date("2027-05-21T05:12:00.000Z"),
    });

    const res = await app.request(`/foto/${ID}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<title>Foto photobooth · Hasri &amp; Ramli</title>");
    expect(html).toContain(
      `property="og:image" content="https://contoh.com/media/${photo.id}/thumb.webp"`,
    );
    expect(html).toContain(`property="og:url" content="https://contoh.com/foto/${ID}"`);
    expect(res.headers.get("x-robots-tag")).toContain("noindex");

    for (const path of ["/foto/0190f4c2-6b1e-7a3c-9d2e-1f2a3b4c5d00", "/foto/bukan-uuid"]) {
      const other = await app.request(path);
      expect(other.status).toBe(200);
      const body = await other.text();
      expect(body).not.toContain("og:image");
      expect(body).toContain('<div id="root">');
    }
  });
});
