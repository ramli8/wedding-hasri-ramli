import type {
  Event,
  Group,
  Guest,
  GuestListResponse,
  ImportCommitResponse,
  ImportPreview,
  Settings,
} from "@wedding/shared";
import { DEFAULT_MESSAGE_TEMPLATE } from "@wedding/shared";
import { eq } from "drizzle-orm";
import { strFromU8, unzipSync } from "fflate";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { guests } from "../src/db/schema.js";
import { exampleRows, GUEST_COLUMNS } from "../src/services/xlsx-template.js";
import { adminClient, createTestContext, loggedInClient, ORIGIN } from "./helpers.js";

const ctx = createTestContext();
let api: ReturnType<typeof adminClient>;

beforeEach(async () => {
  api = await loggedInClient(ctx);
});
afterAll(() => ctx.close());

const read = async <T>(res: Response) => (await res.json()) as T;

async function makeEvent(overrides: Record<string, unknown> = {}) {
  const res = await api.post("/events", {
    slug: "resepsi",
    name: "Resepsi",
    startsAt: "2027-05-21T03:00:00Z",
    endsAt: "2027-05-21T06:00:00Z",
    checkinEnabled: true,
    hasRsvp: true,
    ...overrides,
  });
  expect(res.status).toBe(201);
  return (await read<{ event: Event }>(res)).event;
}

async function makeGroup(overrides: Record<string, unknown> = {}) {
  const res = await api.post("/groups", { name: "Keluarga", ...overrides });
  expect(res.status).toBe(201);
  return (await read<{ group: Group }>(res)).group;
}

async function makeGuest(overrides: Record<string, unknown> = {}) {
  const res = await api.post("/guests", {
    displayName: "Bpk. Budi",
    phone: "0812-3456-7890",
    ...overrides,
  });
  expect(res.status).toBe(201);
  return (await read<{ guest: Guest }>(res)).guest;
}

const revOf = async (id: string) => {
  const [row] = await ctx.db.select({ rev: guests.rev }).from(guests).where(eq(guests.id, id));
  return Number(row?.rev);
};

const listGuests = async (query = "") => read<GuestListResponse>(await api.get(`/guests${query}`));

