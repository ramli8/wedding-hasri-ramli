import { existsSync } from "node:fs";
import { join } from "node:path";
import { MAX_UPLOAD_BYTES, type Media } from "@wedding/shared";
import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adminClient,
  createTestContext,
  insertAdmin,
  login,
  ORIGIN,
  resetDb,
  TEST_MEDIA_DIR,
} from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());

type App = ReturnType<typeof ctx.makeApp>;
let app: App;
let cookie: string;
let api: ReturnType<typeof adminClient>;

beforeEach(async () => {
  await resetDb(ctx.db);
  await insertAdmin(ctx.db);
  app = ctx.makeApp();
  ({ cookie } = await login(app));
  api = adminClient(app, cookie);
});

const read = async <T>(res: Response) => (await res.json()) as T;

function upload(file: Buffer | null, name = "foto.png", withCookie = true) {
  const form = new FormData();
  if (file) form.append("file", new File([new Uint8Array(file)], name));
  return app.request("/api/v1/admin/media", {
    method: "POST",
    headers: { origin: ORIGIN, ...(withCookie ? { cookie } : {}) },
    body: form,
  });
}

/** Gambar berdetail halus (gradasi + derau) agar kompresi yang boros terlihat di perbandingan piksel. */
async function detailedImage(width: number, height: number) {
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const noise = ((x * 73856093) ^ (y * 19349663)) & 15;
      raw[i] = (x * 255) / width + noise;
      raw[i + 1] = (y * 255) / height + noise;
      raw[i + 2] = ((x + y) * 255) / (width + height) + noise;
    }
  }
  return {
    raw,
    png: await sharp(raw, { raw: { width, height, channels: 3 } })
      .png()
      .toBuffer(),
  };
}

async function fetchVariant(id: string, file: string) {
  return app.request(`/media/${id}/${file}`);
}

