import type {
  Event,
  Group,
  Guest,
  GuestListResponse,
  ImportCommitResponse,
  ImportPreview,
  Settings,
} from "@wedding/shared";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { guests } from "../src/db/schema.js";
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

  it("urutan daftar mengikuti sortOrder; invitedCount menghitung tamu aktif saja", async () => {
    const second = await makeEvent({ slug: "kedua", name: "Kedua", sortOrder: 2 });
    const first = await makeEvent({ slug: "pertama", name: "Pertama", sortOrder: 1 });
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
      gate: "A",
      sessions: [
        { eventId: event.id, startsAt: "2027-05-21T03:00:00Z", endsAt: "2027-05-21T05:00:00Z" },
      ],
    });
    expect(group).toMatchObject({ name: "Surabaya", gate: "A", guestCount: 0 });
    expect(group.sessions).toEqual([
      {
        eventId: event.id,
        startsAt: "2027-05-21T03:00:00.000Z",
        endsAt: "2027-05-21T05:00:00.000Z",
      },
    ]);
  });

  it("memperbarui kelompok dengan mengganti seluruh jam sesi", async () => {
    const event = await makeEvent();
    const group = await makeGroup({
      sessions: [
        { eventId: event.id, startsAt: "2027-05-21T03:00:00Z", endsAt: "2027-05-21T05:00:00Z" },
      ],
    });
    const res = await api.put(`/groups/${group.id}`, {
      name: "Keluarga",
      isVip: true,
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
      sessions: [
        { eventId: event.id, startsAt: "2027-05-21T05:00:00Z", endsAt: "2027-05-21T03:00:00Z" },
      ],
    });
    expect(reversed.status).toBe(400);

    expect((await api.post("/groups", { name: "Keluarga" })).status).toBe(409);
    expect((await api.post("/groups", { name: "Z", color: "merah" })).status).toBe(400);
  });

  it("menghitung tamu aktif, dan menolak menghapus kelompok yang masih dipakai", async () => {
    const group = await makeGroup();
    const guest = await makeGuest({ groupId: group.id });

    const { items } = await read<{ items: Group[] }>(await api.get("/groups"));
    expect(items[0]?.guestCount).toBe(1);

    const blocked = await api.delete(`/groups/${group.id}`);
    expect(blocked.status).toBe(409);

    // Memindahkan tamu keluar dari kelompok membuat kelompok bisa dihapus.
    await api.put(`/guests/${guest.id}`, { displayName: guest.displayName, phone: guest.phone });
    expect((await api.delete(`/groups/${group.id}`)).status).toBe(200);
  });
});

