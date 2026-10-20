import {
  CHECKIN_UNDO_WINDOW_MS,
  type PushRequest,
  type SnapshotGuest,
  type SnapshotResponse,
  type StoredEvent,
  uuid7,
} from "@wedding/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api.js";
import {
  addWalkin,
  changePax,
  checkIn,
  extractCode,
  handleScan,
  isCheckedIn,
  undoCheckin,
} from "./actions.js";
import { clockOffset, correctedNow, updateClockOffset } from "./clock.js";
import { db, getMeta, pendingCount, resetDevice, setMeta } from "./db.js";
import { deviceApi } from "./device-api.js";
import { searchGuests } from "./search.js";
import { SyncEngine } from "./sync.js";

vi.mock("./device-api.js", () => ({
  deviceApi: { pair: vi.fn(), snapshot: vi.fn(), push: vi.fn() },
}));

const push = vi.mocked(deviceApi.push);
const snapshot = vi.mocked(deviceApi.snapshot);

const EVENT = {
  id: "00000000-0000-4000-8000-0000000000e1",
  slug: "resepsi",
  name: "Resepsi",
  startsAt: null,
  endsAt: null,
};
const ME = "00000000-0000-4000-8000-0000000000d1";
const OTHER = "00000000-0000-4000-8000-0000000000d2";
const GROUP = "00000000-0000-4000-8000-0000000000a1";

let counter = 0;
const id = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;

function guest(overrides: Partial<SnapshotGuest> = {}): SnapshotGuest {
  return {
    id: id(),
    code: "ABC234",
    displayName: "Bpk. Budi",
    fullName: null,
    groupId: null,
    quota: 4,
    usherNote: null,
    source: "admin",
    invited: true,
    rev: 1,
    ...overrides,
  };
}

function snap(overrides: Partial<SnapshotResponse> = {}): SnapshotResponse {
  return {
    serverTime: new Date().toISOString(),
    protocol: { version: 1, minSupported: 1 },
    deviceName: "HP Gerbang A",
    event: EVENT,
    groups: [{ id: GROUP, name: "Surabaya", color: "#737373", isVip: true, gate: "A" }],
    sessions: [],
    guests: [],
    guestRev: 0,
    events: [],
    checkinSeq: 0,
    devices: [],
    ...overrides,
  };
}

function stored(overrides: Partial<StoredEvent> & Pick<StoredEvent, "guestId">): StoredEvent {
  return {
    seq: 1,
    id: id(),
    kind: "checkin",
    eventId: EVENT.id,
    targetId: null,
    pax: 1,
    method: "qr",
    deviceId: OTHER,
    adminId: null,
    scannedAt: new Date().toISOString(),
    outsideSession: false,
    ...overrides,
  };
}

async function seed(...guests: SnapshotGuest[]) {
  await db.guests.bulkPut(guests);
  await setMeta("event", EVENT);
  await setMeta("auth", { token: "token-uji", deviceId: ME, deviceName: "HP Gerbang A" });
}

beforeEach(async () => {
  await resetDevice();
  vi.resetAllMocks();
  vi.useRealTimers();
  await updateClockOffset(new Date().toISOString(), Date.now(), Date.now()); // offset ~0
});
afterEach(() => vi.useRealTimers());

describe("extractCode", () => {
  it.each([
    ["ABC234", "ABC234"],
    ["  abc234 \n", "ABC234"],
    ["https://nikah.example/u/abc234", "ABC234"],
    ["https://nikah.example/u/ABC234?x=1", "ABC234"],
  ])("%j → %s", (raw, expected) => {
    expect(extractCode(raw)).toBe(expected);
  });

  it.each(["", "ABC23", "ABC2345", "ABC10O", "bukan kode", "https://nikah.example/u/ABC10O"])(
    "menolak %j",
    (raw) => {
      expect(extractCode(raw)).toBeNull();
    },
  );
});

