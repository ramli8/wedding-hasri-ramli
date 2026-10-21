import {
  type Dashboard,
  type Device,
  type DeviceEvent,
  MIN_SUPPORTED_SYNC_VERSION,
  type PushResponse,
  type ReviewItem,
  type SnapshotResponse,
  SYNC_PROTOCOL_VERSION,
  SYNC_VERSION_HEADER,
  uuid7,
} from "@wedding/shared";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { devices } from "../src/db/schema.js";
import { type adminClient, createTestContext, loggedInClient } from "./helpers.js";

const ctx = createTestContext();
afterAll(() => ctx.close());

type Api = ReturnType<typeof adminClient>;
type App = ReturnType<typeof ctx.makeApp>;

const read = async <T>(res: Response) => (await res.json()) as T;

/** Klien perangkat: token di header Authorization dan versi protokol di x-sync-version. */
function deviceClient(app: App, token: string, version = SYNC_PROTOCOL_VERSION) {
  const headers = (extra: Record<string, string> = {}) => ({
    authorization: `Bearer ${token}`,
    [SYNC_VERSION_HEADER]: String(version),
    ...extra,
  });
  return {
    snapshot: (query = "") => app.request(`/api/v1/sync/snapshot${query}`, { headers: headers() }),
    push: (body: unknown) =>
      app.request("/api/v1/sync/push", {
        method: "POST",
        headers: headers({ "content-type": "application/json" }),
        body: JSON.stringify(body),
      }),
  };
}

const pairRequest = (app: App, code: string, version: number | null = SYNC_PROTOCOL_VERSION) =>
  app.request("/api/v1/device/pair", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(version === null ? {} : { [SYNC_VERSION_HEADER]: String(version) }),
    },
    body: JSON.stringify({ code }),
  });

let api: Api;
let app: App;

// Jam sesi Surabaya: 21 Mei 2027, 10.00–12.00 WIB.
const SESSION = { startsAt: "2027-05-21T03:00:00Z", endsAt: "2027-05-21T05:00:00Z" };
const IN_SESSION = "2027-05-21T03:30:00.000Z";

type World = Awaited<ReturnType<typeof setupWorld>>;

async function createGuest(overrides: Record<string, unknown>) {
  const res = await api.post("/guests", { phone: "0812-3456-7890", ...overrides });
  expect(res.status).toBe(201);
  return (await read<{ guest: { id: string; code: string } }>(res)).guest;
}

async function setupWorld() {
  api = await loggedInClient(ctx);
  app = ctx.makeApp();

  const eventRes = await api.post("/events", {
    slug: "resepsi",
    name: "Resepsi",
    startsAt: "2027-05-21T03:00:00Z",
    endsAt: "2027-05-21T07:00:00Z",
    checkinEnabled: true,
  });
  const event = (await read<{ event: { id: string } }>(eventRes)).event;

  const groupRes = await api.post("/groups", {
    name: "Surabaya",
    isVip: true,
    sessions: [{ eventId: event.id, ...SESSION }],
  });
  const group = (await read<{ group: { id: string } }>(groupRes)).group;

  const budi = await createGuest({
    displayName: "Bpk. Budi",
    isRombongan: true,
    groupId: group.id,
    usherNote: "Pemain inti",
    eventIds: [event.id],
  });
  const sari = await createGuest({
    displayName: "Sari",
    phone: "0813-0000-0001",
    eventIds: [event.id],
  });
  const joko = await createGuest({
    displayName: "Pak Joko",
    phone: "0813-0000-0002",
    isRombongan: true,
    eventIds: [event.id],
  });
  const outsider = await createGuest({ displayName: "Tidak Diundang", phone: "0813-0000-0003" });

  const pair = async (name: string) => {
    const created = await api.post("/devices", { name });
    const { pairingCode, device } = await read<{ pairingCode: string; device: Device }>(created);
    const paired = await pairRequest(app, pairingCode);
    expect(paired.status).toBe(200);
    const { token } = await read<{ token: string }>(paired);
    return { id: device.id, token, client: deviceClient(app, token) };
  };
  const gateA = await pair("HP Gerbang A");
  const gateB = await pair("HP Gerbang B");

  return { event, group, budi, sari, joko, outsider, gateA, gateB };
}

const checkinEvent = (
  world: World,
  guestId: string,
  overrides: Partial<Extract<DeviceEvent, { kind: "checkin" }>> = {},
): Extract<DeviceEvent, { kind: "checkin" }> => ({
  id: uuid7(),
  kind: "checkin",
  guestId,
  eventId: world.event.id,
  pax: 1,
  method: "qr",
  scannedAt: IN_SESSION,
  ...overrides,
});

