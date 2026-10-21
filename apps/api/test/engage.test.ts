import type {
  AdminGuestbookEntry,
  Dashboard,
  GuestbookEntry,
  RsvpListResponse,
  TicketResponse,
} from "@wedding/shared";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adminClient, createTestContext, loggedInClient } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());

type App = ReturnType<typeof ctx.makeApp>;
type Api = ReturnType<typeof adminClient>;

let api: Api;
let app: App;

const read = async <T>(res: Response) => (await res.json()) as T;

function publicCall(target: App, method: string, path: string, body?: unknown) {
  return target.request(`/api/v1/public${path}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const pub = {
  get: (path: string) => publicCall(app, "GET", path),
  post: (path: string, body: unknown) => publicCall(app, "POST", path, body),
};

async function createGuest(overrides: Record<string, unknown>) {
  const res = await api.post("/guests", { phone: "0812-3456-7890", ...overrides });
  expect(res.status).toBe(201);
  return (await read<{ guest: { id: string; code: string } }>(res)).guest;
}

// Jam sesi Surabaya di resepsi: 21 Mei 2027, 10.00–12.00 WIB.
const SESSION = { startsAt: "2027-05-21T03:00:00Z", endsAt: "2027-05-21T05:00:00Z" };

async function setup() {
  api = await loggedInClient(ctx);
  app = ctx.makeApp();

  await api.put("/settings", {
    groomName: "Ramli",
    brideName: "Hasri",
    publicBaseUrl: "https://contoh.com",
  });
  const akad = (
    await read<{ event: { id: string } }>(
      await api.post("/events", {
        slug: "akad",
        name: "Akad",
        startsAt: "2027-05-21T01:00:00Z",
        endsAt: "2027-05-21T02:00:00Z",
        venueName: "Masjid Raya",
      }),
    )
  ).event;
  const resepsi = (
    await read<{ event: { id: string } }>(
      await api.post("/events", {
        slug: "resepsi",
        name: "Resepsi",
        startsAt: "2027-05-21T03:00:00Z",
        endsAt: "2027-05-21T07:00:00Z",
        checkinEnabled: true,
        hasRsvp: true,
      }),
    )
  ).event;
  const group = (
    await read<{ group: { id: string } }>(
      await api.post("/groups", {
        name: "Surabaya",
        sessions: [{ eventId: resepsi.id, ...SESSION }],
      }),
    )
  ).group;

  const budi = await createGuest({
    displayName: "Bpk. Budi & Keluarga",
    isRombongan: true,
    groupId: group.id,
    eventIds: [akad.id, resepsi.id],
  });
  const sari = await createGuest({
    displayName: "Sari",
    phone: "0813-0000-0001",
    eventIds: [resepsi.id],
  });
  const outsider = await createGuest({
    displayName: "Hanya Akad",
    phone: "0813-0000-0002",
    eventIds: [akad.id],
  });
  return { akad, resepsi, group, budi, sari, outsider };
}

let world: Awaited<ReturnType<typeof setup>>;
beforeEach(async () => {
  world = await setup();
});

describe("tiket publik", () => {
  it("memuat tamu, acara yang diundang, jam sesi kelompok, dan nama mempelai, tanpa HP", async () => {
    const res = await pub.get(`/ticket/${world.budi.code}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await read<TicketResponse>(res);

    expect(body.guest).toEqual({
      code: world.budi.code,
      displayName: "Bpk. Budi & Keluarga",
      isRombongan: true,
      groupName: "Surabaya",
    });
    expect(body.couple).toEqual({ groomName: "Ramli", brideName: "Hasri" });
    expect(body.events.map((e) => e.name)).toEqual(["Akad", "Resepsi"]);
    expect(body.events[0]).toMatchObject({
      venueName: "Masjid Raya",
      session: null,
      hasRsvp: false,
    });
    expect(body.events[1]).toMatchObject({
      checkinEnabled: true,
      hasRsvp: true,
      session: { startsAt: "2027-05-21T03:00:00.000Z", endsAt: "2027-05-21T05:00:00.000Z" },
      rsvp: null,
    });
    expect(JSON.stringify(body)).not.toMatch(/0812|phone|instagram/i);
  });

  it("hanya menampilkan acara yang diundang, dan menerima kode huruf kecil", async () => {
    const body = await read<TicketResponse>(
      await pub.get(`/ticket/${world.outsider.code.toLowerCase()}`),
    );
    expect(body.events.map((e) => e.name)).toEqual(["Akad"]);
  });

  it("404 untuk kode tak dikenal atau tamu yang sudah dihapus; 400 untuk kode cacat", async () => {
    expect((await pub.get("/ticket/ZZZZZZ")).status).toBe(404);
    expect((await pub.get("/ticket/abc")).status).toBe(400);
    await api.delete(`/guests/${world.sari.id}`);
    expect((await pub.get(`/ticket/${world.sari.code}`)).status).toBe(404);
  });

  it("memblokir IP yang menebak banyak kode salah (429), tanpa mengganggu IP lain", async () => {
    const attacker = ctx.makeApp();
    for (let i = 0; i < 30; i++) {
      expect((await publicCall(attacker, "GET", "/ticket/ZZZZZZ")).status).toBe(404);
    }
    expect((await publicCall(attacker, "GET", "/ticket/ZZZZZZ")).status).toBe(429);
    // Bahkan kode yang benar ikut ditolak selama diblokir.
    expect((await publicCall(attacker, "GET", `/ticket/${world.sari.code}`)).status).toBe(429);
  });
});

