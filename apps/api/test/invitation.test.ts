import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  Couple,
  CoupleProfile,
  Faq,
  GalleryItem,
  Gift,
  InvitationResponse,
  LayoutResponse,
  Media,
  StoryItem,
  Wish,
} from "@wedding/shared";
import { SECTION_KEYS } from "@wedding/shared";
import { inArray } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { media as mediaTable } from "../src/db/schema.js";
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

async function uploadPhoto(name = "foto.png"): Promise<Media> {
  const png = await sharp({
    create: { width: 240, height: 160, channels: 3, background: "#d8ff3e" },
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
  return (await read<{ media: Media }>(res)).media;
}

const onDisk = (media: Media) => existsSync(join(TEST_MEDIA_DIR, media.id, "large.webp"));
const mediaCount = async () =>
  (await read<{ items: Media[] }>(await api.get("/media"))).items.length;

const GROOM = { fullName: "Ramli Hidayat", nickname: "Ramli", instagram: "@Ramli.H" };

describe("profil mempelai", () => {
  it("menyimpan dan memperbarui profil per peran, dengan Instagram dinormalkan", async () => {
    const empty = await read<{ couple: Couple }>(await api.get("/invitation/couple"));
    expect(empty.couple).toEqual({ groom: null, bride: null });

    const saved = await api.put("/invitation/couple/groom", {
      ...GROOM,
      parents: "Putra dari Bpk. A & Ibu B",
      bio: "  Suka kopi.  ",
    });
    expect(saved.status).toBe(200);
    expect((await read<{ profile: CoupleProfile }>(saved)).profile).toMatchObject({
      role: "groom",
      fullName: "Ramli Hidayat",
      nickname: "Ramli",
      parents: "Putra dari Bpk. A & Ibu B",
      bio: "Suka kopi.",
      instagram: "ramli.h",
      photo: null,
    });

    await api.put("/invitation/couple/bride", { fullName: "Hasri Lestari" });
    const updated = await api.put("/invitation/couple/groom", { fullName: "Ramli H." });
    expect((await read<{ profile: CoupleProfile }>(updated)).profile).toMatchObject({
      fullName: "Ramli H.",
      nickname: null,
      instagram: null,
    });

    const both = await read<{ couple: Couple }>(await api.get("/invitation/couple"));
    expect(both.couple.groom?.fullName).toBe("Ramli H.");
    expect(both.couple.bride?.fullName).toBe("Hasri Lestari");
  });

  it("menolak nama kosong, Instagram ngawur, peran asing, dan memerlukan login", async () => {
    expect((await api.put("/invitation/couple/groom", { fullName: "  " })).status).toBe(400);
    expect(
      (await api.put("/invitation/couple/groom", { fullName: "A", instagram: "nama salah!" }))
        .status,
    ).toBe(400);
    expect((await api.put("/invitation/couple/penghulu", { fullName: "A" })).status).toBe(400);
    expect((await adminClient(app, "").get("/invitation/couple")).status).toBe(401);
  });

  it("memasang foto, lalu mengganti atau melepasnya menghapus foto lama dari disk", async () => {
    const first = await uploadPhoto("a.png");
    const withPhoto = await read<{ profile: CoupleProfile }>(
      await api.put("/invitation/couple/groom", { ...GROOM, photoMediaId: first.id }),
    );
    expect(withPhoto.profile.photo).toMatchObject({
      id: first.id,
      width: 240,
      height: 160,
      large: `/media/${first.id}/large.webp`,
    });

    const second = await uploadPhoto("b.png");
    await api.put("/invitation/couple/groom", { ...GROOM, photoMediaId: second.id });
    expect(onDisk(first)).toBe(false);
    expect(onDisk(second)).toBe(true);
    expect(await mediaCount()).toBe(1);

    await api.put("/invitation/couple/groom", { ...GROOM, photoMediaId: null });
    expect(onDisk(second)).toBe(false);
    expect(await mediaCount()).toBe(0);
  });

  it("menolak foto yang tidak ada atau sudah dipakai bagian lain", async () => {
    const missing = await api.put("/invitation/couple/groom", {
      ...GROOM,
      photoMediaId: "00000000-0000-4000-8000-000000000000",
    });
    expect(missing.status).toBe(400);

    const photo = await uploadPhoto();
    expect(
      (await api.put("/invitation/couple/groom", { ...GROOM, photoMediaId: photo.id })).status,
    ).toBe(200);
    const reuse = await api.put("/invitation/couple/bride", {
      fullName: "Hasri",
      photoMediaId: photo.id,
    });
    expect(reuse.status).toBe(409);
  });

  it("gambar yang masih dipakai tidak bisa dihapus lewat menu media", async () => {
    const photo = await uploadPhoto();
    await api.put("/invitation/couple/groom", { ...GROOM, photoMediaId: photo.id });
    expect((await api.delete(`/media/${photo.id}`)).status).toBe(409);
    expect(onDisk(photo)).toBe(true);
  });
});

describe("cerita", () => {
  const create = async (title: string, extra: Record<string, unknown> = {}) => {
    const res = await api.post("/invitation/story", { title, ...extra });
    expect(res.status).toBe(201);
    return (await read<{ item: StoryItem }>(res)).item;
  };
  const titles = async () =>
    (await read<{ items: StoryItem[] }>(await api.get("/invitation/story"))).items.map(
      (i) => i.title,
    );

  it("membuat butir baru di urutan paling akhir, dan memperbaruinya", async () => {
    const a = await create("Bertemu", { whenLabel: "2019", body: " Di kampus. " });
    await create("Lamaran", { whenLabel: "Mei 2026" });
    await create("Menikah");
    expect(await titles()).toEqual(["Bertemu", "Lamaran", "Menikah"]);
    expect(a).toMatchObject({ whenLabel: "2019", body: "Di kampus.", photo: null });

    const res = await api.put(`/invitation/story/${a.id}`, { title: "Pertama bertemu" });
    expect(res.status).toBe(200);
    expect((await read<{ item: StoryItem }>(res)).item).toMatchObject({
      title: "Pertama bertemu",
      whenLabel: null,
      body: "",
    });
    expect(await titles()).toEqual(["Pertama bertemu", "Lamaran", "Menikah"]);
  });

  it("mengatur urutan dari daftar id, dan menolak daftar yang tidak lengkap", async () => {
    const a = await create("A");
    const b = await create("B");
    const c = await create("C");

    const ok = await api.put("/invitation/story/order", { ids: [c.id, a.id, b.id] });
    expect(ok.status).toBe(200);
    expect((await read<{ items: StoryItem[] }>(ok)).items.map((i) => i.title)).toEqual([
      "C",
      "A",
      "B",
    ]);

    expect((await api.put("/invitation/story/order", { ids: [a.id, b.id] })).status).toBe(400);
    expect((await api.put("/invitation/story/order", { ids: [a.id, a.id, b.id] })).status).toBe(
      400,
    );
    expect((await api.put("/invitation/story/order", { ids: ["bukan-uuid"] })).status).toBe(400);
    expect(await titles()).toEqual(["C", "A", "B"]);

    // Butir baru tetap jatuh di akhir setelah diurutkan ulang.
    await create("D");
    expect(await titles()).toEqual(["C", "A", "B", "D"]);
  });

  it("menghapus butir ikut menghapus fotonya; 404 untuk yang tidak ada", async () => {
    const photo = await uploadPhoto();
    const item = await create("Dengan foto", { photoMediaId: photo.id });
    expect(item.photo?.id).toBe(photo.id);

    expect((await api.delete(`/invitation/story/${item.id}`)).status).toBe(200);
    expect(onDisk(photo)).toBe(false);
    expect(await mediaCount()).toBe(0);
    expect((await api.delete(`/invitation/story/${item.id}`)).status).toBe(404);
    expect((await api.put(`/invitation/story/${item.id}`, { title: "x" })).status).toBe(404);
  });

  it("menolak judul kosong, cerita terlalu panjang, dan memerlukan login", async () => {
    expect((await api.post("/invitation/story", { title: "  " })).status).toBe(400);
    expect(
      (await api.post("/invitation/story", { title: "A", body: "x".repeat(1501) })).status,
    ).toBe(400);
    expect((await adminClient(app, "").post("/invitation/story", { title: "A" })).status).toBe(401);
  });
});

describe("gambar yatim", () => {
  it("unggahan lama yang tidak dipakai disapu saat ada unggahan baru; yang dipakai tetap aman", async () => {
    const orphan = await uploadPhoto("yatim.png");
    const used = await uploadPhoto("dipakai.png");
    await api.put("/invitation/couple/groom", { ...GROOM, photoMediaId: used.id });
    const fresh = await uploadPhoto("baru-saja.png");

    // Mundurkan umur ketiganya melewati batas satu jam.
    const longAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await ctx.db
      .update(mediaTable)
      .set({ createdAt: longAgo })
      .where(inArray(mediaTable.id, [orphan.id, used.id]));

    await uploadPhoto("pemicu.png");
    expect(onDisk(orphan)).toBe(false);
    expect(onDisk(used)).toBe(true);
    // Yang baru diunggah (belum lewat satu jam) belum disapu, supaya sempat disimpan.
    expect(onDisk(fresh)).toBe(true);
    const ids = (await read<{ items: Media[] }>(await api.get("/media"))).items.map((m) => m.id);
    expect(ids).not.toContain(orphan.id);
    expect(ids).toContain(used.id);
  });
});

describe("isi undangan untuk tamu", () => {
  it("terbuka tanpa login dan memuat mempelai, cerita berurutan, dan foto", async () => {
    const photo = await uploadPhoto();
    await api.put("/invitation/couple/groom", { ...GROOM, photoMediaId: photo.id });
    await api.put("/invitation/couple/bride", { fullName: "Hasri Lestari" });
    await api.post("/invitation/story", { title: "Pertama", whenLabel: "2019" });
    await api.post("/invitation/story", { title: "Kedua" });

    const anonymous = ctx.makeApp();
    const res = await anonymous.request("/api/v1/public/invitation");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=30");
    const body = await read<InvitationResponse>(res);
    expect(body.couple.groom).toMatchObject({ fullName: "Ramli Hidayat", photo: { id: photo.id } });
    expect(body.couple.bride).toMatchObject({ fullName: "Hasri Lestari", photo: null });
    expect(body.story.map((s) => s.title)).toEqual(["Pertama", "Kedua"]);
  });

  it("kosong bila belum ada isi", async () => {
    const body = await read<InvitationResponse>(await app.request("/api/v1/public/invitation"));
    expect(body).toEqual({
      couple: { groom: null, bride: null },
      story: [],
      gallery: [],
      gifts: [],
      faqs: [],
      wishes: [],
      cover: { greeting: null, photo: null },
      sections: SECTION_KEYS.map((key) => ({ key, visible: true })),
      live: null,
      eventDate: null,
    });
  });
});

describe("galeri", () => {
  const add = async (caption?: string) => {
    const photo = await uploadPhoto();
    const res = await api.post("/invitation/gallery", { mediaId: photo.id, caption });
    return { photo, res };
  };
  const list = async () =>
    (await read<{ items: GalleryItem[] }>(await api.get("/invitation/gallery"))).items;

  it("menambah foto berurutan, mengubah keterangan, dan menampilkannya ke tamu", async () => {
    const first = await add("  Prewedding  ");
    expect(first.res.status).toBe(201);
    const a = (await read<{ item: GalleryItem }>(first.res)).item;
    expect(a).toMatchObject({ caption: "Prewedding", photo: { id: first.photo.id } });
    const b = (await read<{ item: GalleryItem }>((await add()).res)).item;
    expect(b.caption).toBeNull();

    const renamed = await api.put(`/invitation/gallery/${b.id}`, { caption: "Di pantai" });
    expect((await read<{ item: GalleryItem }>(renamed)).item.caption).toBe("Di pantai");
    expect((await list()).map((i) => i.id)).toEqual([a.id, b.id]);

    const res = await app.request("/api/v1/public/invitation");
    const body = await read<InvitationResponse>(res);
    expect(body.gallery.map((i) => i.id)).toEqual([a.id, b.id]);
  });

  it("mengatur urutan dan menolak daftar yang tidak lengkap", async () => {
    const a = (await read<{ item: GalleryItem }>((await add()).res)).item;
    const b = (await read<{ item: GalleryItem }>((await add()).res)).item;
    const ok = await api.put("/invitation/gallery/order", { ids: [b.id, a.id] });
    expect(ok.status).toBe(200);
    expect((await list()).map((i) => i.id)).toEqual([b.id, a.id]);
    expect((await api.put("/invitation/gallery/order", { ids: [a.id] })).status).toBe(400);
  });

  it("menghapus foto beserta berkasnya", async () => {
    const { photo, res } = await add();
    const item = (await read<{ item: GalleryItem }>(res)).item;
    expect(onDisk(photo)).toBe(true);
    expect((await api.delete(`/invitation/gallery/${item.id}`)).status).toBe(200);
    expect(onDisk(photo)).toBe(false);
    expect(await list()).toEqual([]);
    expect((await api.delete(`/invitation/gallery/${item.id}`)).status).toBe(404);
  });

  it("menolak gambar yang tidak ada atau sudah dipakai, dan gambar terpakai tidak bisa dihapus", async () => {
    const { photo } = await add();
    const again = await api.post("/invitation/gallery", { mediaId: photo.id });
    expect(again.status).toBe(409);
    const missing = await api.post("/invitation/gallery", {
      mediaId: "00000000-0000-4000-8000-000000000000",
    });
    expect(missing.status).toBe(400);
    expect((await api.delete(`/media/${photo.id}`)).status).toBe(409);
    expect((await adminClient(app, "").get("/invitation/gallery")).status).toBe(401);
  });
});

describe("amplop digital", () => {
  const BCA = {
    kind: "bank",
    provider: " BCA ",
    accountName: "Ramli Hidayat",
    accountNumber: "1234567890",
  };
  const create = async (body: object = BCA) =>
    read<{ item: Gift }>(await api.post("/invitation/gifts", body));
  const list = async () =>
    (await read<{ items: Gift[] }>(await api.get("/invitation/gifts"))).items;

  it("menambah, mengubah, mengurutkan, dan menampilkan ke tamu", async () => {
    const a = (await create()).item;
    expect(a).toMatchObject({ kind: "bank", provider: "BCA", qr: null });
    const b = (
      await create({
        kind: "ewallet",
        provider: "DANA",
        accountName: "Hasri",
        accountNumber: "0812",
      })
    ).item;

    const edited = await api.put(`/invitation/gifts/${b.id}`, {
      kind: "ewallet",
      provider: "GoPay",
      accountName: "Hasri L.",
      accountNumber: "0813",
    });
    expect((await read<{ item: Gift }>(edited)).item).toMatchObject({ provider: "GoPay" });

    expect((await api.put("/invitation/gifts/order", { ids: [b.id, a.id] })).status).toBe(200);
    expect((await list()).map((i) => i.id)).toEqual([b.id, a.id]);
    expect((await api.put("/invitation/gifts/order", { ids: [a.id] })).status).toBe(400);

    const body = await read<InvitationResponse>(await app.request("/api/v1/public/invitation"));
    expect(body.gifts.map((i) => i.id)).toEqual([b.id, a.id]);
  });

  it("menyimpan gambar QR, membersihkannya saat diganti atau dihapus", async () => {
    const qr1 = await uploadPhoto("qr1.png");
    const item = (await create({ ...BCA, kind: "ewallet", qrMediaId: qr1.id })).item;
    expect(item.qr?.id).toBe(qr1.id);
    expect((await api.post("/invitation/gifts", { ...BCA, qrMediaId: qr1.id })).status).toBe(409);

    const qr2 = await uploadPhoto("qr2.png");
    await api.put(`/invitation/gifts/${item.id}`, { ...BCA, kind: "ewallet", qrMediaId: qr2.id });
    expect(onDisk(qr1)).toBe(false);
    expect(onDisk(qr2)).toBe(true);

    expect((await api.delete(`/invitation/gifts/${item.id}`)).status).toBe(200);
    expect(onDisk(qr2)).toBe(false);
    expect((await api.delete(`/invitation/gifts/${item.id}`)).status).toBe(404);
  });

  it("menolak isian tidak lengkap, jenis asing, dan memerlukan login", async () => {
    expect((await api.post("/invitation/gifts", { ...BCA, accountNumber: " " })).status).toBe(400);
    expect((await api.post("/invitation/gifts", { ...BCA, kind: "kripto" })).status).toBe(400);
    expect((await adminClient(app, "").get("/invitation/gifts")).status).toBe(401);
  });
});

describe("FAQ", () => {
  const create = async (question = "Dress code?", answer = "Bebas rapi.") =>
    (await read<{ item: Faq }>(await api.post("/invitation/faqs", { question, answer }))).item;

  it("menambah, mengubah, mengurutkan, menghapus, dan menampilkan ke tamu", async () => {
    const a = await create();
    const b = await create("Parkir?", "  Tersedia.  ");
    expect(b.answer).toBe("Tersedia.");

    const edited = await api.put(`/invitation/faqs/${a.id}`, {
      question: "Pakaian?",
      answer: "Rapi",
    });
    expect((await read<{ item: Faq }>(edited)).item.question).toBe("Pakaian?");

    expect((await api.put("/invitation/faqs/order", { ids: [b.id, a.id] })).status).toBe(200);
    expect((await api.put("/invitation/faqs/order", { ids: [a.id] })).status).toBe(400);
    const body = await read<InvitationResponse>(await app.request("/api/v1/public/invitation"));
    expect(body.faqs.map((i) => i.id)).toEqual([b.id, a.id]);

    expect((await api.delete(`/invitation/faqs/${a.id}`)).status).toBe(200);
    expect((await api.delete(`/invitation/faqs/${a.id}`)).status).toBe(404);
  });

  it("menolak pertanyaan atau jawaban kosong dan memerlukan login", async () => {
    expect((await api.post("/invitation/faqs", { question: " ", answer: "x" })).status).toBe(400);
    expect((await api.post("/invitation/faqs", { question: "x", answer: "" })).status).toBe(400);
    expect((await adminClient(app, "").get("/invitation/faqs")).status).toBe(401);
  });
});

describe("wishlist", () => {
  const create = async (body: object = { name: "Rice cooker" }) =>
    read<{ item: Wish }>(await api.post("/invitation/wishes", body));

  it("menyimpan hadiah, menandai terpenuhi, mengurutkan, dan menampilkan ke tamu", async () => {
    const a = (await create({ name: "Rice cooker", url: "https://toko.example/rc" })).item;
    expect(a).toMatchObject({
      url: "https://toko.example/rc",
      quantity: 1,
      claimed: 0,
      isFulfilled: false,
      photo: null,
    });
    const b = (await create()).item;

    const edited = await api.put(`/invitation/wishes/${a.id}`, {
      name: "Rice cooker",
      quantity: 2,
    });
    expect((await read<{ item: Wish }>(edited)).item).toMatchObject({
      quantity: 2,
      isFulfilled: false,
      url: null,
    });

    expect((await api.put("/invitation/wishes/order", { ids: [b.id, a.id] })).status).toBe(200);
    expect((await api.put("/invitation/wishes/order", { ids: [a.id] })).status).toBe(400);
    const body = await read<InvitationResponse>(await app.request("/api/v1/public/invitation"));
    expect(body.wishes.map((i) => i.id)).toEqual([b.id, a.id]);
  });

  it("menolak jumlah dibutuhkan yang tidak masuk akal", async () => {
    const gelas = (await create({ name: "Gelas", quantity: 6 })).item;
    expect(gelas).toMatchObject({ quantity: 6, claimed: 0, isFulfilled: false });
    const put = (body: object) => api.put(`/invitation/wishes/${gelas.id}`, body);
    expect((await put({ name: "Gelas", quantity: 0 })).status).toBe(400);
    expect((await put({ name: "Gelas", quantity: 100 })).status).toBe(400);
  });

  it("menyimpan foto, membersihkannya saat diganti atau dihapus", async () => {
    const p1 = await uploadPhoto("a.png");
    const item = (await create({ name: "Blender", photoMediaId: p1.id })).item;
    expect(item.photo?.id).toBe(p1.id);
    expect((await api.post("/invitation/wishes", { name: "X", photoMediaId: p1.id })).status).toBe(
      409,
    );

    const p2 = await uploadPhoto("b.png");
    await api.put(`/invitation/wishes/${item.id}`, { name: "Blender", photoMediaId: p2.id });
    expect(onDisk(p1)).toBe(false);
    expect((await api.delete(`/invitation/wishes/${item.id}`)).status).toBe(200);
    expect(onDisk(p2)).toBe(false);
  });

  it("menolak nama kosong, tautan bukan http(s), dan memerlukan login", async () => {
    expect((await api.post("/invitation/wishes", { name: " " })).status).toBe(400);
    expect(
      (await api.post("/invitation/wishes", { name: "X", url: "javascript:alert(1)" })).status,
    ).toBe(400);
    expect((await api.post("/invitation/wishes", { name: "X", url: "bukan url" })).status).toBe(
      400,
    );
    expect((await adminClient(app, "").get("/invitation/wishes")).status).toBe(401);
  });
});

describe("sampul dan susunan bagian", () => {
  const sections = async () =>
    (await read<LayoutResponse>(await api.get("/invitation/layout"))).sections;

  it("bawaan: semua bagian tampil dengan urutan standar", async () => {
    const layout = await read<LayoutResponse>(await api.get("/invitation/layout"));
    expect(layout.cover).toEqual({ greeting: null, photo: null });
    expect(layout.sections.map((s) => s.key)).toEqual([...SECTION_KEYS]);
    expect(layout.sections.every((s) => s.visible)).toBe(true);
  });

  it("menyimpan urutan dan menyembunyikan bagian, lalu tamu menerimanya", async () => {
    const next = [...SECTION_KEYS].reverse().map((key) => ({ key, visible: key !== "faq" }));
    const res = await api.put("/invitation/sections", { items: next });
    expect(res.status).toBe(200);
    expect(await sections()).toEqual(next);

    const body = await read<InvitationResponse>(await app.request("/api/v1/public/invitation"));
    expect(body.sections).toEqual(next);
  });

  it("menolak susunan yang tidak lengkap, ganda, atau berisi bagian asing", async () => {
    const all = SECTION_KEYS.map((key) => ({ key, visible: true }));
    expect((await api.put("/invitation/sections", { items: all.slice(1) })).status).toBe(400);
    expect(
      (await api.put("/invitation/sections", { items: [...all.slice(1), all[1]] })).status,
    ).toBe(400);
    expect(
      (
        await api.put("/invitation/sections", {
          items: [...all.slice(1), { key: "musik", visible: true }],
        })
      ).status,
    ).toBe(400);
    expect((await adminClient(app, "").put("/invitation/sections", { items: all })).status).toBe(
      401,
    );
  });

  it("menyimpan sampul, mengganti foto dengan pembersihan, dan mengirim tanggal acara", async () => {
    const p1 = await uploadPhoto("sampul1.png");
    const saved = await api.put("/invitation/cover", {
      greeting: "  Bismillah  ",
      photoMediaId: p1.id,
    });
    expect(saved.status).toBe(200);
    expect(
      (await read<{ cover: { greeting: string; photo: { id: string } } }>(saved)).cover,
    ).toMatchObject({
      greeting: "Bismillah",
      photo: { id: p1.id },
    });
    // Menyimpan ulang dengan foto yang sama tidak dianggap "sudah dipakai".
    expect((await api.put("/invitation/cover", { photoMediaId: p1.id })).status).toBe(200);

    const p2 = await uploadPhoto("sampul2.png");
    await api.put("/invitation/cover", { greeting: "Halo", photoMediaId: p2.id });
    expect(onDisk(p1)).toBe(false);
    expect(onDisk(p2)).toBe(true);

    await api.post("/events", {
      slug: "resepsi",
      name: "Resepsi",
      startsAt: "2027-05-21T03:00:00Z",
      endsAt: "2027-05-21T07:00:00Z",
    });
    const body = await read<InvitationResponse>(await app.request("/api/v1/public/invitation"));
    expect(body.eventDate).toBe("2027-05-21T03:00:00.000Z");
    expect(body.cover.photo?.id).toBe(p2.id);

    // Foto sampul tidak bisa dipakai bagian lain.
    expect((await api.post("/invitation/gallery", { mediaId: p2.id })).status).toBe(409);
    expect((await api.delete(`/media/${p2.id}`)).status).toBe(409);
  });
});

describe("siaran langsung", () => {
  const save = (body: Record<string, unknown>) => api.put("/invitation/live", body);
  const layout = async () => read<LayoutResponse>(await api.get("/invitation/layout"));
  const publicLive = async () =>
    (await read<InvitationResponse>(await app.request("/api/v1/public/invitation"))).live;

  it("menyimpan tautan https, menampilkannya ke tamu, dan menghapusnya dengan mengosongkan", async () => {
    expect((await layout()).live).toBeNull();
    expect(await publicLive()).toBeNull();

    const res = await save({ url: "  https://youtube.com/live/abc  ", note: " Mulai 10.00 WIB " });
    expect(res.status).toBe(200);
    const expected = { url: "https://youtube.com/live/abc", note: "Mulai 10.00 WIB" };
    expect(await publicLive()).toEqual(expected);
    expect((await layout()).live).toEqual(expected);

    await save({ url: "", note: "sisa keterangan" });
    expect(await publicLive()).toBeNull();
    // Keterangan tanpa tautan tidak disimpan.
    await save({ url: "https://youtu.be/x" });
    expect((await publicLive())?.note).toBeNull();
  });

  it("menolak tautan bukan https dan memerlukan login", async () => {
    for (const url of [
      "http://youtube.com/x",
      "javascript:alert(1)",
      "youtube.com/x",
      "ftp://x.id/y",
    ]) {
      expect((await save({ url })).status).toBe(400);
    }
    expect((await save({ url: "https://x.id", note: "n".repeat(301) })).status).toBe(400);
    expect(
      (await adminClient(app, "").put("/invitation/live", { url: "https://x.id" })).status,
    ).toBe(401);
  });

  it("tidak menimpa sampul, dan menyimpan sampul tidak menghapus siaran", async () => {
    await api.put("/invitation/cover", { greeting: "Bismillah" });
    await save({ url: "https://youtu.be/x" });
    expect((await layout()).cover.greeting).toBe("Bismillah");
    await api.put("/invitation/cover", { greeting: "Halo" });
    expect((await publicLive())?.url).toBe("https://youtu.be/x");
  });
});