describe("check-in", () => {
  it("mencatat sekali dengan jumlah = kuota; scan kedua menjadi 'sudah masuk' tanpa menulis lagi", async () => {
    const budi = guest({ quota: 4 });
    await seed(budi);

    const first = await handleScan("abc234", "qr");
    expect(first).toMatchObject({ status: "ok", pax: 4 });
    const written = await db.outbox.toArray();
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({
      kind: "checkin",
      guestId: budi.id,
      pax: 4,
      method: "qr",
      eventId: EVENT.id,
    });

    const second = await handleScan("ABC234", "qr");
    expect(second).toMatchObject({ status: "already", pax: 4, by: "perangkat ini" });
    expect(await db.outbox.count()).toBe(1);
    expect(await isCheckedIn(budi.id)).toBe(true);
  });

  it("tamu yang sudah diterima perangkat lain (dari server) tidak dicatat ulang", async () => {
    const budi = guest();
    await seed(budi);
    await db.devices.put({ id: OTHER, name: "HP Gerbang B" });
    await db.events.put(stored({ guestId: budi.id, pax: 3 }));

    const result = await handleScan("ABC234");
    expect(result).toMatchObject({ status: "already", pax: 3, by: "HP Gerbang B" });
    expect(await pendingCount()).toBe(0);
  });

  it("kode tidak dikenal, atau bukan kode, menjadi invalid", async () => {
    await seed(guest());
    expect(await handleScan("ZZZZZZ")).toMatchObject({ status: "invalid", code: "ZZZZZZ" });
    expect(await handleScan("ngawur")).toMatchObject({ status: "invalid" });
    expect(await pendingCount()).toBe(0);
  });

  it("menyertakan kelompok untuk penanda VIP di layar", async () => {
    const vip = guest({ groupId: GROUP });
    await seed(vip);
    await db.groups.put({ id: GROUP, name: "Surabaya", color: "#737373", isVip: true, gate: "A" });
    const result = await handleScan("ABC234");
    expect(result.status === "ok" && result.view.group?.isVip).toBe(true);
  });

  it("memakai jam terkoreksi: perangkat yang jamnya terlambat 5 menit tetap menulis waktu server", async () => {
    await seed(guest());
    const deviceNow = Date.now();
    // server 5 menit di depan jam perangkat
    await updateClockOffset(new Date(deviceNow + 300_000).toISOString(), deviceNow, deviceNow);
    expect(clockOffset()).toBeGreaterThan(299_000);

    await handleScan("ABC234");
    const [event] = await db.outbox.toArray();
    const written = Date.parse(event?.scannedAt ?? "");
    expect(Math.abs(written - correctedNow())).toBeLessThan(2000);
    expect(written - Date.now()).toBeGreaterThan(290_000);
  });
});

describe("koreksi", () => {
  it("undo dalam 2 menit membatalkan; tamu bisa dicatat lagi sesudahnya", async () => {
    const budi = guest();
    await seed(budi);
    const first = await handleScan("ABC234");
    if (first.status !== "ok") throw new Error("harus ok");

    await undoCheckin(first.checkinId);
    const kinds = (await db.outbox.orderBy("createdAt").toArray()).map((e) => e.kind);
    expect(kinds).toEqual(["checkin", "undo"]);
    expect(await isCheckedIn(budi.id)).toBe(false);

    expect((await handleScan("ABC234")).status).toBe("ok");
  });

  it("undo dan ubah jumlah ditolak setelah 2 menit", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    await seed(guest());
    const first = await handleScan("ABC234");
    if (first.status !== "ok") throw new Error("harus ok");

    vi.setSystemTime(Date.now() + CHECKIN_UNDO_WINDOW_MS + 1000);
    await expect(undoCheckin(first.checkinId)).rejects.toThrow(/2 menit/);
    await expect(changePax(first.checkinId, 2)).rejects.toThrow(/2 menit/);
    expect(await db.outbox.count()).toBe(1);
  });

  it("mengubah jumlah memperbarui hitungan, dan menolak jumlah yang tidak masuk akal", async () => {
    await seed(guest({ quota: 4 }));
    const first = await handleScan("ABC234");
    if (first.status !== "ok") throw new Error("harus ok");

    await changePax(first.checkinId, 2);
    expect(await handleScan("ABC234")).toMatchObject({ status: "already", pax: 2 });
    await expect(changePax(first.checkinId, 0)).rejects.toThrow();
    await expect(changePax(first.checkinId, 501)).rejects.toThrow();
    await expect(changePax(first.checkinId, 1.5)).rejects.toThrow();
  });

  it("tidak boleh mengoreksi check-in milik perangkat lain atau yang tidak ada", async () => {
    const budi = guest();
    await seed(budi);
    const theirs = stored({ guestId: budi.id });
    await db.events.put(theirs);
    await expect(undoCheckin(theirs.id)).rejects.toThrow(/perangkat yang sama/);
    await expect(undoCheckin(uuid7())).rejects.toThrow(/tidak ditemukan/);
  });
});