describe("akses", () => {
  it("menolak tanpa login", async () => {
    const anonymous = adminClient(ctx.makeApp(), "");
    expect((await anonymous.get("/events")).status).toBe(401);
    expect((await anonymous.get("/guests")).status).toBe(401);
  });

  it("menolak request yang mengubah data dari Origin asing", async () => {
    const app = ctx.makeApp();
    const res = await app.request("/api/v1/admin/events", {
      method: "POST",
      headers: { origin: "https://jahat.example", "content-type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(403);
    expect(ORIGIN).not.toBe("https://jahat.example");
  });
});

describe("pengaturan", () => {
  it("kosong di awal, lalu bisa disimpan dan diperbarui (alamat tanpa garis miring akhir)", async () => {
    expect(await read<{ settings: Settings | null }>(await api.get("/settings"))).toEqual({
      settings: null,
    });

    const saved = await api.put("/settings", {
      groomName: "Ramli",
      brideName: "Hasri",
      publicBaseUrl: "https://nikah.example/",
    });
    expect(saved.status).toBe(200);
    expect((await read<{ settings: Settings }>(saved)).settings.publicBaseUrl).toBe(
      "https://nikah.example",
    );

    await api.put("/settings", {
      groomName: "Ramli",
      brideName: "Hasri R.",
      publicBaseUrl: "https://nikah.example",
    });
    const { settings } = await read<{ settings: Settings }>(await api.get("/settings"));
    expect(settings.brideName).toBe("Hasri R.");
  });

  it("menolak alamat situs yang bukan URL", async () => {
    const res = await api.put("/settings", {
      groomName: "A",
      brideName: "B",
      publicBaseUrl: "bukan-url",
    });
    expect(res.status).toBe(400);
  });
});

describe("acara", () => {
  it("kode singkat dibuat otomatis dari nama, unik, dan tidak berubah saat nama diganti", async () => {
    const create = async (name: string) =>
      read<{ event: Event }>(await api.post("/events", { name })).then((r) => r.event);
    const a = await create("Résepsi & Ramah Tamah");
    const b = await create("Résepsi & Ramah Tamah");
    const c = await create("婚礼");
    expect([a.slug, b.slug, c.slug]).toEqual([
      "resepsi-ramah-tamah",
      "resepsi-ramah-tamah-2",
      "acara",
    ]);

    const renamed = await api.put(`/events/${a.id}`, { name: "Resepsi Malam" });
    expect((await read<{ event: Event }>(renamed)).event.slug).toBe("resepsi-ramah-tamah");
  });

  it("pesan diatur lewat endpoint sendiri; mengubah acara tidak menghapusnya", async () => {
    const event = await makeEvent();
    const saved = await api.put(`/events/${event.id}/message`, {
      messageTemplate: "Halo {panggilan}, datang ke {acara} ya",
    });
    expect(saved.status).toBe(200);
    expect((await read<{ event: Event }>(saved)).event.messageTemplate).toBe(
      "Halo {panggilan}, datang ke {acara} ya",
    );

    // Formulir acara tidak lagi mengirim messageTemplate.
    const edited = await api.put(`/events/${event.id}`, { name: "Resepsi Malam" });
    expect((await read<{ event: Event }>(edited)).event.messageTemplate).toBe(
      "Halo {panggilan}, datang ke {acara} ya",
    );

    const reset = await api.put(`/events/${event.id}/message`, { messageTemplate: "" });
    expect((await read<{ event: Event }>(reset)).event.messageTemplate).toBe("");
    const missing = "00000000-0000-4000-8000-000000000000";
    expect((await api.put(`/events/${missing}/message`, { messageTemplate: "x" })).status).toBe(
      404,
    );
  });

  it("template yang sama dengan bawaan tidak disimpan, agar ikut perbaikan bawaan", async () => {
    const event = await makeEvent({ slug: undefined, messageTemplate: DEFAULT_MESSAGE_TEMPLATE });
    expect(event.messageTemplate).toBe("");
  });

  it("membuat acara beserta template pesan", async () => {
    const event = await makeEvent({ messageTemplate: "Halo {panggilan}" });
    expect(event).toMatchObject({
      slug: "resepsi",
      checkinEnabled: true,
      hasRsvp: true,
      messageTemplate: "Halo {panggilan}",
      invitedCount: 0,
    });
    expect(event.startsAt).toBe("2027-05-21T03:00:00.000Z");
  });

  it("menolak slug ganda, slug tidak valid, dan jam selesai sebelum mulai", async () => {
    await makeEvent();
    expect((await api.post("/events", { slug: "resepsi", name: "Lain" })).status).toBe(409);
    expect((await api.post("/events", { slug: "Slug Salah!", name: "X" })).status).toBe(400);
    const reversed = await api.post("/events", {
      slug: "akad",
      name: "Akad",
      startsAt: "2027-05-21T06:00:00Z",
      endsAt: "2027-05-21T03:00:00Z",
    });
    expect(reversed.status).toBe(400);
  });

  it("memperbarui acara dan menghapus template bila dikosongkan", async () => {
    const event = await makeEvent({ messageTemplate: "Halo" });
    const updated = await api.put(`/events/${event.id}`, {
      slug: "resepsi",
      name: "Resepsi Utama",
      messageTemplate: "",
    });
    expect(updated.status).toBe(200);
    expect((await read<{ event: Event }>(updated)).event).toMatchObject({
      name: "Resepsi Utama",
      messageTemplate: "",
    });
  });

  it("urutan daftar mengikuti waktu mulai; invitedCount menghitung tamu aktif saja", async () => {
    const second = await makeEvent({
      slug: "kedua",
      name: "Kedua",
      startsAt: "2027-05-21T06:00:00Z",
      endsAt: null,
    });
    const first = await makeEvent({
      slug: "pertama",
      name: "Pertama",
      startsAt: "2027-05-21T03:00:00Z",
    });
    const guest = await makeGuest({ eventIds: [first.id] });
    await makeGuest({ displayName: "Siti", phone: "0813-0000-1111", eventIds: [first.id] });
    await api.delete(`/guests/${guest.id}`);

    const { items } = await read<{ items: Event[] }>(await api.get("/events"));
    expect(items.map((e) => e.slug)).toEqual(["pertama", "kedua"]);
    expect(items.find((e) => e.id === first.id)?.invitedCount).toBe(1);
    expect(items.find((e) => e.id === second.id)?.invitedCount).toBe(0);
  });

  it("menghapus acara, dan 404 untuk acara yang tidak ada", async () => {
    const event = await makeEvent();
    expect((await api.delete(`/events/${event.id}`)).status).toBe(200);
    expect((await api.get(`/events/${event.id}`)).status).toBe(404);
    expect((await api.delete(`/events/${event.id}`)).status).toBe(404);
  });
});

describe("kelompok", () => {
  it("membuat kelompok dengan jam sesi dan menampilkannya di daftar", async () => {
    const event = await makeEvent();
    const group = await makeGroup({
      name: "Surabaya",
      color: "#2563eb",
      eventIds: [event.id],
      sessions: [
        { eventId: event.id, startsAt: "2027-05-21T03:00:00Z", endsAt: "2027-05-21T05:00:00Z" },
      ],
    });
    expect(group).toMatchObject({ name: "Surabaya", guestCount: 0 });
    expect(group.sessions).toEqual([
      {
        eventId: event.id,
        startsAt: "2027-05-21T03:00:00.000Z",
        endsAt: "2027-05-21T05:00:00.000Z",
      },
    ]);
  });

  it("jam sesi tanpa jam selesai berarti sampai selesai", async () => {
    const event = await makeEvent();
    const group = await makeGroup({
      eventIds: [event.id],
      sessions: [{ eventId: event.id, startsAt: "2027-05-21T03:00:00Z", endsAt: null }],
    });
    expect(group.sessions).toEqual([
      { eventId: event.id, startsAt: "2027-05-21T03:00:00.000Z", endsAt: null },
    ]);
  });

  it("tanggal acara diubah: jam datang kelompok ikut pindah tanggal, jamnya tetap", async () => {
    const event = await makeEvent({ startsAt: "2027-05-20T17:00:00Z", endsAt: null });
    const group = await makeGroup({
      eventIds: [event.id],
      sessions: [
        { eventId: event.id, startsAt: "2027-05-21T03:00:00Z", endsAt: "2027-05-21T05:00:00Z" },
      ],
    });
    // 21 Mei -> 23 Mei (00.00 WIB).
    await api.put(`/events/${event.id}`, { name: event.name, startsAt: "2027-05-22T17:00:00Z" });
    const groups = (await read<{ items: Group[] }>(await api.get("/groups"))).items;
    expect(groups.find((g) => g.id === group.id)?.sessions).toEqual([
      {
        eventId: event.id,
        startsAt: "2027-05-23T03:00:00.000Z",
        endsAt: "2027-05-23T05:00:00.000Z",
      },
    ]);
  });

  it("memperbarui kelompok dengan mengganti seluruh jam sesi", async () => {
    const event = await makeEvent();
    const group = await makeGroup({
      eventIds: [event.id],
      sessions: [
        { eventId: event.id, startsAt: "2027-05-21T03:00:00Z", endsAt: "2027-05-21T05:00:00Z" },
      ],
    });
    const res = await api.put(`/groups/${group.id}`, {
      name: "Keluarga",
      isVip: true,
      eventIds: [event.id],
      sessions: [],
    });
    expect(res.status).toBe(200);
    expect((await read<{ group: Group }>(res)).group).toMatchObject({ isVip: true, sessions: [] });
  });

  it("menolak jam sesi untuk acara yang tidak ada, jam terbalik, nama ganda, dan warna salah", async () => {
    const event = await makeEvent();
    await makeGroup();
    const unknownEvent = await api.post("/groups", {
      name: "X",
      eventIds: ["00000000-0000-4000-8000-000000000000"],
      sessions: [
        {
          eventId: "00000000-0000-4000-8000-000000000000",
          startsAt: "2027-05-21T03:00:00Z",
          endsAt: "2027-05-21T05:00:00Z",
        },
      ],
    });
    expect(unknownEvent.status).toBe(400);

    const reversed = await api.post("/groups", {
      name: "Y",
      eventIds: [event.id],
      sessions: [
        { eventId: event.id, startsAt: "2027-05-21T05:00:00Z", endsAt: "2027-05-21T03:00:00Z" },
      ],
    });
    expect(reversed.status).toBe(400);

    expect((await api.post("/groups", { name: "Keluarga" })).status).toBe(409);
    expect((await api.post("/groups", { name: "Z", color: "merah" })).status).toBe(400);
  });

  it("acara kelompok: jam datang hanya untuk acara yang diundang", async () => {
    const event = await makeEvent();
    const res = await api.post("/groups", {
      name: "X",
      eventIds: [],
      sessions: [{ eventId: event.id, startsAt: "2027-05-21T03:00:00Z", endsAt: null }],
    });
    expect(res.status).toBe(400);
  });

  it("mengubah acara kelompok ikut mengubah undangan tamunya; kelompok lain tidak tersentuh", async () => {
    const akad = await makeEvent({ slug: "akad", name: "Akad" });
    const resepsi = await makeEvent();
    const group = await makeGroup({ eventIds: [akad.id] });
    expect(group.eventIds).toEqual([akad.id]);
    const guest = await makeGuest({ groupId: group.id });
    const other = await makeGuest({ phone: "0812-0000-0001", eventIds: [akad.id] });
    const revBefore = await revOf(guest.id);

    const res = await api.put(`/groups/${group.id}`, { name: "Keluarga", eventIds: [resepsi.id] });
    expect(res.status).toBe(200);
    expect((await read<{ group: Group }>(res)).group.eventIds).toEqual([resepsi.id]);

    const invited = async (id: string) =>
      (await read<{ guest: Guest }>(await api.get(`/guests/${id}`))).guest.events
        .map((e) => e.eventId)
        .sort();
    expect(await invited(guest.id)).toEqual([resepsi.id]);
    // Rev naik supaya perangkat pintu menerima undangan yang berubah.
    expect(await revOf(guest.id)).toBeGreaterThan(revBefore);
    // Tamu kelompok lain tidak tersentuh.
    expect(await invited(other.id)).toEqual([akad.id]);
  });

  it("menghitung tamu aktif, dan menolak menghapus kelompok yang masih dipakai", async () => {
    const group = await makeGroup();
    const guest = await makeGuest({ groupId: group.id });

    const { items } = await read<{ items: Group[] }>(await api.get("/groups"));
    expect(items[0]?.guestCount).toBe(1);

    const blocked = await api.delete(`/groups/${group.id}`);
    expect(blocked.status).toBe(409);

    // Memindahkan tamu ke kelompok lain membuat kelompok bisa dihapus.
    await api.put(`/guests/${guest.id}`, { displayName: guest.displayName, phone: guest.phone });
    expect((await api.delete(`/groups/${group.id}`)).status).toBe(200);
  });

  it("menghapus kelompok sambil memindahkan tamunya (termasuk yang di tempat sampah)", async () => {
    const event = await makeEvent();
    const group = await makeGroup();
    const target = await makeGroup({ name: "Teman", eventIds: [event.id] });
    const active = await makeGuest({ groupId: group.id });
    const trashed = await makeGuest({
      displayName: "Dihapus",
      phone: "0813-1111-0000",
      groupId: group.id,
    });
    await api.delete(`/guests/${trashed.id}`);
    const before = await revOf(active.id);

    expect((await api.delete(`/groups/${group.id}?moveTo=${group.id}`)).status).toBe(400);
    expect((await api.delete(`/groups/${group.id}?moveTo=${crypto.randomUUID()}`)).status).toBe(
      400,
    );
    expect((await api.delete(`/groups/${group.id}?moveTo=bukan`)).status).toBe(400);

    expect((await api.delete(`/groups/${group.id}?moveTo=${target.id}`)).status).toBe(200);
    expect(
      (await read<{ guest: Guest }>(await api.get(`/guests/${active.id}`))).guest.groupId,
    ).toBe(target.id);
    expect(await revOf(active.id)).toBeGreaterThan(before);
    // Tamu yang dipindah diundang ke acara kelompok tujuan.
    const moved = (await read<{ guest: Guest }>(await api.get(`/guests/${active.id}`))).guest;
    expect(moved.events.map((e) => e.eventId)).toEqual([event.id]);
    const groups = (await read<{ items: Group[] }>(await api.get("/groups"))).items;
    expect(groups.map((g) => g.name)).toEqual(["Teman"]);

    // Tamu wajib berkelompok: "tanpa kelompok" tidak lagi diterima.
    expect((await api.delete(`/groups/${target.id}?moveTo=none`)).status).toBe(400);
  });
});

describe("tamu: membuat dan validasi", () => {
  it("membuat tamu dengan kode 6 karakter, HP ternormalisasi, dan undangan dari kelompok", async () => {
    const event = await makeEvent();
    const group = await makeGroup({ eventIds: [event.id] });
    const guest = await makeGuest({
      groupId: group.id,
      isRombongan: true,
      usherNote: "Pemain inti",
    });
    expect(guest.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(guest).toMatchObject({
      phone: "6281234567890",
      isRombongan: true,
      usherNote: "Pemain inti",
      groupId: group.id,
      source: "admin",
      deletedAt: null,
    });
    expect(guest.events).toEqual([{ eventId: event.id, sentAt: null, sentVia: null }]);
  });

  it("menghasilkan kode unik untuk banyak tamu", async () => {
    const group = await makeGroup();
    const created = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        makeGuest({
          displayName: `Tamu ${i}`,
          phone: `08120000${String(i).padStart(4, "0")}`,
          groupId: group.id,
        }),
      ),
    );
    expect(new Set(created.map((g) => g.code)).size).toBe(25);
  });

  it("menerima tamu hanya dengan Instagram dan menormalkan username-nya", async () => {
    const guest = await makeGuest({
      displayName: "Sari",
      phone: "",
      instagram: "https://www.instagram.com/Sari.Rahma/",
    });
    expect(guest).toMatchObject({ phone: null, instagram: "sari.rahma" });
  });

  it.each([
    ["tanpa HP dan Instagram", { phone: "", instagram: "" }, "Isi nomor HP atau Instagram"],
    ["HP tidak valid", { phone: "123" }, "Nomor HP tidak valid"],
    [
      "Instagram tidak valid",
      { phone: "", instagram: "nama salah!" },
      "Username Instagram tidak valid",
    ],
    ["nama kosong", { displayName: "  " }, "Nama undangan wajib diisi"],
  ])("menolak %s", async (_label, overrides, message) => {
    const res = await api.post("/guests", {
      displayName: "Bpk. Budi",
      phone: "0812-3456-7890",
      ...overrides,
    });
    expect(res.status).toBe(400);
    expect(await read<{ error: { message: string } }>(res)).toMatchObject({
      error: { message: expect.stringContaining(message) },
    });
  });

  it("menolak tamu tanpa kelompok atau kelompok yang tidak ada, serta id yang bukan UUID", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (await api.post("/guests", { displayName: "A", phone: "0812-3456-7890", groupId: missing }))
        .status,
    ).toBe(400);
    const noGroup = await api.post("/guests", {
      displayName: "A",
      phone: "0812-3456-7890",
      groupId: null,
    });
    expect(noGroup.status).toBe(400);
    expect(JSON.stringify(await read(noGroup))).toContain("Pilih kelompok");
    expect((await api.get("/guests/bukan-uuid")).status).toBe(400);
    expect((await api.get(`/guests/${missing}`)).status).toBe(404);
  });
});