const pushBody = (events: DeviceEvent[], extra: Record<string, unknown> = {}) => ({
  deviceTime: new Date().toISOString(),
  appVersion: "test-1",
  pendingOutbox: events.length,
  events,
  ...extra,
});

const dashboard = async () => read<Dashboard>(await api.get("/checkins/dashboard"));

let world: World;
beforeEach(async () => {
  world = await setupWorld();
});

describe("pairing perangkat", () => {
  it("membuat kode berformat XXXX-XXXX yang hanya tampil sekali", async () => {
    const created = await api.post("/devices", { name: "HP Baru" });
    const body = await read<{ pairingCode: string; device: Device }>(created);
    expect(body.pairingCode).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(body.device).toMatchObject({ name: "HP Baru", status: "pending" });
    expect(body.device.pairingExpiresAt).not.toBeNull();

    const list = await read<{ items: Device[] }>(await api.get("/devices"));
    expect(JSON.stringify(list)).not.toContain(body.pairingCode);
    expect(JSON.stringify(list)).not.toContain(body.pairingCode.replace("-", ""));
  });

  it("menukar kode dengan token, kode hangus setelah dipakai, dan perangkat menjadi aktif", async () => {
    const created = await read<{ pairingCode: string; device: Device }>(
      await api.post("/devices", { name: "HP Baru" }),
    );
    const first = await pairRequest(app, created.pairingCode);
    expect(first.status).toBe(200);
    expect(await read(first)).toMatchObject({ deviceName: "HP Baru", deviceId: created.device.id });

    expect((await pairRequest(app, created.pairingCode)).status).toBe(401);

    const list = await read<{ items: Device[] }>(await api.get("/devices"));
    const device = list.items.find((d) => d.id === created.device.id);
    expect(device).toMatchObject({ status: "active", pairingExpiresAt: null });
  });

  it("menerima kode huruf kecil dan tanpa tanda hubung", async () => {
    const created = await read<{ pairingCode: string }>(await api.post("/devices", { name: "X" }));
    const res = await pairRequest(app, created.pairingCode.toLowerCase().replace("-", ""));
    expect(res.status).toBe(200);
  });

  it("menolak kode yang kedaluwarsa dan kode yang salah", async () => {
    const created = await read<{ pairingCode: string; device: Device }>(
      await api.post("/devices", { name: "Lama" }),
    );
    await ctx.db
      .update(devices)
      .set({ pairingExpiresAt: new Date(Date.now() - 1000) })
      .where(eq(devices.id, created.device.id));
    expect((await pairRequest(app, created.pairingCode)).status).toBe(401);
    expect((await pairRequest(app, "AAAA-AAAA")).status).toBe(401);
  });

  it("membatasi percobaan kode salah per IP", async () => {
    for (let i = 0; i < 10; i++) await pairRequest(app, "AAAA-AAAA");
    const blocked = await pairRequest(app, "AAAA-AAAA");
    expect(blocked.status).toBe(429);
  });

  it("memerlukan versi protokol", async () => {
    const created = await read<{ pairingCode: string }>(await api.post("/devices", { name: "X" }));
    const res = await pairRequest(app, created.pairingCode, null);
    expect(res.status).toBe(426);
    expect(await read(res)).toMatchObject({ error: { code: "APP_OUTDATED" } });
  });

  it("perangkat yang dicabut ditolak dengan DEVICE_REVOKED, dan kode pairingnya tidak bisa dipakai", async () => {
    const revoked = await api.post(`/devices/${world.gateA.id}/revoke`);
    expect(revoked.status).toBe(200);
    const res = await world.gateA.client.snapshot();
    expect(res.status).toBe(401);
    expect(await read(res)).toMatchObject({ error: { code: "DEVICE_REVOKED" } });
    // perangkat lain tidak terpengaruh
    expect((await world.gateB.client.snapshot()).status).toBe(200);

    const pending = await read<{ pairingCode: string; device: Device }>(
      await api.post("/devices", { name: "Belum dipasang" }),
    );
    await api.post(`/devices/${pending.device.id}/revoke`);
    expect((await pairRequest(app, pending.pairingCode)).status).toBe(401);
  });
});