describe("tamu walk-in", () => {
  it("dibuat lokal tanpa kode, langsung tercatat masuk, dan antre untuk dikirim", async () => {
    await seed();
    const result = await addWalkin({ displayName: "  Tamu Mendadak ", quota: 2, phone: "0812" });
    expect(result).toMatchObject({ status: "ok", pax: 2 });

    const walkins = await db.walkins.toArray();
    expect(walkins).toHaveLength(1);
    expect(walkins[0]).toMatchObject({ displayName: "Tamu Mendadak", quota: 2, eventId: EVENT.id });

    const local = await db.guests.get(walkins[0]?.id ?? "");
    expect(local).toMatchObject({ code: null, source: "walkin", invited: true });
    const [event] = await db.outbox.toArray();
    expect(event).toMatchObject({ kind: "checkin", method: "walkin", guestId: walkins[0]?.id });
  });
});

describe("pencarian offline", () => {
  it("menemukan dengan awalan dan salah ketik, serta cocok persis untuk kode", async () => {
    await seed(
      guest({ displayName: "Bpk. Budi Santoso", code: "ABC234" }),
      guest({ displayName: "Sari Rahma", code: "DEF567" }),
      guest({ displayName: "Pak Joko", code: "GHJ789" }),
    );
    const names = async (q: string) => (await searchGuests(q)).map((g) => g.displayName);

    expect(await names("bud")).toEqual(["Bpk. Budi Santoso"]);
    expect(await names("sari")).toEqual(["Sari Rahma"]);
    expect(await names("Budy")).toEqual(["Bpk. Budi Santoso"]); // salah ketik
    expect(await names("def567")).toEqual(["Sari Rahma"]);
    expect(await names("b")).toEqual([]); // terlalu pendek
    expect(await names("tidak-ada")).toEqual([]);
  });

  it("indeks mengikuti perubahan daftar tamu", async () => {
    await seed(guest({ displayName: "Lama", code: "ABC234" }));
    expect(await searchGuests("baru")).toEqual([]);
    await db.guests.put(guest({ displayName: "Baru Datang", code: "DEF567" }));
    expect((await searchGuests("baru")).map((g) => g.displayName)).toEqual(["Baru Datang"]);
  });
});

// --- Sinkronisasi ---------------------------------------------------------------------------------------