describe("RSVP", () => {
  const rsvp = (code: string, eventId: string, extra: Record<string, unknown>) =>
    pub.post("/rsvp", { code, eventId, ...extra });

  it("tamu rombongan menyimpan jumlah orang; tamu biasa selalu 1; tidak hadir = 0", async () => {
    const { budi, sari, resepsi } = world;

    const group = await rsvp(budi.code, resepsi.id, { status: "hadir", pax: 4 });
    expect(group.status).toBe(200);
    expect(await read(group)).toEqual({ rsvp: { status: "hadir", pax: 4 } });

    const single = await rsvp(sari.code, resepsi.id, { status: "hadir", pax: 9 });
    expect(await read(single)).toEqual({ rsvp: { status: "hadir", pax: 1 } });

    const declined = await rsvp(budi.code, resepsi.id, { status: "tidak_hadir", pax: 4 });
    expect(await read(declined)).toEqual({ rsvp: { status: "tidak_hadir", pax: 0 } });
  });

  it("jawaban bisa diubah dan tampil di tiket", async () => {
    const { budi, resepsi } = world;
    await rsvp(budi.code, resepsi.id, { status: "ragu" });
    await rsvp(budi.code, resepsi.id, { status: "hadir", pax: 3 });

    const ticket = await read<TicketResponse>(await pub.get(`/ticket/${budi.code}`));
    expect(ticket.events.find((e) => e.id === resepsi.id)?.rsvp).toEqual({
      status: "hadir",
      pax: 3,
    });
  });

  it("menolak acara tanpa RSVP, acara yang tidak diundang, status ngawur, dan kode asing", async () => {
    const { budi, sari, akad, resepsi, outsider } = world;
    expect((await rsvp(budi.code, akad.id, { status: "hadir" })).status).toBe(400);
    expect((await rsvp(outsider.code, resepsi.id, { status: "hadir" })).status).toBe(400);
    expect((await rsvp(sari.code, resepsi.id, { status: "mungkin" })).status).toBe(400);
    expect((await rsvp("ZZZZZZ", resepsi.id, { status: "hadir" })).status).toBe(404);
    expect((await rsvp(budi.code, resepsi.id, { status: "hadir", pax: 0 })).status).toBe(400);
  });

  it("membatasi jumlah kiriman per IP", async () => {
    const spammer = ctx.makeApp();
    const send = () =>
      publicCall(spammer, "POST", "/rsvp", {
        code: world.sari.code,
        eventId: world.resepsi.id,
        status: "hadir",
      });
    for (let i = 0; i < 20; i++) expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(429);
  });
});