describe("akses sinkronisasi", () => {
  it("menolak tanpa token, dengan token asing, dan dengan versi protokol terlalu lama", async () => {
    const anonymous = await app.request("/api/v1/sync/snapshot", {
      headers: { [SYNC_VERSION_HEADER]: String(SYNC_PROTOCOL_VERSION) },
    });
    expect(anonymous.status).toBe(401);
    expect((await deviceClient(app, "token-asing").snapshot()).status).toBe(401);
    expect((await deviceClient(app, world.gateA.token, 0).snapshot()).status).toBe(426);
    // Aplikasi sebelum rombongan (protokol 1) harus diperbarui; datanya tetap aman di perangkat.
    expect(
      (await deviceClient(app, world.gateA.token, MIN_SUPPORTED_SYNC_VERSION - 1).snapshot())
        .status,
    ).toBe(426);
  });

  it("409 bila belum ada acara dengan check-in aktif", async () => {
    await api.put(`/events/${world.event.id}`, {
      slug: "resepsi",
      name: "Resepsi",
      checkinEnabled: false,
    });
    expect((await world.gateA.client.snapshot()).status).toBe(409);
  });
});

describe("snapshot", () => {
  it("unduhan penuh: hanya tamu yang diundang, tanpa data pribadi, dengan kelompok dan sesi", async () => {
    const res = await world.gateA.client.snapshot();
    const snap = await read<SnapshotResponse>(res);

    expect(snap.protocol).toEqual({
      version: SYNC_PROTOCOL_VERSION,
      minSupported: MIN_SUPPORTED_SYNC_VERSION,
    });
    expect(snap.deviceName).toBe("HP Gerbang A");
    expect(snap.event.id).toBe(world.event.id);
    expect(snap.guests.map((g) => g.displayName).sort()).toEqual(["Bpk. Budi", "Pak Joko", "Sari"]);
    expect(snap.guests.every((g) => g.invited)).toBe(true);
    expect(snap.groups).toEqual([
      { id: world.group.id, name: "Surabaya", color: "#737373", isVip: true },
    ]);
    expect(snap.sessions).toHaveLength(1);

    const budi = snap.guests.find((g) => g.id === world.budi.id);
    expect(budi).toMatchObject({
      code: world.budi.code,
      isRombongan: true,
      usherNote: "Pemain inti",
    });
    // HP dan Instagram tidak boleh sampai ke perangkat penjaga
    expect(JSON.stringify(snap)).not.toMatch(/"phone"|"instagram"|6281234567890/);
    expect(snap.guestRev).toBeGreaterThan(0);
  });

  it("delta: kosong bila tak ada perubahan; memuat tamu yang berubah, dihapus, atau dicabut undangannya", async () => {
    const full = await read<SnapshotResponse>(await world.gateA.client.snapshot());
    const unchanged = await read<SnapshotResponse>(
      await world.gateA.client.snapshot(`?sinceRev=${full.guestRev}&sinceSeq=${full.checkinSeq}`),
    );
    expect(unchanged.guests).toEqual([]);
    expect(unchanged.events).toEqual([]);

    await api.put(`/guests/${world.sari.id}`, {
      displayName: "Sari Rahma",
      phone: "0813-0000-0001",
      eventIds: [world.event.id],
    });
    await api.put(`/guests/${world.joko.id}`, {
      displayName: "Pak Joko",
      phone: "0813-0000-0002",
      eventIds: [],
    });
    await api.delete(`/guests/${world.budi.id}`);

    const delta = await read<SnapshotResponse>(
      await world.gateA.client.snapshot(`?sinceRev=${full.guestRev}`),
    );
    const byId = new Map(delta.guests.map((g) => [g.id, g]));
    expect(byId.get(world.sari.id)).toMatchObject({ displayName: "Sari Rahma", invited: true });
    expect(byId.get(world.joko.id)?.invited).toBe(false);
    expect(byId.get(world.budi.id)?.invited).toBe(false);
    expect(byId.has(world.outsider.id)).toBe(false);
  });
});

