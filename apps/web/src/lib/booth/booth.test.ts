import { uuid7 } from "@wedding/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activeFrames,
  type BoothPhotoRow,
  boothDb,
  getBoothMeta,
  nextPhotoNumber,
  PendingPhotosError,
  pairBooth,
  pendingPhotos,
  releaseBooth,
  savePhoto,
  setBoothMeta,
} from "./db.js";
import { coverCrop, FRAME_SPECS, formatPhotoNumber } from "./frames.js";
import { startBoothSync, syncBooth } from "./uploader.js";

describe("coverCrop", () => {
  it("memotong sisi kiri-kanan video 16:9 sama rata untuk jendela yang lebih sempit", () => {
    const crop = coverCrop({ width: 1920, height: 1080 }, { x: 0, y: 0, w: 1200, h: 1000 });
    expect(crop.h).toBe(1080);
    expect(crop.w).toBeCloseTo(1296);
    expect(crop.x).toBeCloseTo((1920 - 1296) / 2);
    expect(crop.y).toBe(0);
  });

  it("memotong atas-bawah bila jendela lebih lebar dari sumber", () => {
    const crop = coverCrop({ width: 1920, height: 1080 }, { x: 0, y: 0, w: 2000, h: 800 });
    expect(crop.w).toBe(1920);
    expect(crop.h).toBeCloseTo(768);
    expect(crop.y).toBeCloseTo((1080 - 768) / 2);
  });

  it("perbandingan potongan selalu sama dengan jendela setiap bingkai (foto tidak gepeng)", () => {
    for (const spec of Object.values(FRAME_SPECS)) {
      const { w, h } = spec.window;
      for (const src of [
        { width: 1920, height: 1080 },
        { width: 1280, height: 720 },
        { width: 640, height: 480 },
      ]) {
        const crop = coverCrop(src, spec.window);
        expect(crop.w / crop.h).toBeCloseTo(w / h, 5);
        expect(crop.x).toBeGreaterThanOrEqual(0);
        expect(crop.y).toBeGreaterThanOrEqual(0);
        expect(crop.x + crop.w).toBeLessThanOrEqual(src.width + 1e-6);
        expect(crop.y + crop.h).toBeLessThanOrEqual(src.height + 1e-6);
      }
    }
  });

  it("jendela foto ada di dalam kertas 1800×1200", () => {
    for (const { window: win } of Object.values(FRAME_SPECS)) {
      expect(win.x).toBeGreaterThan(0);
      expect(win.y).toBeGreaterThan(0);
      expect(win.x + win.w).toBeLessThan(1800);
      expect(win.y + win.h).toBeLessThan(1200);
    }
  });

  it("nomor foto 4 digit", () => {
    expect(formatPhotoNumber(7)).toBe("0007");
    expect(formatPhotoNumber(127)).toBe("0127");
  });
});