describe("tamu: daftar dan filter", () => {
  it("mencari berdasarkan nama, HP, Instagram, dan kode; karakter % dan _ tidak jadi wildcard", async () => {
    const budi = await makeGuest({ displayName: "Budi Santoso" });
    await makeGuest({ displayName: "Sari", phone: "", instagram: "sari.rahma" });
    await makeGuest({ displayName: "Diskon 100%", phone: "0813-0000-1111" });

    const names = async (q: string) =>
      (await listGuests(`?q=${encodeURIComponent(q)}`)).items.map((g) => g.displayName);

    expect(await names("budi")).toEqual(["Budi Santoso"]);
    expect(await names("81234")).toEqual(["Budi Santoso"]);
    expect(await names("sari.r")).toEqual(["Sari"]);
    expect(await names(budi.code?.toLowerCase() ?? "")).toEqual(["Budi Santoso"]);
    expect(await names("%")).toEqual(["Diskon 100%"]);
    expect(await names("_")).toEqual([]);
  });

  it("memfilter menurut kelompok, acara, status kirim, dan hanya-Instagram, dan hanya-rombongan", async () => {
    const e1 = await makeEvent({ slug: "akad", name: "Akad" });
    const e2 = await makeEvent({ slug: "resepsi", name: "Resepsi" });
    const group = await makeGroup({ eventIds: [e1.id] });
    const alpha = await makeGuest({ displayName: "Alpha", groupId: group.id });
    await makeGuest({
      displayName: "Bravo",
      phone: "",
      instagram: "bravo",
      eventIds: [e1.id, e2.id],
    });
    await makeGuest({ displayName: "Charlie", phone: "0813-0000-1111", isRombongan: true });

    const names = async (query: string) =>
      (await listGuests(query)).items.map((g) => g.displayName);

    expect(await names(`?groupId=${group.id}`)).toEqual(["Alpha"]);
    expect(await names(`?eventId=${e1.id}`)).toEqual(["Alpha", "Bravo"]);
    expect(await names(`?eventId=${e2.id}`)).toEqual(["Bravo"]);
    expect(await names("?onlyInstagram=true")).toEqual(["Bravo"]);
    expect(await names("?rombongan=true")).toEqual(["Charlie"]);

    await api.post(`/guests/${alpha.id}/sent`, { eventId: e1.id, via: "whatsapp" });
    expect(await names(`?eventId=${e1.id}&sent=sent`)).toEqual(["Alpha"]);
    expect(await names(`?eventId=${e1.id}&sent=unsent`)).toEqual(["Bravo"]);
  });

  it("membagi halaman dan melaporkan total", async () => {
    for (const name of ["Alpha", "Bravo", "Charlie"]) {
      await makeGuest({ displayName: name, phone: `0812${name.length}000000${name.length}` });
    }
    const page2 = await listGuests("?pageSize=2&page=2");
    expect(page2).toMatchObject({ total: 3, page: 2, pageSize: 2 });
    expect(page2.items.map((g) => g.displayName)).toEqual(["Charlie"]);
  });
});