describe("tamu: membuat dan validasi", () => {
  it("membuat tamu dengan kode 6 karakter, HP ternormalisasi, dan undangan acara", async () => {
    const event = await makeEvent();
    const group = await makeGroup();
    const guest = await makeGuest({
      groupId: group.id,
      quota: 4,
      usherNote: "Pemain inti",
      eventIds: [event.id],
    });
    expect(guest.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(guest).toMatchObject({
      phone: "6281234567890",
      quota: 4,
      usherNote: "Pemain inti",
      groupId: group.id,
      source: "admin",
      deletedAt: null,
    });
    expect(guest.events).toEqual([{ eventId: event.id, sentAt: null, sentVia: null }]);
  });

  it("menghasilkan kode unik untuk banyak tamu", async () => {
    const created = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        makeGuest({ displayName: `Tamu ${i}`, phone: `08120000${String(i).padStart(4, "0")}` }),
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
    ["kuota nol", { quota: 0 }, "Kuota minimal 1"],
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

  it("menolak kelompok dan acara yang tidak ada, serta id yang bukan UUID", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (await api.post("/guests", { displayName: "A", phone: "0812-3456-7890", groupId: missing }))
        .status,
    ).toBe(400);
    expect(
      (
        await api.post("/guests", {
          displayName: "A",
          phone: "0812-3456-7890",
          eventIds: [missing],
        })
      ).status,
    ).toBe(400);
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

  it("memfilter menurut kelompok, acara, status kirim, dan hanya-Instagram", async () => {
    const e1 = await makeEvent({ slug: "akad", name: "Akad" });
    const e2 = await makeEvent({ slug: "resepsi", name: "Resepsi" });
    const group = await makeGroup();
    const alpha = await makeGuest({ displayName: "Alpha", groupId: group.id, eventIds: [e1.id] });
    await makeGuest({
      displayName: "Bravo",
      phone: "",
      instagram: "bravo",
      eventIds: [e1.id, e2.id],
    });
    await makeGuest({ displayName: "Charlie", phone: "0813-0000-1111" });

    const names = async (query: string) =>
      (await listGuests(query)).items.map((g) => g.displayName);

    expect(await names(`?groupId=${group.id}`)).toEqual(["Alpha"]);
    expect(await names(`?eventId=${e1.id}`)).toEqual(["Alpha", "Bravo"]);
    expect(await names(`?eventId=${e2.id}`)).toEqual(["Bravo"]);
    expect(await names("?onlyInstagram=true")).toEqual(["Bravo"]);

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

describe("impor CSV", () => {
  const CSV = [
    "nama_undangan,hp,instagram,kelompok,kuota,acara",
    "Budi,0812-1111-2222,,Keluarga,4,",
    "Sari,,@sari.rahma,Teman,1,resepsi",
    "Budi Lagi,+62 812 1111 2222,,Keluarga,2,",
    ",,,,,",
    "Tanpa Kontak,,,,1,",
    "Salah Acara,0813-0000-1111,,,1,tidak-ada",
  ].join("\n");

  const preview = async (csv: string) => {
    const res = await api.post("/guests/import/preview", { csv });
    expect(res.status).toBe(200);
    return read<ImportPreview>(res);
  };

  beforeEach(async () => {
    await makeEvent({ slug: "akad", name: "Akad", sortOrder: 1 });
    await makeEvent({ slug: "resepsi", name: "Resepsi", sortOrder: 2 });
  });

  it("pratinjau menandai baris ok, duplikat, dan error beserta alasannya", async () => {
    const result = await preview(CSV);
    expect(result.counts).toEqual({ ok: 2, duplicate: 1, error: 3 });
    expect(result.newGroups).toEqual(["Keluarga", "Teman"]);

    const byLine = new Map(result.rows.map((r) => [r.line, r]));
    expect(byLine.get(2)).toMatchObject({ status: "ok", phone: "6281211112222", quota: 4 });
    expect(byLine.get(4)?.status).toBe("duplicate");
    expect(byLine.get(4)?.messages.join(" ")).toContain("baris 2");
    expect(byLine.get(5)?.messages.join(" ")).toContain("Nama undangan wajib diisi");
    expect(byLine.get(6)?.messages.join(" ")).toContain("Isi nomor HP atau Instagram");
    expect(byLine.get(7)?.messages.join(" ")).toContain('Acara "tidak-ada" tidak dikenal');
  });

  it("membaca pemisah titik koma, BOM, dan nama kolom alias", async () => {
    const result = await preview("﻿Nama;No HP;IG;Group;Jumlah\nBudi;0812-1111-2222;;Keluarga;3\n");
    expect(result.counts.ok).toBe(1);
    expect(result.rows[0]).toMatchObject({
      phone: "6281211112222",
      groupName: "Keluarga",
      quota: 3,
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
    const csv = "nama_undangan,hp\nBaru,0812-1111-2222";
    expect((await preview(csv)).rows[0]?.status).toBe("duplicate");

    await api.delete(`/guests/${existing.id}`);
    expect((await preview(csv)).rows[0]?.status).toBe("ok");
  });

  it("commit mengimpor baris ok, melewati duplikat dan error, serta membuat kelompok baru", async () => {
    const res = await api.post("/guests/import/commit", { csv: CSV });
    expect(res.status).toBe(200);
    expect(await read<ImportCommitResponse>(res)).toEqual({
      imported: 2,
      skipped: 4,
      createdGroups: ["Keluarga", "Teman"],
    });

    const { items } = await listGuests();
    expect(items.map((g) => g.displayName)).toEqual(["Budi", "Sari"]);
    expect(items.every((g) => g.source === "import")).toBe(true);
    expect(new Set(items.map((g) => g.code)).size).toBe(2);

    const groups = (await read<{ items: Group[] }>(await api.get("/groups"))).items;
    expect(groups.map((g) => g.name).sort()).toEqual(["Keluarga", "Teman"]);
    expect(groups.find((g) => g.name === "Keluarga")?.guestCount).toBe(1);

    // Kolom acara kosong = semua acara; "resepsi" = hanya resepsi.
    const events = (await read<{ items: Event[] }>(await api.get("/events"))).items;
    const slugOf = (id: string) => events.find((e) => e.id === id)?.slug;
    const invited = (name: string) =>
      items
        .find((g) => g.displayName === name)
        ?.events.map((e) => slugOf(e.eventId))
        .sort();
    expect(invited("Budi")).toEqual(["akad", "resepsi"]);
    expect(invited("Sari")).toEqual(["resepsi"]);
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
    const group = await makeGroup();
    const guest = await makeGuest({
      displayName: '=HYPERLINK("http://jahat.example")',
      groupId: group.id,
      eventIds: [event.id],
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
    expect(text).toContain("resepsi");
    expect(text).toContain(`"'=HYPERLINK(""http://jahat.example"")"`);
    expect(text).not.toMatch(/,=HYPERLINK/);
  });

  it("hasil ekspor bisa diimpor ulang ke sistem kosong", async () => {
    await makeEvent();
    await makeGuest({ displayName: "Budi, Ani & Anak", phone: "0812-1111-2222", quota: 3 });
    const exported = await (await api.get("/guests/export.csv")).text();

    const reset = await loggedInClient(ctx);
    await reset.post("/events", { slug: "resepsi", name: "Resepsi" });
    const res = await reset.post("/guests/import/preview", { csv: exported });
    const result = await read<ImportPreview>(res);
    expect(result.counts).toEqual({ ok: 1, duplicate: 0, error: 0 });
    expect(result.rows[0]).toMatchObject({ displayName: "Budi, Ani & Anak", quota: 3 });
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