describe("ucapan publik", () => {
  const post = (code: string, extra: Record<string, unknown>) =>
    pub.post("/guestbook", { code, ...extra });

  it("menyimpan ucapan dengan nama undangan bawaan atau nama pilihan sendiri", async () => {
    const a = await post(world.sari.code, { message: "  Selamat menempuh hidup baru!  " });
    expect(a.status).toBe(201);
    expect((await read<{ entry: GuestbookEntry }>(a)).entry).toMatchObject({
      name: "Sari",
      message: "Selamat menempuh hidup baru!",
      reply: null,
    });
    const b = await post(world.budi.code, { name: "Keluarga Budi", message: "Barakallah" });
    expect((await read<{ entry: GuestbookEntry }>(b)).entry.name).toBe("Keluarga Budi");
  });

  it("daftar publik terbaru dulu, berhalaman, menampilkan balasan, dan menyembunyikan yang disembunyikan", async () => {
    for (const message of ["satu", "dua", "tiga"]) {
      await post(world.sari.code, { message });
      await new Promise((r) => setTimeout(r, 5));
    }
    const all = await read<{ items: GuestbookEntry[]; total: number }>(await pub.get("/guestbook"));
    expect(all.items.map((e) => e.message)).toEqual(["tiga", "dua", "satu"]);
    expect(all.total).toBe(3);

    const page2 = await read<{ items: GuestbookEntry[] }>(
      await pub.get("/guestbook?page=2&pageSize=2"),
    );
    expect(page2.items.map((e) => e.message)).toEqual(["satu"]);

    const target = all.items[0] as GuestbookEntry;
    await api.post(`/guestbook/${target.id}/reply`, { reply: "Terima kasih!" });
    await api.post(`/guestbook/${all.items[1]?.id}/hide`, { hidden: true });

    const after = await read<{ items: GuestbookEntry[]; total: number }>(
      await pub.get("/guestbook"),
    );
    expect(after.total).toBe(2);
    expect(after.items.map((e) => e.message)).toEqual(["tiga", "satu"]);
    expect(after.items[0]).toMatchObject({ reply: "Terima kasih!" });
    expect(after.items[0]?.repliedAt).not.toBeNull();
  });

  it("menolak ucapan kosong, terlalu panjang, dan dari kode asing", async () => {
    expect((await post(world.sari.code, { message: "   " })).status).toBe(400);
    expect((await post(world.sari.code, { message: "x".repeat(501) })).status).toBe(400);
    expect((await post(world.sari.code, { message: "a", name: "n".repeat(81) })).status).toBe(400);
    expect((await post("ZZZZZZ", { message: "halo" })).status).toBe(404);
  });
});

describe("admin: RSVP", () => {
  it("merekap hadir, tidak hadir, belum pasti, dan belum menjawab dengan jumlah orang", async () => {
    const { budi, sari, resepsi } = world;
    await pub.post("/rsvp", { code: budi.code, eventId: resepsi.id, status: "hadir", pax: 4 });
    const spare = await createGuest({
      displayName: "Dewi",
      phone: "0813-0000-0003",
      eventIds: [resepsi.id],
    });
    await pub.post("/rsvp", { code: spare.code, eventId: resepsi.id, status: "tidak_hadir" });
    await pub.post("/rsvp", { code: sari.code, eventId: resepsi.id, status: "ragu" });
    await createGuest({ displayName: "Eko", phone: "0813-0000-0004", eventIds: [resepsi.id] });

    const res = await api.get("/rsvps");
    expect(res.status).toBe(200);
    const body = await read<RsvpListResponse>(res);
    expect(body.event).toEqual({ id: resepsi.id, name: "Resepsi" });
    expect(body.totals).toEqual({
      invited: 4,
      hadir: 1,
      hadirPax: 4,
      tidakHadir: 1,
      ragu: 1,
      belum: 1,
    });
    const budiRow = body.items.find((r) => r.guestId === budi.id);
    expect(budiRow).toMatchObject({
      displayName: "Bpk. Budi & Keluarga",
      groupName: "Surabaya",
      isRombongan: true,
      status: "hadir",
      pax: 4,
    });
    expect(body.items.find((r) => r.displayName === "Eko")).toMatchObject({
      status: null,
      pax: null,
      submittedAt: null,
    });
  });

  it("tamu yang dihapus tidak ikut dihitung", async () => {
    await pub.post("/rsvp", {
      code: world.sari.code,
      eventId: world.resepsi.id,
      status: "hadir",
    });
    await api.delete(`/guests/${world.sari.id}`);
    const body = await read<RsvpListResponse>(await api.get(`/rsvps?eventId=${world.resepsi.id}`));
    expect(body.totals).toMatchObject({ invited: 1, hadir: 0, hadirPax: 0 });
  });

  it("409 bila tidak ada acara dengan RSVP; dan memerlukan login", async () => {
    await api.put(`/events/${world.resepsi.id}`, {
      slug: "resepsi",
      name: "Resepsi",
      hasRsvp: false,
    });
    expect((await api.get("/rsvps")).status).toBe(409);
    expect((await adminClient(app, "").get("/rsvps")).status).toBe(401);
  });

  it("dashboard check-in memuat jumlah orang RSVP hadir, atau null tanpa RSVP", async () => {
    await pub.post("/rsvp", {
      code: world.budi.code,
      eventId: world.resepsi.id,
      status: "hadir",
      pax: 5,
    });
    const withRsvp = await read<Dashboard>(await api.get("/checkins/dashboard"));
    expect(withRsvp.totals.rsvpPax).toBe(5);

    await api.put(`/events/${world.resepsi.id}`, {
      slug: "resepsi",
      name: "Resepsi",
      checkinEnabled: true,
      hasRsvp: false,
    });
    const without = await read<Dashboard>(await api.get("/checkins/dashboard"));
    expect(without.totals.rsvpPax).toBeNull();
  });
});