describe("tamu: ubah, hapus, kirim", () => {
  it("mengubah tamu tanpa menghilangkan status terkirim pada undangan yang dipertahankan", async () => {
    const e1 = await makeEvent({ slug: "akad", name: "Akad" });
    const e2 = await makeEvent({ slug: "resepsi", name: "Resepsi" });
    const guest = await makeGuest({ eventIds: [e1.id] });
    await api.post(`/guests/${guest.id}/sent`, { eventId: e1.id, via: "instagram" });

    const widened = await api.put(`/guests/${guest.id}`, {
      displayName: "Bpk. Budi & Keluarga",
      phone: "0812-3456-7890",
      eventIds: [e1.id, e2.id],
    });
    const afterWiden = (await read<{ guest: Guest }>(widened)).guest;
    expect(afterWiden.displayName).toBe("Bpk. Budi & Keluarga");
    const kept = afterWiden.events.find((e) => e.eventId === e1.id);
    expect(kept?.sentVia).toBe("instagram");
    expect(kept?.sentAt).not.toBeNull();
    expect(afterWiden.events).toHaveLength(2);

    const narrowed = await api.put(`/guests/${guest.id}`, {
      displayName: "Bpk. Budi & Keluarga",
      phone: "0812-3456-7890",
      eventIds: [e2.id],
    });
    expect((await read<{ guest: Guest }>(narrowed)).guest.events.map((e) => e.eventId)).toEqual([
      e2.id,
    ]);
  });

  it("menaikkan rev setiap tamu berubah (untuk sinkronisasi perangkat)", async () => {
    const guest = await makeGuest();
    const revOf = async () =>
      (await ctx.db.select({ rev: guests.rev }).from(guests).where(eq(guests.id, guest.id)))[0]
        ?.rev ?? 0;

    const before = await revOf();
    await api.put(`/guests/${guest.id}`, { displayName: "Baru", phone: "0812-3456-7890" });
    const afterUpdate = await revOf();
    await api.delete(`/guests/${guest.id}`);
    const afterDelete = await revOf();

    expect(afterUpdate).toBeGreaterThan(before);
    expect(afterDelete).toBeGreaterThan(afterUpdate);
  });

  it("hapus lunak: hilang dari daftar, muncul di tempat sampah, bisa dipulihkan", async () => {
    const guest = await makeGuest();
    expect((await api.delete(`/guests/${guest.id}`)).status).toBe(200);
    expect((await listGuests()).total).toBe(0);
    expect((await listGuests("?deleted=true")).items.map((g) => g.id)).toEqual([guest.id]);
    expect((await api.delete(`/guests/${guest.id}`)).status).toBe(404);
    expect(
      (await api.put(`/guests/${guest.id}`, { displayName: "X", phone: "0812-3456-7890" })).status,
    ).toBe(404);

    const restored = await api.post(`/guests/${guest.id}/restore`);
    expect(restored.status).toBe(200);
    expect((await listGuests()).total).toBe(1);
    expect((await api.post(`/guests/${guest.id}/restore`)).status).toBe(404);
  });

  it("menandai terkirim dan membatalkannya; menolak acara yang tidak mengundang tamu itu", async () => {
    const invited = await makeEvent({ slug: "akad", name: "Akad" });
    const other = await makeEvent({ slug: "resepsi", name: "Resepsi" });
    const guest = await makeGuest({ eventIds: [invited.id] });

    const sent = await api.post(`/guests/${guest.id}/sent`, {
      eventId: invited.id,
      via: "whatsapp",
    });
    const sentEvent = (await read<{ guest: Guest }>(sent)).guest.events[0];
    expect(sentEvent).toMatchObject({ sentVia: "whatsapp" });
    expect(sentEvent?.sentAt).not.toBeNull();

    const undone = await api.post(`/guests/${guest.id}/sent`, { eventId: invited.id, sent: false });
    expect((await read<{ guest: Guest }>(undone)).guest.events[0]).toMatchObject({
      sentAt: null,
      sentVia: null,
    });

    const notInvited = await api.post(`/guests/${guest.id}/sent`, { eventId: other.id });
    expect(notInvited.status).toBe(400);
  });
});