describe("push check-in", () => {
  it("menyimpan event, dan mengirim ulang event yang sama menghasilkan noop", async () => {
    const e = checkinEvent(world, world.budi.id, { pax: 4 });
    const first = await read<PushResponse>(await world.gateA.client.push(pushBody([e])));
    expect(first.results).toEqual([{ id: e.id, status: "stored" }]);

    const again = await read<PushResponse>(await world.gateA.client.push(pushBody([e])));
    expect(again.results).toEqual([{ id: e.id, status: "noop" }]);

    const snap = await read<SnapshotResponse>(await world.gateB.client.snapshot());
    expect(snap.events).toHaveLength(1);
    expect(snap.events[0]).toMatchObject({ id: e.id, pax: 4, deviceId: world.gateA.id });
    expect(snap.devices).toEqual([{ id: world.gateA.id, name: "HP Gerbang A" }]);
    expect(snap.checkinSeq).toBe(snap.events[0]?.seq);

    // pembaruan berikutnya hanya memuat event yang belum dilihat
    const delta = await read<SnapshotResponse>(
      await world.gateB.client.snapshot(`?sinceSeq=${snap.checkinSeq}`),
    );
    expect(delta.events).toEqual([]);
  });

  it("menolak event untuk tamu atau acara yang tidak dikenal, tanpa menggagalkan event lain", async () => {
    const good = checkinEvent(world, world.sari.id);
    const unknownGuest = checkinEvent(world, uuid7());
    const wrongEvent = checkinEvent(world, world.sari.id, { eventId: uuid7() });
    const res = await read<PushResponse>(
      await world.gateA.client.push(pushBody([unknownGuest, good, wrongEvent])),
    );
    expect(res.results.map((r) => r.status)).toEqual(["invalid", "stored", "invalid"]);
    expect(res.results[0]?.reason).toContain("Tamu tidak dikenal");
  });

  it("menolak body yang tidak valid", async () => {
    const res = await world.gateA.client.push(
      pushBody([{ ...checkinEvent(world, world.sari.id), pax: 0 }]),
    );
    expect(res.status).toBe(400);
  });

  it("undo: boleh dari perangkat yang sama dalam 2 menit, ditolak dari perangkat lain atau setelahnya", async () => {
    const target = checkinEvent(world, world.budi.id, { pax: 4 });
    await world.gateA.client.push(pushBody([target]));

    const base = Date.parse(IN_SESSION);
    const undoAt = (ms: number): DeviceEvent => ({
      id: uuid7(),
      kind: "undo",
      guestId: world.budi.id,
      eventId: world.event.id,
      targetId: target.id,
      scannedAt: new Date(base + ms).toISOString(),
    });

    const fromOther = await read<PushResponse>(
      await world.gateB.client.push(pushBody([undoAt(10_000)])),
    );
    expect(fromOther.results[0]).toMatchObject({ status: "invalid" });
    expect(fromOther.results[0]?.reason).toContain("perangkat yang sama");

    const tooLate = await read<PushResponse>(
      await world.gateA.client.push(pushBody([undoAt(121_000)])),
    );
    expect(tooLate.results[0]).toMatchObject({ status: "invalid" });
    expect(tooLate.results[0]?.reason).toContain("2 menit");

    const ok = await read<PushResponse>(await world.gateA.client.push(pushBody([undoAt(60_000)])));
    expect(ok.results[0]?.status).toBe("stored");

    const dash = await dashboard();
    expect(dash.totals.arrived).toBe(0);
  });

  it("set_pax mengubah jumlah orang yang dihitung", async () => {
    const target = checkinEvent(world, world.budi.id, { pax: 4 });
    const change: DeviceEvent = {
      id: uuid7(),
      kind: "set_pax",
      guestId: world.budi.id,
      eventId: world.event.id,
      targetId: target.id,
      pax: 3,
      scannedAt: new Date(Date.parse(IN_SESSION) + 20_000).toISOString(),
    };
    await world.gateA.client.push(pushBody([target, change]));
    const dash = await dashboard();
    expect(dash.totals).toMatchObject({ arrived: 1, arrivedPax: 3 });
  });

  it("menandai check-in di luar jam sesi hanya sebagai catatan, tanpa menolaknya", async () => {
    const outside = checkinEvent(world, world.budi.id, { scannedAt: "2027-05-21T08:00:00.000Z" });
    const inside = checkinEvent(world, world.sari.id); // Sari tanpa kelompok: tidak punya sesi
    const res = await read<PushResponse>(
      await world.gateA.client.push(pushBody([outside, inside])),
    );
    expect(res.results.map((r) => r.status)).toEqual(["stored", "stored"]);

    const dash = await dashboard();
    expect(dash.totals).toMatchObject({ arrived: 2, outsideSession: 1 });
    expect(dash.recent.find((r) => r.displayName === "Bpk. Budi")?.outsideSession).toBe(true);
    expect(dash.recent.find((r) => r.displayName === "Sari")?.outsideSession).toBe(false);
  });

  it("mencatat status perangkat: terakhir sinkron, antrean, dan versi aplikasi", async () => {
    await world.gateA.client.push(pushBody([], { pendingOutbox: 7, appVersion: "2.3.4" }));
    const list = await read<{ items: Device[] }>(await api.get("/devices"));
    const gateA = list.items.find((d) => d.id === world.gateA.id);
    expect(gateA).toMatchObject({
      pendingOutbox: 7,
      appVersion: "2.3.4",
      protocolVersion: SYNC_PROTOCOL_VERSION,
    });
    expect(gateA?.lastSyncAt).not.toBeNull();
  });
});