describe("admin: ucapan", () => {
  async function seed() {
    const ids: string[] = [];
    for (const message of ["pertama", "kedua"]) {
      const res = await pub.post("/guestbook", { code: world.sari.code, message });
      ids.push((await read<{ entry: GuestbookEntry }>(res)).entry.id);
      await new Promise((r) => setTimeout(r, 5));
    }
    return ids as [string, string];
  }

  it("daftar admin memuat yang disembunyikan dan bisa difilter", async () => {
    const [first] = await seed();
    await api.post(`/guestbook/${first}/hide`, { hidden: true });

    const all = await read<{ items: AdminGuestbookEntry[]; total: number }>(
      await api.get("/guestbook"),
    );
    expect(all.total).toBe(2);
    expect(all.items.map((e) => [e.message, e.isHidden])).toEqual([
      ["kedua", false],
      ["pertama", true],
    ]);
    expect(all.items[0]?.guestId).toBe(world.sari.id);

    const hidden = await read<{ items: AdminGuestbookEntry[] }>(
      await api.get("/guestbook?hidden=true"),
    );
    expect(hidden.items.map((e) => e.message)).toEqual(["pertama"]);
    const shown = await read<{ items: AdminGuestbookEntry[] }>(
      await api.get("/guestbook?hidden=false"),
    );
    expect(shown.items.map((e) => e.message)).toEqual(["kedua"]);
  });

  it("membalas, mengubah, dan menghapus balasan; menyembunyikan dan menampilkan lagi", async () => {
    const [first] = await seed();

    const replied = await read<{ entry: AdminGuestbookEntry }>(
      await api.post(`/guestbook/${first}/reply`, { reply: "  Terima kasih ya  " }),
    );
    expect(replied.entry.reply).toBe("Terima kasih ya");
    expect(replied.entry.repliedAt).not.toBeNull();

    const cleared = await read<{ entry: AdminGuestbookEntry }>(
      await api.post(`/guestbook/${first}/reply`, { reply: "" }),
    );
    expect(cleared.entry).toMatchObject({ reply: null, repliedAt: null });

    const hidden = await read<{ entry: AdminGuestbookEntry }>(
      await api.post(`/guestbook/${first}/hide`, { hidden: true }),
    );
    expect(hidden.entry.isHidden).toBe(true);
    const shown = await read<{ entry: AdminGuestbookEntry }>(
      await api.post(`/guestbook/${first}/hide`, { hidden: false }),
    );
    expect(shown.entry.isHidden).toBe(false);
  });

  it("menghapus ucapan, 404 untuk yang tidak ada, dan memerlukan login", async () => {
    const [first] = await seed();
    expect((await api.delete(`/guestbook/${first}`)).status).toBe(200);
    expect((await api.delete(`/guestbook/${first}`)).status).toBe(404);
    expect((await api.post(`/guestbook/${first}/hide`, { hidden: true })).status).toBe(404);
    expect((await adminClient(app, "").get("/guestbook")).status).toBe(401);
    const left = await read<{ total: number }>(await api.get("/guestbook"));
    expect(left.total).toBe(1);
  });
});