describe("tamu: aksi massal", () => {
  it("memindah kelompok beserta acaranya, melewati tamu di tempat sampah", async () => {
    const event = await makeEvent();
    const group = await makeGroup({ eventIds: [event.id] });
    const a = await makeGuest({ displayName: "A", phone: "0812-0000-0001" });
    const b = await makeGuest({ displayName: "B", phone: "0812-0000-0002" });
    const gone = await makeGuest({ displayName: "C", phone: "0812-0000-0003" });
    const oldGroup = gone.groupId;
    await api.delete(`/guests/${gone.id}`);
    const ids = [a.id, b.id, gone.id];
    const revA = await revOf(a.id);

    const moved = await api.post("/guests/bulk", { ids, action: "set_group", groupId: group.id });
    expect(await read(moved)).toEqual({ updated: 2 });
    expect(await revOf(a.id)).toBeGreaterThan(revA);
    expect((await listGuests(`?groupId=${group.id}`)).total).toBe(2);
    // Undangan ikut acara kelompok tujuan.
    expect((await listGuests(`?eventId=${event.id}`)).total).toBe(2);
    const goneRow = await read<{ guest: Guest }>(await api.get(`/guests/${gone.id}`));
    expect(goneRow.guest.groupId).toBe(oldGroup);
  });

  it("menolak data yang tidak lengkap, aksi lain, dan kelompok yang tidak ada", async () => {
    const guest = await makeGuest();
    const ids = [guest.id];
    expect((await api.post("/guests/bulk", { ids: [], action: "set_group" })).status).toBe(400);
    expect((await api.post("/guests/bulk", { ids, action: "set_group" })).status).toBe(400);
    expect(
      (await api.post("/guests/bulk", { ids, action: "set_group", groupId: null })).status,
    ).toBe(400);
    expect((await api.post("/guests/bulk", { ids, action: "add_event" })).status).toBe(400);
    const missing = crypto.randomUUID();
    expect(
      (await api.post("/guests/bulk", { ids, action: "set_group", groupId: missing })).status,
    ).toBe(404);
  });
});

