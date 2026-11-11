import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  type BoothPhotoListResponse,
  type Device,
  type GuestPhotoResponse,
  SYNC_PROTOCOL_VERSION,
  SYNC_VERSION_HEADER,
} from "@wedding/shared";
import { unzipSync } from "fflate";
import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { type adminClient, createTestContext, loggedInClient, TEST_MEDIA_DIR } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());

type App = ReturnType<typeof ctx.makeApp>;
let app: App;
let api: ReturnType<typeof adminClient>;

const read = async <T>(res: Response) => (await res.json()) as T;

beforeEach(async () => {
  api = await loggedInClient(ctx);
  app = ctx.makeApp();
});

async function pairBooth(name = "Laptop Booth", kind: "booth" | "scanner" | null = "booth") {
  const created = await read<{ pairingCode: string; device: Device }>(
    await api.post("/devices", { name, kind: kind ?? "scanner" }),
  );
  const paired = await app.request("/api/v1/device/pair", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [SYNC_VERSION_HEADER]: String(SYNC_PROTOCOL_VERSION),
    },
    body: JSON.stringify(
      kind ? { code: created.pairingCode, kind } : { code: created.pairingCode },
    ),
  });
  expect(paired.status).toBe(200);
  const { token } = await read<{ token: string }>(paired);
  return { id: created.device.id, token };
}

const photo = () =>
  sharp({
    create: { width: 1800, height: 1200, channels: 3, background: { r: 120, g: 90, b: 70 } },
  })
    .jpeg({ quality: 92 })
    .toBuffer();