describe("unggah gambar", () => {
  it("menyimpan resolusi asli dengan kualitas tinggi, bukan versi yang dikecilkan", async () => {
    const { raw, png } = await detailedImage(3000, 2000);
    const res = await upload(png);
    expect(res.status).toBe(201);
    const { media } = await read<{ media: Media }>(res);

    // Tidak diperkecil: sisi terpanjang tetap 3000 piksel.
    expect([media.width, media.height]).toEqual([3000, 2000]);
    expect(media.originalName).toBe("foto.png");
    expect(media.large).toBe(`/media/${media.id}/large.webp`);

    const large = Buffer.from(await (await fetchVariant(media.id, "large.webp")).arrayBuffer());
    const decoded = await sharp(large).raw().toBuffer({ resolveWithObject: true });
    expect([decoded.info.width, decoded.info.height]).toEqual([3000, 2000]);

    // Selisih rata-rata per kanal di bawah 1 dari 255: detail halus dan warna tetap terjaga. WebP
    // berlossy biasa (bahkan kualitas 95) menghasilkan selisih 4-5 pada gambar ini dan akan gagal.
    let diff = 0;
    for (let i = 0; i < raw.length; i += 7)
      diff += Math.abs((raw[i] ?? 0) - (decoded.data[i] ?? 0));
    const meanError = diff / Math.ceil(raw.length / 7);
    expect(meanError).toBeLessThan(1);
  });

  it("membuat pratinjau kecil untuk daftar admin", async () => {
    const { png } = await detailedImage(2400, 1200);
    const { media } = await read<{ media: Media }>(await upload(png));
    const thumb = Buffer.from(await (await fetchVariant(media.id, "thumb.webp")).arrayBuffer());
    const meta = await sharp(thumb).metadata();
    expect([meta.width, meta.height]).toEqual([480, 240]);
  });

  it("memutar sesuai EXIF dan membuang metadata (termasuk lokasi GPS)", async () => {
    const jpeg = await sharp({
      create: { width: 200, height: 100, channels: 3, background: "#d8ff3e" },
    })
      .jpeg()
      .withMetadata({
        orientation: 6,
        exif: { IFD3: { GPSLatitudeRef: "S", GPSLatitude: "7/1 15/1 0/1" } },
      })
      .toBuffer();
    const source = await sharp(jpeg).metadata();
    expect(source.orientation).toBe(6);
    expect(source.exif).toBeDefined();

    const { media } = await read<{ media: Media }>(await upload(jpeg, "kamera.jpg"));
    // Orientasi 6 = putar 90°, jadi lebar dan tinggi bertukar.
    expect([media.width, media.height]).toEqual([100, 200]);

    const out = Buffer.from(await (await fetchVariant(media.id, "large.webp")).arrayBuffer());
    const meta = await sharp(out).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it("tidak membesarkan gambar kecil", async () => {
    const small = await sharp({
      create: { width: 120, height: 80, channels: 3, background: "#2b2be8" },
    })
      .png()
      .toBuffer();
    const { media } = await read<{ media: Media }>(await upload(small));
    expect([media.width, media.height]).toEqual([120, 80]);
  });

  it("menolak berkas yang bukan gambar, kosong, atau tanpa berkas", async () => {
    const text = await upload(Buffer.from("ini bukan gambar"), "catatan.png");
    expect(text.status).toBe(400);
    expect((await read<{ error: { message: string } }>(text)).error.message).toContain("gambar");

    expect((await upload(Buffer.alloc(0))).status).toBe(400);
    expect((await upload(null)).status).toBe(400);
  });

  it("menolak berkas yang terlalu besar (413) dan memerlukan login", async () => {
    const huge = Buffer.alloc(MAX_UPLOAD_BYTES + 1024 * 1024);
    expect((await upload(huge)).status).toBe(413);

    const { png } = await detailedImage(50, 50);
    expect((await upload(png, "kecil.png", false)).status).toBe(401);
  });
});

describe("menyajikan gambar", () => {
  it("tanpa login, dengan cache panjang dan tipe WebP", async () => {
    const { png } = await detailedImage(300, 200);
    const { media } = await read<{ media: Media }>(await upload(png));

    const anonymous = ctx.makeApp();
    const res = await anonymous.request(`/media/${media.id}/large.webp`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    const bytes = Buffer.from(await res.arrayBuffer());
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
  });

  it("404 untuk id yang tidak ada, dan 400 untuk nama berkas atau id yang ngawur", async () => {
    expect((await fetchVariant("00000000-0000-4000-8000-000000000000", "large.webp")).status).toBe(
      404,
    );
    expect((await fetchVariant("00000000-0000-4000-8000-000000000000", "asli.png")).status).toBe(
      400,
    );
    expect((await fetchVariant("bukan-uuid", "large.webp")).status).toBe(400);
  });
});

describe("daftar dan hapus", () => {
  it("daftar memuat yang terbaru dulu; menghapus membuang baris dan berkasnya", async () => {
    const { png } = await detailedImage(100, 100);
    const first = (await read<{ media: Media }>(await upload(png, "a.png"))).media;
    await new Promise((r) => setTimeout(r, 5));
    const second = (await read<{ media: Media }>(await upload(png, "b.png"))).media;

    const list = await read<{ items: Media[] }>(await api.get("/media"));
    expect(list.items.map((m) => m.originalName)).toEqual(["b.png", "a.png"]);

    expect(existsSync(join(TEST_MEDIA_DIR, first.id, "large.webp"))).toBe(true);
    expect((await api.delete(`/media/${first.id}`)).status).toBe(200);
    expect(existsSync(join(TEST_MEDIA_DIR, first.id))).toBe(false);
    expect((await fetchVariant(first.id, "large.webp")).status).toBe(404);
    expect((await api.delete(`/media/${first.id}`)).status).toBe(404);

    const after = await read<{ items: Media[] }>(await api.get("/media"));
    expect(after.items.map((m) => m.id)).toEqual([second.id]);
  });

  it("daftar dan hapus memerlukan login", async () => {
    expect((await adminClient(app, "").get("/media")).status).toBe(401);
    expect(
      (await adminClient(app, "").delete("/media/00000000-0000-4000-8000-000000000000")).status,
    ).toBe(401);
  });
});