describe("tamu: cek kontak ganda", () => {
  const duplicates = async (query: string) =>
    (
      await read<{ guests: { id: string; displayName: string }[] }>(
        await api.get(`/guests/duplicates?${query}`),
      )
    ).guests;

  it("mencocokkan HP dan Instagram yang sudah dinormalisasi, kecuali tamu itu sendiri dan yang dihapus", async () => {
    const budi = await makeGuest({ displayName: "Budi", phone: "0812-3456-7890" });
    const sari = await makeGuest({ displayName: "Sari", phone: null, instagram: "@Sari.Rahma" });

    expect(await duplicates("phone=%2B62%20812%203456%207890")).toEqual([
      { id: budi.id, displayName: "Budi", code: budi.code },
    ]);
    expect((await duplicates("instagram=instagram.com/sari.rahma")).map((g) => g.id)).toEqual([
      sari.id,
    ]);
    expect(
      (await duplicates("phone=081234567890&instagram=sari.rahma")).map((g) => g.displayName),
    ).toEqual(["Budi", "Sari"]);
    expect(await duplicates(`phone=081234567890&excludeId=${budi.id}`)).toEqual([]);
    expect(await duplicates("phone=abc")).toEqual([]);
    expect(await duplicates("")).toEqual([]);

    await api.delete(`/guests/${budi.id}`);
    expect(await duplicates("phone=081234567890")).toEqual([]);
  });
});

