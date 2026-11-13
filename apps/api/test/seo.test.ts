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
    expect(html).toContain(`content="https://contoh.com/media/${photo.id}/og.jpg"`);
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');

    // Gambar kartu: JPEG 1200 × 630 potongan tengah, dibuat sekali lalu disajikan dari disk.
    const og = await app.request(`/media/${photo.id}/og.jpg`);
    expect(og.headers.get("content-type")).toBe("image/jpeg");
    const meta = await sharp(Buffer.from(await og.arrayBuffer())).metadata();
    expect(meta).toMatchObject({ format: "jpeg", width: 1200, height: 630 });
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
    await api.put("/seo", { title: "Untuk {panggilan}", description: "", imageMediaId: null });
    await ctx.db
      .insert(guests)
      .values({ displayName: "Budi $' $& $`", code: "ABC234", phone: "6281234567890" });
    const html = await (await app.request("/u/ABC234")).text();
    expect(html).toContain('property="og:title" content="Untuk Budi $');
    expect(html).not.toContain("og:description");
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
      `property="og:image" content="https://contoh.com/media/${photo.id}/og.jpg"`,
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

describe("logo dan ikon situs", () => {
  it("tanpa logo dialihkan ke ikon bawaan; dengan logo PNG sesuai ukuran, maskable berlatar", async () => {
    const fallback = await app.request("/site-icon/icon-192.png");
    expect(fallback.status).toBe(302);
    expect(fallback.headers.get("location")).toBe("/icons/icon-192.png");
    expect((await app.request("/site-icon/bukan.png")).status).toBe(400);

    await saveSettings();
    const logo = await uploadPhoto();
    const saved = await api.put("/seo", {
      title: "",
      description: "",
      imageMediaId: null,
      logoMediaId: logo.id,
    });
    expect(((await saved.json()) as SeoResponse).seo.logo?.id).toBe(logo.id);

    for (const [name, size] of [
      ["favicon-32.png", 32],
      ["apple-touch-icon.png", 180],
      ["icon-maskable-512.png", 512],
    ] as const) {
      const res = await app.request(`/site-icon/${name}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("image/png");
      const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
      expect(meta).toMatchObject({ format: "png", width: size, height: size });
    }

    // Logo yang sama tidak boleh sekaligus jadi gambar kartu (satu gambar satu pemilik).
    const clash = await api.put("/seo", {
      title: "",
      description: "",
      imageMediaId: logo.id,
      logoMediaId: logo.id,
    });
    expect(clash.status).toBe(409);
  });
});

describe("nama situs", () => {
  it("bawaan sebelum diatur; dipakai /public/site dan manifest PWA", async () => {
    const site = async () =>
      (await (await app.request("/api/v1/public/site")).json()) as {
        name: string;
      };
    expect(await site()).toEqual({ name: "Hasri & Ramli" });

    const saved = await api.put("/settings", {
      siteName: "  Hasri ♥ Ramli ",
      groomName: "Ramli",
      brideName: "Hasri",
      publicBaseUrl: "https://contoh.com",
    });
    expect(saved.status).toBe(200);
    expect(await site()).toEqual({ name: "Hasri ♥ Ramli" });

    const manifest = await app.request("/manifest.webmanifest");
    expect(manifest.headers.get("content-type")).toContain("application/manifest+json");
    expect(await manifest.json()).toMatchObject({
      name: "Hasri ♥ Ramli",
      short_name: "Hasri ♥ Ramli",
      icons: expect.arrayContaining([expect.objectContaining({ src: "/site-icon/icon-192.png" })]),
    });

    const tooLong = await api.put("/settings", {
      siteName: "x".repeat(41),
      groomName: "Ramli",
      brideName: "Hasri",
      publicBaseUrl: "https://contoh.com",
    });
    expect(tooLong.status).toBe(400);
  });
});