describe("wishlist: tamu memilih hadiah", () => {
  type WishView = {
    id: string;
    quantity: number;
    claimed: number;
    isFulfilled: boolean;
  };
  type AdminWishView = WishView & {
    claims: { guestId: string; guestName: string; quantity: number }[];
  };

  const addWish = async (body: Record<string, unknown>) =>
    (await read<{ item: AdminWishView }>(await api.post("/invitation/wishes", body))).item;
  const claim = (code: string, wishId: string, quantity: number) =>
    pub.post("/claims", { code, wishId, quantity });
  const publicWish = async (id: string) =>
    (await read<{ wishes: WishView[] }>(await pub.get("/invitation"))).wishes.find(
      (w) => w.id === id,
    ) as WishView;

  it("memilih, mengubah jumlah, dan melepas; hasilnya tampil ke semua orang", async () => {
    const gelas = await addWish({ name: "Gelas", quantity: 5 });

    const first = await claim(world.sari.code, gelas.id, 2);
    expect(first.status).toBe(200);
    expect(await read<{ wish: WishView; mine: number }>(first)).toMatchObject({
      mine: 2,
      wish: { claimed: 2, isFulfilled: false },
    });
    await claim(world.budi.code, gelas.id, 3);
    expect((await publicWish(gelas.id)).claimed).toBe(5);

    // Sari menambah ke 2 -> 2 (tetap), lalu 3 gagal karena hanya sisa 2 untuk Sari.
    expect((await claim(world.sari.code, gelas.id, 3)).status).toBe(409);
    const full = await claim(world.sari.code, gelas.id, 2);
    expect(full.status).toBe(200);

    const mine = await read<{ claims: { wishId: string; quantity: number }[] }>(
      await pub.get(`/claims/${world.sari.code}`),
    );
    expect(mine.claims).toEqual([{ wishId: gelas.id, quantity: 2 }]);

    const release = await claim(world.sari.code, gelas.id, 0);
    expect((await read<{ mine: number }>(release)).mine).toBe(0);
    expect((await publicWish(gelas.id)).claimed).toBe(3);
  });

  it("tidak melebihi sisa, walau dua tamu memilih unit terakhir bersamaan", async () => {
    const mixer = await addWish({ name: "Mixer", quantity: 1 });
    const results = await Promise.all([
      claim(world.sari.code, mixer.id, 1),
      claim(world.budi.code, mixer.id, 1),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const after = await publicWish(mixer.id);
    expect(after).toMatchObject({ claimed: 1, isFulfilled: true });
    expect((await claim(world.outsider.code, mixer.id, 1)).status).toBe(409);
  });

  it("admin melihat siapa yang memilih, bisa melepas pilihan, dan tidak bisa memangkas kuota di bawahnya", async () => {
    const blender = await addWish({ name: "Blender", quantity: 3 });
    await claim(world.sari.code, blender.id, 2);

    const listed = await read<{ items: AdminWishView[] }>(await api.get("/invitation/wishes"));
    expect(listed.items[0]?.claims).toEqual([
      { guestId: world.sari.id, guestName: "Sari", quantity: 2 },
    ]);
    // Respons publik tidak memuat nama pemilih.
    expect(JSON.stringify(await (await pub.get("/invitation")).json())).not.toContain("Sari");

    const shrink = await api.put(`/invitation/wishes/${blender.id}`, {
      name: "Blender",
      quantity: 1,
    });
    expect(shrink.status).toBe(409);

    const removed = await api.delete(`/invitation/wishes/${blender.id}/claims/${world.sari.id}`);
    expect(removed.status).toBe(200);
    expect((await read<{ item: AdminWishView }>(removed)).item.claimed).toBe(0);
    expect(
      (await api.delete(`/invitation/wishes/${blender.id}/claims/${world.sari.id}`)).status,
    ).toBe(404);
  });

  it("menolak kode asing, hadiah tak dikenal, jumlah tak wajar, dan memerlukan kode untuk melihat pilihan", async () => {
    const piring = await addWish({ name: "Piring", quantity: 2 });
    expect((await claim("ZZZZZZ", piring.id, 1)).status).toBe(404);
    expect((await claim(world.sari.code, "00000000-0000-4000-8000-000000000000", 1)).status).toBe(
      404,
    );
    expect((await claim(world.sari.code, piring.id, -1)).status).toBe(400);
    expect((await claim(world.sari.code, piring.id, 3)).status).toBe(409);
    expect((await pub.get("/claims/ZZZZZZ")).status).toBe(404);
  });

  it("pilihan ikut terhapus bersama hadiahnya", async () => {
    const sendok = await addWish({ name: "Sendok", quantity: 2 });
    await claim(world.sari.code, sendok.id, 1);
    expect((await api.delete(`/invitation/wishes/${sendok.id}`)).status).toBe(200);
    expect(
      (await read<{ claims: unknown[] }>(await pub.get(`/claims/${world.sari.code}`))).claims,
    ).toEqual([]);
  });
});