describe("impor CSV", () => {
  const CSV = [
    "nama_undangan,hp,instagram,kelompok,rombongan,acara",
    "Budi,0812-1111-2222,,Keluarga,ya,",
    "Sari,,@sari.rahma,Teman,tidak,resepsi",
    "Budi Lagi,+62 812 1111 2222,,Keluarga,ya,",
    ",,,,,",
    "Tanpa Kontak,,,,tidak,",
    "Tanpa Kelompok,0813-0000-1111,,,tidak,resepsi",
    "Salah Rombongan,0813-0000-2222,,,mungkin,",
  ].join("\n");

  const preview = async (csv: string) => {
    const res = await api.post("/guests/import/preview", { csv });
    expect(res.status).toBe(200);
    return read<ImportPreview>(res);
  };

  beforeEach(async () => {
    await makeEvent({
      slug: "akad",
      name: "Akad",
      startsAt: "2027-05-21T01:00:00Z",
      endsAt: "2027-05-21T02:00:00Z",
    });
    await makeEvent({ slug: "resepsi", name: "Resepsi" });
  });

  it("pratinjau menandai baris ok, duplikat, dan error beserta alasannya", async () => {
    const result = await preview(CSV);
    expect(result.counts).toEqual({ ok: 2, duplicate: 1, error: 4 });
    expect(result.newGroups).toEqual(["Keluarga", "Teman"]);

    const byLine = new Map(result.rows.map((r) => [r.line, r]));
    expect(byLine.get(2)).toMatchObject({
      status: "ok",
      phone: "6281211112222",
      isRombongan: true,
    });
    expect(byLine.get(3)).toMatchObject({ status: "ok", isRombongan: false });
    expect(byLine.get(4)?.status).toBe("duplicate");
    expect(byLine.get(4)?.messages.join(" ")).toContain("baris 2");
    expect(byLine.get(5)?.messages.join(" ")).toContain("Nama undangan wajib diisi");
    expect(byLine.get(6)?.messages.join(" ")).toContain("Isi nomor HP atau Instagram");
    expect(byLine.get(7)?.messages.join(" ")).toContain("Kolom kelompok wajib diisi");
    expect(byLine.get(8)?.messages.join(" ")).toContain("rombongan");
  });

  it("membaca pemisah titik koma, BOM, dan nama kolom alias", async () => {
    const result = await preview(
      "﻿Nama;No HP;IG;Group;Rombongan\nBudi;0812-1111-2222;;Keluarga;ya\n",
    );
    expect(result.counts.ok).toBe(1);
    expect(result.rows[0]).toMatchObject({
      phone: "6281211112222",
      groupName: "Keluarga",
      isRombongan: true,
    });
  });

  it("kolom acara diabaikan: undangan selalu mengikuti kelompok", async () => {
    const result = await preview(
      "nama_undangan,hp,kelompok,acara\nBudi,0812-1111-2222,Keluarga,acara-tak-dikenal\n",
    );
    expect(result.rows[0]?.status).toBe("ok");
  });

  it("undangan mengikuti acara kelompoknya; kelompok baru diundang ke semua acara", async () => {
    const all = (await read<{ items: { id: string }[] }>(await api.get("/events"))).items;
    const [first] = all;
    if (!first || all.length < 2) throw new Error("butuh minimal 2 acara");
    await makeGroup({ name: "Kantor", eventIds: [first.id] });

    await api.post("/guests/import/commit", {
      csv: "nama_undangan,hp,kelompok\nBudi,0812-1111-2222,Kantor\nSari,0812-1111-3333,Arisan\n",
    });
    const guests = (await listGuests()).items;
    const budi = guests.find((g) => g.displayName === "Budi");
    const sari = guests.find((g) => g.displayName === "Sari");
    expect(budi?.events.map((e) => e.eventId)).toEqual([first.id]);
    expect(sari?.events).toHaveLength(all.length);
    const groups = (await read<{ items: Group[] }>(await api.get("/groups"))).items;
    expect(groups.find((g) => g.name === "Arisan")?.eventIds).toHaveLength(all.length);
  });

  it("membaca teks bertab hasil tempel dari spreadsheet, koma di dalam nama tetap utuh", async () => {
    const result = await preview(
      'Nama\tHP\tKelompok\tAcara\nBudi, Ani & "Anak"\t0812-1111-2222\tKeluarga\tResepsi\n',
    );
    expect(result.counts).toEqual({ ok: 1, duplicate: 0, error: 0 });
    expect(result.rows[0]).toMatchObject({
      displayName: 'Budi, Ani & "Anak"',
      phone: "6281211112222",
      groupName: "Keluarga",
    });
  });

  it("menolak CSV tanpa kolom nama_undangan atau tanpa baris data", async () => {
    expect((await api.post("/guests/import/preview", { csv: "hp\n0812-1111-2222" })).status).toBe(
      400,
    );
    expect((await api.post("/guests/import/preview", { csv: "nama_undangan,hp" })).status).toBe(
      400,
    );
  });

  it("mendeteksi duplikat terhadap tamu yang sudah ada, tapi tidak terhadap tamu yang sudah dihapus", async () => {
    const existing = await makeGuest({ displayName: "Lama", phone: "0812-1111-2222" });
    const csv = "nama_undangan,hp,kelompok\nBaru,0812-1111-2222,Keluarga";
    expect((await preview(csv)).rows[0]?.status).toBe("duplicate");

    await api.delete(`/guests/${existing.id}`);
    expect((await preview(csv)).rows[0]?.status).toBe("ok");
  });

  it("commit mengimpor baris ok, melewati duplikat dan error, serta membuat kelompok baru", async () => {
    const res = await api.post("/guests/import/commit", { csv: CSV });
    expect(res.status).toBe(200);
    expect(await read<ImportCommitResponse>(res)).toEqual({
      imported: 2,
      skipped: 5,
      createdGroups: ["Keluarga", "Teman"],
    });

    const { items } = await listGuests();
    expect(items.map((g) => g.displayName)).toEqual(["Budi", "Sari"]);
    expect(items.every((g) => g.source === "import")).toBe(true);
    expect(new Set(items.map((g) => g.code)).size).toBe(2);

    const groups = (await read<{ items: Group[] }>(await api.get("/groups"))).items;
    expect(groups.map((g) => g.name).sort()).toEqual(["Keluarga", "Teman"]);
    expect(groups.find((g) => g.name === "Keluarga")?.guestCount).toBe(1);

    // Kelompok baru dari impor diundang ke semua acara; kolom acara diabaikan.
    const events = (await read<{ items: Event[] }>(await api.get("/events"))).items;
    const slugOf = (id: string) => events.find((e) => e.id === id)?.slug;
    const invited = (name: string) =>
      items
        .find((g) => g.displayName === name)
        ?.events.map((e) => slugOf(e.eventId))
        .sort();
    expect(invited("Budi")).toEqual(["akad", "resepsi"]);
    expect(invited("Sari")).toEqual(["akad", "resepsi"]);
  });

  it("commit dengan skipDuplicates=false tetap mengimpor duplikat", async () => {
    const res = await api.post("/guests/import/commit", { csv: CSV, skipDuplicates: false });
    expect((await read<ImportCommitResponse>(res)).imported).toBe(3);
    expect((await listGuests()).total).toBe(3);
  });

  it("memakai kelompok yang sudah ada (tanpa memedulikan huruf besar/kecil) dan tidak menduplikasinya", async () => {
    await makeGroup({ name: "Keluarga" });
    const res = await api.post("/guests/import/commit", {
      csv: "nama_undangan,hp,kelompok\nBudi,0812-1111-2222,keluarga",
    });
    expect((await read<ImportCommitResponse>(res)).createdGroups).toEqual([]);
    const groups = (await read<{ items: Group[] }>(await api.get("/groups"))).items;
    expect(groups).toHaveLength(1);
    expect(groups[0]?.guestCount).toBe(1);
  });
});