describe("tamu walk-in", () => {
  it("dibuat di server dengan kode, diundang ke acara, dan bisa langsung check-in dalam push yang sama", async () => {
    const walkinId = uuid7();
    const body = pushBody([checkinEvent(world, walkinId, { method: "walkin", pax: 2 })], {
      walkins: [
        {
          id: walkinId,
          eventId: world.event.id,
          displayName: "Rekan Kerja Mempelai",
          isRombongan: true,
        },
      ],
    });
    const res = await read<PushResponse>(await world.gateA.client.push(body));
    expect(res.results[0]?.status).toBe("stored");
    expect(res.walkinCodes).toHaveLength(1);
    expect(res.walkinCodes[0]?.id).toBe(walkinId);
    expect(res.walkinCodes[0]?.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);

    const guests = await read<{ items: { id: string; source: string; events: unknown[] }[] }>(
      await api.get("/guests?q=Rekan"),
    );
    expect(guests.items[0]).toMatchObject({ id: walkinId, source: "walkin" });
    expect(guests.items[0]?.events).toHaveLength(1);

    const dash = await dashboard();
    expect(dash.totals).toMatchObject({ walkins: 1, arrived: 1, arrivedPax: 2, invited: 4 });

    // mengirim ulang mengembalikan kode yang sama
    const again = await read<PushResponse>(await world.gateA.client.push(body));
    expect(again.walkinCodes).toEqual(res.walkinCodes);
    expect(again.results[0]?.status).toBe("noop");
  });

  it("tamu walk-in muncul di snapshot perangkat lain", async () => {
    const walkinId = uuid7();
    await world.gateA.client.push(
      pushBody([], {
        walkins: [{ id: walkinId, eventId: world.event.id, displayName: "Tamu Mendadak" }],
      }),
    );
    const snap = await read<SnapshotResponse>(await world.gateB.client.snapshot());
    const walkin = snap.guests.find((g) => g.id === walkinId);
    expect(walkin).toMatchObject({ displayName: "Tamu Mendadak", source: "walkin", invited: true });
    expect(walkin?.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});

describe("duplikat dan keputusan admin", () => {
  async function makeDuplicate() {
    const early = checkinEvent(world, world.budi.id, { pax: 4, scannedAt: IN_SESSION });
    const late = checkinEvent(world, world.budi.id, {
      pax: 3,
      scannedAt: "2027-05-21T03:30:30.000Z",
    });
    // Perangkat B yang lebih lambat sinkron dulu, perangkat A belakangan: hasil tetap sama.
    await world.gateB.client.push(pushBody([late]));
    await world.gateA.client.push(pushBody([early]));
    return { early, late };
  }

  it("check-in paling awal menang; yang kedua masuk antrean review dengan rincian perangkat", async () => {
    const { early, late } = await makeDuplicate();

    const dash = await dashboard();
    expect(dash.totals).toMatchObject({ arrived: 1, arrivedPax: 4, needsReview: 1 });
    expect(dash.recent[0]).toMatchObject({ hasDuplicates: true, deviceName: "HP Gerbang A" });

    const review = await read<{ items: ReviewItem[] }>(await api.get("/checkins/review"));
    expect(review.items).toHaveLength(1);
    const item = review.items[0];
    expect(item).toMatchObject({ displayName: "Bpk. Budi", groupName: "Surabaya" });
    expect(item?.primary).toMatchObject({ id: early.id, pax: 4, deviceName: "HP Gerbang A" });
    expect(item?.duplicates[0]).toMatchObject({ id: late.id, pax: 3, deviceName: "HP Gerbang B" });
  });

  it("keep_first menutup review tanpa mengubah jumlah; merge_pax menjumlahkan", async () => {
    await makeDuplicate();
    const resolve = (resolution: string) =>
      api.post("/checkins/resolve", {
        guestId: world.budi.id,
        eventId: world.event.id,
        resolution,
        note: "dicek di pintu",
      });

    expect((await resolve("keep_first")).status).toBe(200);
    let dash = await dashboard();
    expect(dash.totals).toMatchObject({ needsReview: 0, arrivedPax: 4 });
    expect((await read<{ items: unknown[] }>(await api.get("/checkins/review"))).items).toEqual([]);

    expect((await resolve("merge_pax")).status).toBe(200);
    dash = await dashboard();
    expect(dash.totals).toMatchObject({ needsReview: 0, arrivedPax: 7 });
  });

  it("admin bisa membatalkan dan mengubah jumlah tanpa batas waktu; tidak bisa membatalkan dua kali", async () => {
    const e = checkinEvent(world, world.joko.id, { pax: 2, scannedAt: "2026-01-01T00:00:00.000Z" });
    await world.gateA.client.push(pushBody([e]));

    expect((await api.post(`/checkins/${e.id}/pax`, { pax: 1 })).status).toBe(200);
    expect((await dashboard()).totals.arrivedPax).toBe(1);
    expect((await api.post(`/checkins/${e.id}/pax`, { pax: 0 })).status).toBe(400);

    expect((await api.post(`/checkins/${e.id}/undo`)).status).toBe(200);
    expect((await dashboard()).totals.arrived).toBe(0);
    expect((await api.post(`/checkins/${e.id}/undo`)).status).toBe(409);
    expect((await api.post(`/checkins/${uuid7()}/undo`)).status).toBe(404);

    const log = await read<{ items: { kind: string; byAdmin: boolean }[]; total: number }>(
      await api.get("/checkins/log"),
    );
    expect(log.total).toBe(3);
    expect(log.items.map((i) => i.kind)).toEqual(["undo", "set_pax", "checkin"]);
    expect(log.items.map((i) => i.byAdmin)).toEqual([true, true, false]);
  });
});

describe("dashboard", () => {
  it("menghitung undangan, kedatangan, orang, dan rekap per kelompok", async () => {
    await world.gateA.client.push(
      pushBody([
        checkinEvent(world, world.budi.id, { pax: 3 }),
        checkinEvent(world, world.sari.id, { pax: 1 }),
      ]),
    );
    const dash = await dashboard();
    expect(dash.event).toEqual({ id: world.event.id, name: "Resepsi" });
    expect(dash.totals).toMatchObject({
      invited: 3,
      arrived: 2,
      arrivedPax: 4,
      needsReview: 0,
      walkins: 0,
    });

    const surabaya = dash.groups.find((g) => g.name === "Surabaya");
    expect(surabaya).toMatchObject({
      invited: 1,
      arrived: 1,
      pax: 3,
      isVip: true,
    });
    const none = dash.groups.find((g) => g.name === "Tanpa kelompok");
    expect(none).toMatchObject({ invited: 2, arrived: 1, pax: 1 });

    expect(dash.devices.map((d) => d.name)).toEqual(["HP Gerbang A", "HP Gerbang B"]);
  });

  it("acara dengan data check-in tidak bisa dihapus", async () => {
    await world.gateA.client.push(pushBody([checkinEvent(world, world.sari.id)]));
    expect((await api.delete(`/events/${world.event.id}`)).status).toBe(409);
  });
});

describe("konkurensi", () => {
  it("push bersamaan dari banyak perangkat: semua tersimpan dan seq tiap push berurutan tanpa celah", async () => {
    const batches = [world.gateA, world.gateB, world.gateA, world.gateB].map(() =>
      Array.from({ length: 12 }, (_, i) =>
        checkinEvent(world, [world.budi.id, world.sari.id, world.joko.id][i % 3] as string, {
          scannedAt: new Date(Date.parse(IN_SESSION) + i * 1000).toISOString(),
        }),
      ),
    );
    const gates = [world.gateA, world.gateB, world.gateA, world.gateB];
    const results = await Promise.all(
      batches.map((events, i) => (gates[i] as typeof world.gateA).client.push(pushBody(events))),
    );
    for (const res of results) expect(res.status).toBe(200);

    const snap = await read<SnapshotResponse>(await world.gateA.client.snapshot());
    expect(snap.events).toHaveLength(48);
    const seqs = snap.events.map((e) => e.seq);
    expect(new Set(seqs).size).toBe(48);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));

    // Setiap push menulis di bawah kunci, jadi event satu push menempati seq yang bersebelahan.
    for (const events of batches) {
      const mine = snap.events.filter((e) => events.some((x) => x.id === e.id)).map((e) => e.seq);
      expect(mine).toHaveLength(12);
      expect((mine.at(-1) ?? 0) - (mine[0] ?? 0)).toBe(11);
    }
  });
});