const photo = (overrides: Partial<BoothPhotoRow> = {}): BoothPhotoRow => ({
  id: uuid7(),
  blob: new Blob(["jpeg"], { type: "image/jpeg" }),
  frame: "poster",
  takenAt: new Date().toISOString(),
  number: 1,
  printCount: 0,
  ...overrides,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("penyimpanan dan unggah booth", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(async () => {
    await boothDb.photos.clear();
    await boothDb.meta.clear();
    await setBoothMeta("auth", { token: "tok", deviceId: uuid7(), deviceName: "Laptop Booth" });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("semua bingkai aktif sebelum pernah sinkron; nomor foto naik berurutan", async () => {
    expect(await activeFrames()).toEqual(["poster", "strip", "tiket"]);
    expect(await nextPhotoNumber()).toBe(1);
    expect(await nextPhotoNumber()).toBe(2);
  });

  it("mengunggah foto tertunda berurutan, menyimpan bingkai aktif, dan menandai terunggah", async () => {
    const first = photo({ takenAt: "2027-05-21T05:00:00.000Z", number: 1 });
    const second = photo({ takenAt: "2027-05-21T05:01:00.000Z", number: 2, frame: "tiket" });
    await savePhoto(second);
    await savePhoto(first);

    const sent: string[] = [];
    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/config")) return json(200, { config: { frames: ["tiket"] } });
      const form = init?.body as FormData;
      sent.push(String(form.get("id")));
      expect(form.get("file")).toBeInstanceOf(File);
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer tok");
      return json(201, { id: form.get("id"), duplicate: false });
    });

    const result = await syncBooth();
    expect(result).toEqual({ uploaded: 2, failed: 0, offline: false });
    expect(sent).toEqual([first.id, second.id]);
    expect(await pendingPhotos()).toEqual([]);
    expect(await getBoothMeta("frames")).toEqual(["tiket"]);
    // Foto tidak dihapus dari laptop setelah terunggah.
    expect(await boothDb.photos.count()).toBe(2);
  });

  it("startBoothSync tanpa callback tetap mengunggah (seperti dipakai halaman /booth)", async () => {
    await savePhoto(photo());
    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/config")) return json(200, { config: { frames: ["poster"] } });
      const form = init?.body as FormData;
      return json(201, { id: form.get("id"), duplicate: false });
    });

    const sync = startBoothSync();
    try {
      await vi.waitFor(async () => expect(await pendingPhotos()).toEqual([]));
    } finally {
      sync.stop();
    }
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/booth/photos",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("jaringan putus: berhenti tanpa kehilangan foto, lalu lanjut di putaran berikutnya", async () => {
    const row = photo();
    await savePhoto(row);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await syncBooth()).toMatchObject({ uploaded: 0, offline: true });
    expect((await pendingPhotos()).map((p) => p.id)).toEqual([row.id]);

    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith("/config")
        ? json(200, { config: { frames: ["poster"] } })
        : json(200, { id: row.id, duplicate: true }),
    );
    expect(await syncBooth()).toMatchObject({ uploaded: 1 });
    expect(await pendingPhotos()).toEqual([]);
  });

  it("foto yang ditolak server ditandai galatnya; foto lain tetap terunggah", async () => {
    const bad = photo({ takenAt: "2027-05-21T05:00:00.000Z" });
    const good = photo({ takenAt: "2027-05-21T05:01:00.000Z" });
    await savePhoto(bad);
    await savePhoto(good);
    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/config")) return json(200, { config: { frames: ["poster"] } });
      const id = (init?.body as FormData | undefined)?.get("id");
      return id === bad.id
        ? json(400, { error: { code: "VALIDATION_ERROR", message: "Berkas rusak" } })
        : json(201, { id, duplicate: false });
    });

    expect(await syncBooth()).toEqual({ uploaded: 1, failed: 1, offline: false });
    const [left] = await pendingPhotos();
    expect(left?.id).toBe(bad.id);
    expect(left?.uploadError).toBe("Berkas rusak");
  });

  it("perangkat dicabut: ditandai dan tidak mengunggah", async () => {
    await savePhoto(photo());
    fetchMock.mockResolvedValue(
      json(401, { error: { code: "DEVICE_REVOKED", message: "Perangkat dicabut" } }),
    );
    expect(await syncBooth()).toMatchObject({ uploaded: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await getBoothMeta("authError")).toBe("Perangkat dicabut");
    expect(await pendingPhotos()).toHaveLength(1);
  });

  it("perangkat bukan booth (403): ditandai, foto tidak ditandai gagal", async () => {
    const row = photo();
    await savePhoto(row);
    fetchMock.mockResolvedValue(
      json(403, { error: { code: "FORBIDDEN", message: "Bukan photobooth" } }),
    );
    await syncBooth();
    expect(await getBoothMeta("authError")).toBe("Bukan photobooth");
    expect((await pendingPhotos())[0]?.uploadError).toBeUndefined();
  });

  it("pairing ulang tidak menghapus foto yang belum terunggah, lalu foto itu terunggah", async () => {
    const row = photo();
    await savePhoto(row);
    await setBoothMeta("counter", 7);
    await setBoothMeta("authError", "Perangkat dicabut");

    await pairBooth({ token: "baru", deviceId: uuid7(), deviceName: "Laptop Booth 2" });
    expect(await getBoothMeta("authError")).toBeNull();
    expect(await getBoothMeta("counter")).toBe(7);
    expect((await pendingPhotos()).map((p) => p.id)).toEqual([row.id]);

    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).endsWith("/config")) return json(200, { config: { frames: ["poster"] } });
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer baru");
      return json(201, { id: row.id, duplicate: false });
    });
    expect(await syncBooth()).toMatchObject({ uploaded: 1 });
  });

  it("melepas booth ditolak selama masih ada foto yang belum terunggah", async () => {
    const row = photo();
    await savePhoto(row);
    await expect(releaseBooth()).rejects.toBeInstanceOf(PendingPhotosError);
    expect(await boothDb.photos.count()).toBe(1);
    expect(await getBoothMeta("auth")).toBeDefined();

    await boothDb.photos.update(row.id, { uploadedAt: Date.now() });
    await releaseBooth();
    expect(await boothDb.photos.count()).toBe(0);
    expect(await getBoothMeta("auth")).toBeUndefined();
  });
});