describe("ekspor dan template CSV", () => {
  it("mengekspor tamu dengan BOM, kolom kode dan link, serta melindungi dari rumus spreadsheet", async () => {
    await api.put("/settings", {
      groomName: "Ramli",
      brideName: "Hasri",
      publicBaseUrl: "https://nikah.example",
    });
    const event = await makeEvent();
    const group = await makeGroup({ eventIds: [event.id] });
    const guest = await makeGuest({
      displayName: '=HYPERLINK("http://jahat.example")',
      groupId: group.id,
    });

    const res = await api.get("/guests/export.csv");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("tamu.csv");

    // Response.text() membuang BOM, jadi BOM diperiksa dari byte mentahnya.
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith("kode,nama_undangan")).toBe(true);
    expect(text).toContain(`https://nikah.example/u/${guest.code}`);
    expect(text).toContain("Keluarga");
    // Kolom acara (informasi saja) memakai nama acara, bukan kode singkat.
    expect(text).toContain(event.name);
    expect(text).toContain(`"'=HYPERLINK(""http://jahat.example"")"`);
    expect(text).not.toMatch(/,=HYPERLINK/);
  });

  it("hasil ekspor bisa diimpor ulang ke sistem kosong", async () => {
    await makeEvent();
    await makeGuest({
      displayName: "Budi, Ani & Anak",
      phone: "0812-1111-2222",
      isRombongan: true,
    });
    const exported = await (await api.get("/guests/export.csv")).text();

    const reset = await loggedInClient(ctx);
    await reset.post("/events", { slug: "resepsi", name: "Resepsi" });
    const res = await reset.post("/guests/import/preview", { csv: exported });
    const result = await read<ImportPreview>(res);
    expect(result.counts).toEqual({ ok: 1, duplicate: 0, error: 0 });
    expect(result.rows[0]).toMatchObject({ displayName: "Budi, Ani & Anak", isRombongan: true });
  });

  it("template Excel: dropdown kelompok dari kelompok yang ada, rombongan ya/tidak, kolom teks", async () => {
    await makeGroup({ name: "Keluarga & Kerabat" });
    await makeGroup({ name: "Teman Kantor" });
    const res = await api.get("/guests/template.xlsx");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml");
    const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
    const sheet = (path: string) => strFromU8(files[path] ?? new Uint8Array());
    const tamu = sheet("xl/worksheets/sheet1.xml");
    expect(tamu).toContain(">nama_undangan<");
    expect(tamu).toContain("<formula1>Kelompok!$A$1:$A$2</formula1>");
    expect(tamu).toContain('<formula1>"ya,tidak"</formula1>');
    // Daftar kelompok (lembar tersembunyi), nama di-escape untuk XML.
    // Lima baris contoh langsung di lembar Tamu, memakai kelompok yang ada.
    expect(tamu).toContain('<row r="6">');
    expect(tamu).not.toContain('<row r="7">');
    expect(tamu).toContain('s="1"><is><t xml:space="preserve">Bpk. Budi Santoso &amp; Keluarga<');
    expect(tamu).toContain(">Teman Kantor<");
    const kelompok = sheet("xl/worksheets/sheet2.xml");
    expect(kelompok).toContain("Keluarga &amp; Kerabat");
    expect(kelompok).toContain("Teman Kantor");
    const workbook = sheet("xl/workbook.xml");
    expect(workbook).toContain('<sheet name="Tamu" sheetId="1" r:id="rId1"/>');
    expect(workbook).toContain('name="Kelompok" sheetId="2" state="hidden"');
  });

  it("ekspor Excel: kolom ekspor, sel teks apa adanya (tanpa petik), dropdown kelompok", async () => {
    const event = await makeEvent();
    const group = await makeGroup({ name: "Keluarga", eventIds: [event.id] });
    await makeGuest({ displayName: "=1+1 & <Budi>", groupId: group.id });
    const res = await api.get("/guests/export.xlsx");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(/tamu-.*\.xlsx/);
    const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
    const tamu = strFromU8(files["xl/worksheets/sheet1.xml"] ?? new Uint8Array());
    expect(tamu).toContain(">kode<");
    expect(tamu).toContain(">link<");
    // Teks inline tidak pernah jadi rumus, jadi nilainya ditulis apa adanya (di-escape untuk XML).
    expect(tamu).toContain(">=1+1 &amp; &lt;Budi&gt;<");
    expect(tamu).toContain(">6281234567890<");
    expect(tamu).toContain(`>${event.name}<`);
    expect(tamu).toContain("<formula1>Kelompok!$A$1:$A$1</formula1>");
  });

  it("baris contoh template Excel dilewati saat impor; contoh yang diubah dianggap tamu biasa", async () => {
    await makeGroup({ name: "Keluarga" });
    await makeGroup({ name: "Teman Kantor" });
    const rows = exampleRows(["Keluarga", "Teman Kantor"]);
    expect(rows).toHaveLength(5);
    const header = GUEST_COLUMNS.map((c) => c.header);
    const changed = ["Sari Lestari Baru", ...(rows[1] ?? []).slice(1)];
    const tsv = [header, ...rows, changed].map((r) => r.join("\t")).join("\n");
    const preview = await read<ImportPreview>(
      await api.post("/guests/import/preview", { csv: tsv }),
    );
    expect(preview.counts).toEqual({ ok: 1, duplicate: 0, error: 0 });
    expect(preview.examplesSkipped).toBe(5);
    // Nomor baris tetap sesuai spreadsheet (baris 7 = setelah judul dan 5 contoh).
    expect(preview.rows[0]).toMatchObject({ line: 7, displayName: "Sari Lestari Baru" });
  });

  it("template tanpa kolom acara, dan contohnya lolos pratinjau", async () => {
    const text = await (await api.get("/guests/template.csv")).text();
    expect(text).toContain("kelompok");
    expect(text).not.toContain("acara");
    const preview = await read<ImportPreview>(
      await api.post("/guests/import/preview", { csv: text }),
    );
    expect(preview.counts).toEqual({ ok: 2, duplicate: 0, error: 0 });
  });

  it("menyediakan template CSV yang valid untuk diimpor", async () => {
    const res = await api.get("/guests/template.csv");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("nama_undangan");

    await makeEvent();
    const preview = await read<ImportPreview>(
      await api.post("/guests/import/preview", { csv: text }),
    );
    expect(preview.counts.error).toBe(0);
    expect(preview.counts.ok).toBe(2);
  });
});