describe("SyncEngine", () => {
  const ok = (body: PushRequest, extra: Record<string, unknown> = {}) => ({
    serverTime: new Date().toISOString(),
    results: (body.events ?? []).map((e) => ({ id: e.id, status: "stored" as const })),
    walkinCodes: [],
    ...extra,
  });

  async function engineWithAuth() {
    await setMeta("auth", { token: "token-uji", deviceId: ME, deviceName: "HP Gerbang A" });
    snapshot.mockResolvedValue(snap());
    return new SyncEngine();
  }

  it("mengirim outbox lalu menghapusnya setelah dikonfirmasi; body tanpa field internal", async () => {
    await seed(guest());
    await handleScan("ABC234");
    const engine = new SyncEngine();
    push.mockImplementation(async (_token, body) => ok(body));
    snapshot.mockResolvedValue(snap());

    await engine.syncNow();

    expect(push).toHaveBeenCalledTimes(1);
    const body = push.mock.calls[0]?.[1] as PushRequest;
    expect(body.events).toHaveLength(1);
    expect(body.pendingOutbox).toBe(1);
    expect(JSON.stringify(body)).not.toContain("createdAt");
    expect(await pendingCount()).toBe(0);
    expect(engine.getSnapshot()).toMatchObject({ online: true, lastError: null });
    expect(engine.getSnapshot().lastSyncAt).not.toBeNull();
  });

  it("gagal jaringan: outbox utuh dan status offline; berhasil di percobaan berikutnya", async () => {
    await seed(guest());
    await handleScan("ABC234");
    const engine = new SyncEngine();
    push.mockRejectedValueOnce(new ApiError(0, "NETWORK", "Tidak bisa terhubung ke server"));
    push.mockImplementation(async (_token, body) => ok(body));
    snapshot.mockResolvedValue(snap());

    await engine.syncNow();
    expect(await db.outbox.count()).toBe(1);
    expect(engine.getSnapshot()).toMatchObject({
      online: false,
      lastError: "Tidak bisa terhubung ke server",
    });

    await engine.syncNow();
    expect(await pendingCount()).toBe(0);
    expect(engine.getSnapshot().online).toBe(true);
  });

  it("event yang ditolak server dicatat sebagai ditolak dan keluar dari outbox", async () => {
    await seed(guest());
    const first = await handleScan("ABC234");
    if (first.status !== "ok") throw new Error("harus ok");
    await undoCheckin(first.checkinId);
    const engine = new SyncEngine();
    push.mockImplementation(async (_token, body) =>
      ok(body, {
        results: (body.events ?? []).map((e) =>
          e.kind === "undo"
            ? { id: e.id, status: "invalid", reason: "Batas waktu koreksi lewat" }
            : { id: e.id, status: "stored" },
        ),
      }),
    );
    snapshot.mockResolvedValue(snap());

    await engine.syncNow();
    expect(await pendingCount()).toBe(0);
    const rejected = await db.rejected.toArray();
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({ kind: "undo", reason: "Batas waktu koreksi lewat" });
  });

  it("kode untuk tamu walk-in dari server dipasang ke tamu lokal dan antreannya bersih", async () => {
    await seed();
    await addWalkin({ displayName: "Tamu Mendadak", quota: 1 });
    const walkin = (await db.walkins.toArray())[0];
    const engine = new SyncEngine();
    push.mockImplementation(async (_t, body) =>
      ok(body, { walkinCodes: [{ id: walkin?.id, code: "WLK234" }] }),
    );
    // sudah pernah mengunduh: pembaruan kosong tidak boleh menghapus tamu lokal
    await setMeta("guestRev", 5);
    snapshot.mockResolvedValue(snap({ guestRev: 5 }));

    await engine.syncNow();
    expect(await db.walkins.count()).toBe(0);
    expect((await db.guests.get(walkin?.id ?? ""))?.code).toBe("WLK234");
    // sekarang bisa dicari dan di-scan dengan kodenya
    expect((await handleScan("WLK234")).status).toBe("already");
  });

  it("mengirim outbox besar per 200 event", async () => {
    await seed(guest());
    const events = Array.from({ length: 450 }, (_, i) => ({
      id: uuid7(Date.now() + i),
      kind: "checkin" as const,
      guestId: id(),
      eventId: EVENT.id,
      pax: 1,
      method: "qr" as const,
      scannedAt: new Date().toISOString(),
      createdAt: i,
    }));
    await db.outbox.bulkPut(events);
    const engine = new SyncEngine();
    push.mockImplementation(async (_t, body) => ok(body));
    snapshot.mockResolvedValue(snap());

    await engine.syncNow();
    expect(push.mock.calls.map((c) => (c[1] as PushRequest).events?.length)).toEqual([
      200, 200, 50,
    ]);
    expect(await pendingCount()).toBe(0);
  });

  it("push berhasil tetapi pull gagal: perangkat tetap ingat check-in miliknya (tidak jadi duplikat)", async () => {
    const budi = guest();
    await seed(budi);
    await handleScan("ABC234");
    const engine = new SyncEngine();
    push.mockImplementation(async (_t, body) => ok(body));
    snapshot.mockRejectedValue(new ApiError(0, "NETWORK", "Tidak bisa terhubung ke server"));

    await engine.syncNow();
    // server sudah menerima, jadi tidak lagi dihitung antre; tetapi data server belum tertarik
    expect(await pendingCount()).toBe(0);
    expect(await db.events.count()).toBe(0);

    // scan ulang tamu yang sama harus "sudah masuk", bukan check-in kedua
    expect(await handleScan("ABC234")).toMatchObject({ status: "already", by: "perangkat ini" });
    expect(await db.outbox.count()).toBe(1);
  });

  it("event terkirim dihapus dari outbox setelah muncul di data server, dan status tetap benar", async () => {
    const budi = guest();
    await seed(budi);
    const first = await handleScan("ABC234");
    if (first.status !== "ok") throw new Error("harus ok");
    const engine = new SyncEngine();
    push.mockImplementation(async (_t, body) => ok(body));

    snapshot.mockResolvedValueOnce(snap({ guests: [budi], guestRev: 1 }));
    await engine.syncNow();
    expect(await db.outbox.count()).toBe(1); // terkirim, menunggu terlihat di server

    const asStored = stored({
      guestId: budi.id,
      id: first.checkinId,
      seq: 1,
      deviceId: ME,
      pax: 4,
    });
    snapshot.mockResolvedValueOnce(snap({ events: [asStored], checkinSeq: 1, guestRev: 1 }));
    await engine.syncNow();

    expect(await db.outbox.count()).toBe(0);
    expect(await db.events.count()).toBe(1);
    expect(await handleScan("ABC234")).toMatchObject({
      status: "already",
      pax: 4,
      by: "perangkat ini",
    });
  });

  describe("menarik data", () => {
    it("unduhan penuh menyimpan tamu, kelompok, acara, dan penanda sinkronisasi", async () => {
      const engine = await engineWithAuth();
      const a = guest({ displayName: "A", code: "AAA222", rev: 5 });
      const b = guest({ displayName: "B", code: "BBB222", rev: 7 });
      push.mockImplementation(async (_t, body) => ok(body));
      snapshot.mockResolvedValue(snap({ guests: [a, b], guestRev: 7, checkinSeq: 0 }));

      await engine.syncNow();
      expect(snapshot).toHaveBeenCalledWith("token-uji", { rev: 0, seq: 0 });
      expect((await db.guests.toArray()).map((g) => g.displayName).sort()).toEqual(["A", "B"]);
      expect(await db.groups.count()).toBe(1);
      expect(await getMeta("guestRev")).toBe(7);
      expect((await getMeta("event"))?.name).toBe("Resepsi");
    });

    it("pembaruan berikutnya hanya meminta yang baru, membuang tamu yang tidak diundang, dan menggabungkan event", async () => {
      const engine = await engineWithAuth();
      const keep = guest({ displayName: "Tetap", code: "KEP222", rev: 3 });
      const drop = guest({ displayName: "Dibuang", code: "DRP222", rev: 3 });
      push.mockImplementation(async (_t, body) => ok(body));
      snapshot.mockResolvedValueOnce(snap({ guests: [keep, drop], guestRev: 3 }));
      await engine.syncNow();

      const e = stored({ guestId: keep.id, seq: 11 });
      snapshot.mockResolvedValueOnce(
        snap({
          guests: [{ ...drop, invited: false, rev: 9 }],
          guestRev: 9,
          events: [e],
          checkinSeq: 11,
          devices: [{ id: OTHER, name: "HP Gerbang B" }],
        }),
      );
      await engine.syncNow();

      expect(snapshot).toHaveBeenLastCalledWith("token-uji", { rev: 3, seq: 0 });
      expect((await db.guests.toArray()).map((g) => g.displayName)).toEqual(["Tetap"]);
      expect(await db.events.count()).toBe(1);
      expect(await getMeta("checkinSeq")).toBe(11);
      expect((await db.devices.get(OTHER))?.name).toBe("HP Gerbang B");
      // sinkronisasi ketiga meminta mulai dari penanda terbaru
      snapshot.mockResolvedValueOnce(snap({ guestRev: 9, checkinSeq: 11 }));
      await engine.syncNow();
      expect(snapshot).toHaveBeenLastCalledWith("token-uji", { rev: 9, seq: 11 });
    });

    it("acara check-in berganti: data lama dibuang dan diunduh ulang dari nol", async () => {
      const engine = await engineWithAuth();
      push.mockImplementation(async (_t, body) => ok(body));
      snapshot.mockResolvedValueOnce(
        snap({ guests: [guest({ displayName: "Lama" })], guestRev: 5, checkinSeq: 2 }),
      );
      await engine.syncNow();

      const newEvent = { ...EVENT, id: "00000000-0000-4000-8000-0000000000e2", name: "Akad" };
      snapshot.mockResolvedValueOnce(
        snap({ event: newEvent, guests: [], guestRev: 5, checkinSeq: 2 }),
      );
      snapshot.mockResolvedValueOnce(
        snap({
          event: newEvent,
          guests: [guest({ displayName: "Baru" })],
          guestRev: 6,
          checkinSeq: 0,
        }),
      );
      await engine.syncNow();

      expect(snapshot).toHaveBeenLastCalledWith("token-uji", { rev: 0, seq: 0 });
      expect((await db.guests.toArray()).map((g) => g.displayName)).toEqual(["Baru"]);
      expect((await getMeta("event"))?.name).toBe("Akad");
    });
  });

  describe("kondisi khusus", () => {
    it("perangkat dicabut: status tersimpan dan sinkronisasi berikutnya tidak menghubungi server", async () => {
      const engine = await engineWithAuth();
      push.mockRejectedValue(new ApiError(401, "DEVICE_REVOKED", "Perangkat ini sudah dicabut"));
      await engine.syncNow();
      expect(engine.getSnapshot().revoked).toBe(true);
      expect(await getMeta("revoked")).toBe(true);

      push.mockClear();
      await engine.syncNow();
      expect(push).not.toHaveBeenCalled();
    });

    it("aplikasi terlalu lama: sinkronisasi berhenti, tetapi scan dan outbox tetap bekerja", async () => {
      await seed(guest());
      const engine = new SyncEngine();
      push.mockRejectedValue(new ApiError(426, "APP_OUTDATED", "Perlu pembaruan"));
      await engine.syncNow();
      expect(engine.getSnapshot()).toMatchObject({ outdated: true, online: true });
      expect(await getMeta("outdated")).toBe(true);

      push.mockClear();
      expect((await handleScan("ABC234")).status).toBe("ok");
      await engine.syncNow();
      expect(push).not.toHaveBeenCalled(); // tidak mengirim, tetapi data aman di outbox
      expect(await db.outbox.count()).toBe(1);
    });

    it("tanpa pairing, tidak ada yang dikirim", async () => {
      const engine = new SyncEngine();
      await engine.syncNow();
      expect(push).not.toHaveBeenCalled();
    });

    it("selisih jam dari respons server dipakai untuk check-in berikutnya", async () => {
      await seed(guest());
      const engine = new SyncEngine();
      push.mockImplementation(async (_t, body) => ({
        ...ok(body),
        serverTime: new Date(Date.now() + 120_000).toISOString(),
      }));
      snapshot.mockResolvedValue(
        snap({ serverTime: new Date(Date.now() + 120_000).toISOString() }),
      );
      await engine.syncNow();
      expect(clockOffset()).toBeGreaterThan(115_000);
      expect(clockOffset()).toBeLessThan(125_000);
      expect(await getMeta("serverOffsetMs")).toBe(clockOffset());
    });
  });
});

// --- Konvergensi antar perangkat ----------------------------------------------------------------------------

describe("dua perangkat menerima tamu yang sama saat offline", () => {
  it("keduanya mencatat; setelah event saling diketahui, hasilnya sama dan yang awal menang", async () => {
    const budi = guest();
    await seed(budi);
    const mine = await handleScan("ABC234");
    if (mine.status !== "ok") throw new Error("harus ok");

    // Perangkat lain menerima 30 detik SEBELUM kita; eventnya baru sampai sekarang lewat server.
    const theirs = stored({
      guestId: budi.id,
      pax: 2,
      scannedAt: new Date(Date.parse(mine.scannedAt) - 30_000).toISOString(),
    });
    await db.events.put(theirs);
    await db.devices.put({ id: OTHER, name: "HP Gerbang B" });

    // Dari sudut pandang perangkat ini, yang menang adalah perangkat lain (lebih awal).
    const after = await checkIn(budi, "qr");
    expect(after).toMatchObject({ status: "already", pax: 2, by: "HP Gerbang B" });
  });
});