async function upload(
  token: string,
  fields: Record<string, string>,
  file: Buffer | null = null,
): Promise<Response> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  if (file) form.append("file", new File([new Uint8Array(file)], "foto.jpg"));
  return app.request("/api/v1/booth/photos", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

const ID = "0190f4c2-6b1e-7a3c-9d2e-1f2a3b4c5d6e";
const meta = { id: ID, frame: "poster", takenAt: "2027-05-21T05:12:00.000Z" };

describe("photobooth", () => {
  it("bawaan semua bingkai aktif; admin bisa memilih sebagian", async () => {
    const { token } = await pairBooth();
    const config = () =>
      app.request("/api/v1/booth/config", { headers: { authorization: `Bearer ${token}` } });

    expect((await read<{ config: { frames: string[] } }>(await config())).config.frames).toEqual([
      "poster",
      "strip",
      "tiket",
    ]);

    const saved = await api.put("/booth/config", { frames: ["tiket", "poster", "tiket"] });
    expect(saved.status).toBe(200);
    // Urutan mengikuti urutan bawaan dan tanpa duplikat.
    expect((await read<{ config: { frames: string[] } }>(saved)).config.frames).toEqual([
      "poster",
      "tiket",
    ]);
    expect((await read<{ config: { frames: string[] } }>(await config())).config.frames).toEqual([
      "poster",
      "tiket",
    ]);

    expect((await api.put("/booth/config", { frames: [] })).status).toBe(400);

    expect((await api.put("/booth/config", { frames: ["polaroid"] })).status).toBe(400);
  });

  it("menyimpan foto sekali walau dikirim ulang, lalu tampil di admin", async () => {
    const { token } = await pairBooth();
    const file = await photo();

    const first = await upload(token, meta, file);
    expect(first.status).toBe(201);
    expect(await read(first)).toEqual({ id: ID, duplicate: false });

    const again = await upload(token, meta, file);
    expect(again.status).toBe(200);
    expect(await read(again)).toEqual({ id: ID, duplicate: true });

    const list = await read<BoothPhotoListResponse>(await api.get("/booth/photos"));
    expect(list.total).toBe(1);
    const [item] = list.items;
    expect(item).toMatchObject({
      id: ID,
      frame: "poster",
      takenAt: meta.takenAt,
      deviceName: "Laptop Booth",
    });
    // Resolusi hasil booth dipertahankan (4R 300 dpi).
    expect(item?.media).toMatchObject({ width: 1800, height: 1200 });
    expect((await app.request(item?.media.large ?? "")).status).toBe(200);
  });

  it("menolak tanpa token, perangkat dicabut, dan data yang tidak lengkap", async () => {
    const booth = await pairBooth();
    const file = await photo();

    expect((await upload("", meta, file)).status).toBe(401);
    expect((await upload(booth.token, { ...meta, frame: "polaroid" }, file)).status).toBe(400);
    expect((await upload(booth.token, { ...meta, id: "bukan-uuid" }, file)).status).toBe(400);
    expect((await upload(booth.token, meta, null)).status).toBe(400);
    expect((await upload(booth.token, meta, Buffer.from("bukan gambar"))).status).toBe(400);

    await api.post(`/devices/${booth.id}/revoke`);
    const revoked = await upload(booth.token, meta, file);
    expect(revoked.status).toBe(401);
    expect((await read<{ error: { code: string } }>(revoked)).error.code).toBe("DEVICE_REVOKED");
    expect((await read<BoothPhotoListResponse>(await api.get("/booth/photos"))).total).toBe(0);
  });

  it("admin menghapus foto beserta berkasnya; foto tetap ada setelah perangkat dihapus", async () => {
    const booth = await pairBooth();
    await upload(booth.token, meta, await photo());
    const second = { ...meta, id: "0190f4c2-6b1e-7a3c-9d2e-1f2a3b4c5d6f", frame: "strip" };
    await upload(booth.token, second, await photo());

    const before = await read<BoothPhotoListResponse>(await api.get("/booth/photos"));
    expect(before.total).toBe(2);
    const target = before.items.find((item) => item.id === ID);
    expect(target).toBeDefined();
    const folder = join(TEST_MEDIA_DIR, target?.media.id ?? "");
    expect(existsSync(folder)).toBe(true);

    expect((await api.delete(`/booth/photos/${ID}`)).status).toBe(200);
    expect(existsSync(folder)).toBe(false);
    expect((await api.delete(`/booth/photos/${ID}`)).status).toBe(404);

    // Gambar milik foto booth tidak boleh dihapus lewat menu media.
    const rest = await read<BoothPhotoListResponse>(await api.get("/booth/photos"));
    expect((await api.delete(`/media/${rest.items[0]?.media.id}`)).status).toBe(409);

    await api.post(`/devices/${booth.id}/revoke`);
    expect((await api.delete(`/devices/${booth.id}`)).status).toBe(200);
    const after = await read<BoothPhotoListResponse>(await api.get("/booth/photos"));
    expect(after.items).toHaveLength(1);
    expect(after.items[0]?.deviceName).toBeNull();
  });

  it("token booth tidak bisa menarik data tamu, token scanner tidak bisa mengunggah foto", async () => {
    const booth = await pairBooth();
    const snapshot = await app.request("/api/v1/sync/snapshot", {
      headers: {
        authorization: `Bearer ${booth.token}`,
        [SYNC_VERSION_HEADER]: String(SYNC_PROTOCOL_VERSION),
      },
    });
    expect(snapshot.status).toBe(403);
    expect((await read<{ error: { code: string } }>(snapshot)).error.code).toBe("FORBIDDEN");

    // Klien scanner lama tidak mengirim `kind`: tetap terpasang sebagai scanner.
    const scanner = await pairBooth("HP Pintu", null);
    const rejected = await upload(scanner.token, meta, await photo());
    expect(rejected.status).toBe(403);
    expect(
      (
        await app.request("/api/v1/booth/config", {
          headers: { authorization: `Bearer ${scanner.token}` },
        })
      ).status,
    ).toBe(403);

    const devices = await read<{ items: Device[] }>(await api.get("/devices"));
    expect(Object.fromEntries(devices.items.map((d) => [d.name, d.kind]))).toEqual({
      "Laptop Booth": "booth",
      "HP Pintu": "scanner",
    });
  });

  it("kode hanya bisa dipasang sebagai jenis yang dipilih admin", async () => {
    const pair = (code: string, kind?: "booth" | "scanner") =>
      app.request("/api/v1/device/pair", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [SYNC_VERSION_HEADER]: String(SYNC_PROTOCOL_VERSION),
        },
        body: JSON.stringify(kind ? { code, kind } : { code }),
      });
    const booth = await read<{ pairingCode: string }>(
      await api.post("/devices", { name: "Laptop Booth", kind: "booth" }),
    );
    // Kode booth dipakai di /scan/pasang (klien lama tanpa kind = scanner): ditolak, kode tetap berlaku.
    const wrong = await pair(booth.pairingCode);
    expect(wrong.status).toBe(409);
    expect((await read<{ error: { message: string } }>(wrong)).error.message).toContain(
      "/booth/pasang",
    );
    expect((await pair(booth.pairingCode, "booth")).status).toBe(200);

    const scanner = await read<{ pairingCode: string }>(
      await api.post("/devices", { name: "HP Pintu" }),
    );
    expect((await pair(scanner.pairingCode, "booth")).status).toBe(409);
    expect((await pair(scanner.pairingCode, "scanner")).status).toBe(200);
  });

  it("tamu membuka fotonya lewat QR: /public/foto/:id", async () => {
    const booth = await pairBooth();
    const guestPhoto = (id: string) => app.request(`/api/v1/public/foto/${id}`);

    // Belum terunggah (booth offline): 404, halaman tamu menunggu.
    expect((await guestPhoto(ID)).status).toBe(404);
    expect((await upload(booth.token, meta, await photo())).status).toBe(201);

    const found = await read<GuestPhotoResponse>(await guestPhoto(ID));
    expect(found.photo.id).toBe(ID);
    expect(found.photo.media.large).toMatch(/^\/media\/.+\/large\.webp$/);
    expect((await guestPhoto("bukan-uuid")).status).toBe(400);

    // Menunggu foto yang belum terunggah tidak memblokir tamu lain di IP yang sama.
    const other = "0190f4c2-6b1e-7a3c-9d2e-1f2a3b4c5d00";
    for (let i = 0; i < 150; i++) expect((await guestPhoto(other)).status).toBe(404);
    expect((await guestPhoto(ID)).status).toBe(200);

    // Dihapus admin: 410 (bukan "belum terunggah"), dan booth tidak bisa mengunggahnya ulang.
    expect((await api.delete(`/booth/photos/${ID}`)).status).toBe(200);
    expect((await guestPhoto(ID)).status).toBe(410);
    const again = await upload(booth.token, meta, await photo());
    expect(await read<{ duplicate: boolean }>(again)).toMatchObject({ duplicate: true });
    expect((await guestPhoto(ID)).status).toBe(410);

    // Booth menerima alamat situs untuk QR; admin tidak memerlukannya.
    await api.put("/settings", {
      groomName: "Mohamad Rizal Ramli",
      brideName: "Hasri Wiji Aqsari",
      publicBaseUrl: "https://hasriramli.com",
    });
    const config = await app.request("/api/v1/booth/config", {
      headers: { authorization: `Bearer ${booth.token}` },
    });
    expect((await read<{ config: { photoBaseUrl: string } }>(config)).config.photoBaseUrl).toBe(
      "https://hasriramli.com",
    );
  });

  it("admin mengunduh semua foto booth sebagai ZIP", async () => {
    const booth = await pairBooth();
    await upload(booth.token, meta, await photo());
    await upload(
      booth.token,
      { ...meta, id: "0190f4c2-6b1e-7a3c-9d2e-1f2a3b4c5d6f", takenAt: "2027-05-21T05:13:00.000Z" },
      await photo(),
    );

    const res = await api.get("/booth/photos.zip");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    const entries = unzipSync(new Uint8Array(await res.arrayBuffer()));
    // Waktu di nama berkas dalam WIB (UTC+7), urut waktu foto.
    expect(Object.keys(entries)).toEqual([
      "photobooth-2027-05-21_12-12-00-3b4c5d6e.webp",
      "photobooth-2027-05-21_12-13-00-3b4c5d6f.webp",
    ]);
    expect(Object.values(entries)[0]?.length).toBeGreaterThan(0);
  });

  it("admin wajib login", async () => {
    expect((await app.request("/api/v1/admin/booth/photos")).status).toBe(401);
    expect((await app.request("/api/v1/admin/booth/photos.zip")).status).toBe(401);
  });
});
