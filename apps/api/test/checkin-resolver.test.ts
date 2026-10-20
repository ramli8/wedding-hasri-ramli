import {
  CHECKIN_UNDO_WINDOW_MS,
  type CheckinState,
  needsReview,
  type ResolverEvent,
  resolveCheckins,
  uuid7,
  withinUndoWindow,
} from "@wedding/shared";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const G1 = "00000000-0000-4000-8000-000000000001";
const G2 = "00000000-0000-4000-8000-000000000002";
const EV = "00000000-0000-4000-8000-0000000000e1";

let counter = 0;
const nextId = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;
const at = (minute: number, second = 0) =>
  new Date(Date.UTC(2027, 4, 21, 3, minute, second)).toISOString();

const checkin = (guestId: string, when: string, pax = 1, id = nextId()): ResolverEvent => ({
  id,
  kind: "checkin",
  guestId,
  eventId: EV,
  pax,
  scannedAt: when,
});
const undo = (target: ResolverEvent, when: string): ResolverEvent => ({
  id: nextId(),
  kind: "undo",
  guestId: target.guestId,
  eventId: target.eventId,
  targetId: target.id,
  scannedAt: when,
});
const setPax = (target: ResolverEvent, pax: number, when: string): ResolverEvent => ({
  id: nextId(),
  kind: "set_pax",
  guestId: target.guestId,
  eventId: target.eventId,
  targetId: target.id,
  pax,
  scannedAt: when,
});

/** Ringkasan yang bisa dibandingkan: id primary, jumlah, dan id duplikat (terurut). */
const summarize = (states: CheckinState[]) =>
  states.map((s) => ({
    guest: s.guestId,
    primary: s.primary.id,
    pax: s.pax,
    duplicates: s.duplicates.map((d) => d.id),
    resolution: s.resolution,
  }));

describe("resolveCheckins", () => {
  it("satu check-in menjadi primary dengan jumlah dari event", () => {
    const a = checkin(G1, at(1), 4);
    const [state] = resolveCheckins([a]);
    expect(state).toMatchObject({ pax: 4, duplicates: [], resolution: null });
    expect(state?.primary.id).toBe(a.id);
  });

  it("dua perangkat untuk tamu yang sama: yang paling awal menang, yang lain duplikat", () => {
    const late = checkin(G1, at(5), 3);
    const early = checkin(G1, at(2), 4);
    const [state] = resolveCheckins([late, early]);
    expect(state?.primary.id).toBe(early.id);
    expect(state?.pax).toBe(4);
    expect(state?.duplicates.map((d) => d.id)).toEqual([late.id]);
    expect(state && needsReview(state)).toBe(true);
  });

  it("waktu yang sama: id terkecil menang, tidak bergantung urutan masuk", () => {
    const a = checkin(G1, at(2), 1, "00000000-0000-4000-8000-00000000000a");
    const b = checkin(G1, at(2), 1, "00000000-0000-4000-8000-00000000000b");
    expect(resolveCheckins([a, b])[0]?.primary.id).toBe(a.id);
    expect(resolveCheckins([b, a])[0]?.primary.id).toBe(a.id);
  });

  it("undo membatalkan check-in; duplikat berikutnya naik menjadi primary", () => {
    const first = checkin(G1, at(1), 2);
    const second = checkin(G1, at(3), 5);
    const states = resolveCheckins([first, second, undo(first, at(1, 30))]);
    expect(states).toHaveLength(1);
    expect(states[0]?.primary.id).toBe(second.id);
    expect(states[0]?.pax).toBe(5);
    expect(states[0]?.duplicates).toEqual([]);
  });

  it("undo satu-satunya check-in menghapus tamu dari daftar masuk", () => {
    const only = checkin(G1, at(1));
    expect(resolveCheckins([only, undo(only, at(1, 20))])).toEqual([]);
  });

  it("set_pax terakhir menggantikan jumlah; set_pax pada duplikat diabaikan", () => {
    const primary = checkin(G1, at(1), 4);
    const dup = checkin(G1, at(3), 2);
    const states = resolveCheckins([
      primary,
      dup,
      setPax(primary, 3, at(1, 20)),
      setPax(primary, 2, at(1, 40)),
      setPax(dup, 9, at(3, 10)),
    ]);
    expect(states[0]?.pax).toBe(2);
  });

  it("merge_pax menjumlahkan semua check-in yang berlaku", () => {
    const a = checkin(G1, at(1), 2);
    const b = checkin(G1, at(4), 3);
    const [state] = resolveCheckins(
      [a, b],
      [{ guestId: G1, eventId: EV, resolution: "merge_pax" }],
    );
    expect(state?.pax).toBe(5);
    expect(state && needsReview(state)).toBe(false);
  });

  it("keep_first menandai duplikat sudah diperiksa tanpa mengubah jumlah", () => {
    const a = checkin(G1, at(1), 2);
    const b = checkin(G1, at(4), 3);
    const [state] = resolveCheckins(
      [a, b],
      [{ guestId: G1, eventId: EV, resolution: "keep_first" }],
    );
    expect(state?.pax).toBe(2);
    expect(state && needsReview(state)).toBe(false);
    expect(state?.duplicates).toHaveLength(1);
  });

  it("koreksi yang menunjuk check-in tamu lain atau yang tidak ada diabaikan", () => {
    const mine = checkin(G1, at(1), 2);
    const other = checkin(G2, at(1), 1);
    const wrong = { ...undo(other, at(2)), guestId: G1 };
    const orphan: ResolverEvent = { ...undo(mine, at(2)), targetId: nextId() };
    const states = resolveCheckins([mine, other, wrong, orphan]);
    expect(states.map((s) => s.guestId).sort()).toEqual([G1, G2]);
  });

  it("tamu berbeda dihitung terpisah dan diurutkan menurut waktu masuk", () => {
    const a = checkin(G2, at(1));
    const b = checkin(G1, at(2));
    expect(resolveCheckins([b, a]).map((s) => s.guestId)).toEqual([G2, G1]);
  });
});

// --- Properti: konvergensi ---------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

/** Log acak: beberapa tamu, beberapa check-in per tamu, sebagian dibatalkan atau diubah jumlahnya. */
function randomLog(random: () => number): ResolverEvent[] {
  const guests = [G1, G2, "00000000-0000-4000-8000-000000000003"];
  const log: ResolverEvent[] = [];
  for (const guestId of guests) {
    const count = Math.floor(random() * 4); // 0–3 check-in, termasuk duplikat
    const mine: ResolverEvent[] = [];
    for (let i = 0; i < count; i++) {
      // waktu sengaja sering bertabrakan agar jalur "id sebagai penentu" ikut teruji
      const event = checkin(
        guestId,
        at(Math.floor(random() * 4), Math.floor(random() * 3) * 20),
        1 + Math.floor(random() * 5),
      );
      mine.push(event);
      log.push(event);
    }
    for (const target of mine) {
      if (random() < 0.3)
        log.push(undo(target, at(Math.floor(random() * 5), Math.floor(random() * 3) * 20)));
      if (random() < 0.4) {
        log.push(
          setPax(
            target,
            1 + Math.floor(random() * 6),
            at(Math.floor(random() * 5), Math.floor(random() * 3) * 20),
          ),
        );
      }
    }
  }
  return log;
}

describe("resolveCheckins: konvergen untuk urutan kedatangan apa pun", () => {
  it("hasil sama untuk 200 log acak, masing-masing dengan 25 urutan berbeda", () => {
    const random = mulberry32(20270521);
    for (let round = 0; round < 200; round++) {
      const log = randomLog(random);
      const expected = summarize(resolveCheckins(log));
      for (let i = 0; i < 25; i++) {
        expect(summarize(resolveCheckins(shuffle(log, random)))).toEqual(expected);
      }
    }
  });

  it("idempoten: event yang dikirim ulang (duplikat id) tidak mengubah hasil", () => {
    const random = mulberry32(42);
    for (let round = 0; round < 100; round++) {
      const log = randomLog(random);
      const resent = shuffle([...log, ...log.filter(() => random() < 0.5)], random);
      expect(summarize(resolveCheckins(resent))).toEqual(summarize(resolveCheckins(log)));
    }
  });

  it("dua perangkat yang menerima event dalam urutan berbeda berakhir pada status yang sama", () => {
    const random = mulberry32(7);
    for (let round = 0; round < 100; round++) {
      const log = randomLog(random);
      // Perangkat A menerima separuh dulu, B separuh lainnya dulu; keduanya akhirnya menerima semuanya.
      const half = Math.floor(log.length / 2);
      const stateA = resolveCheckins([...log.slice(0, half), ...log.slice(half)]);
      const stateB = resolveCheckins([...log.slice(half), ...log.slice(0, half)]);
      expect(summarize(stateA)).toEqual(summarize(stateB));
    }
  });

  it("tidak pernah ada dua primary untuk (tamu, acara) yang sama, dan primary tidak ada di duplikat", () => {
    const random = mulberry32(99);
    for (let round = 0; round < 100; round++) {
      const states = resolveCheckins(randomLog(random));
      const keys = states.map((s) => `${s.guestId}|${s.eventId}`);
      expect(new Set(keys).size).toBe(keys.length);
      for (const s of states) {
        expect(s.duplicates.map((d) => d.id)).not.toContain(s.primary.id);
        expect(s.pax).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("withinUndoWindow", () => {
  const target = { scannedAt: at(1) };

  it("true tepat di batas 2 menit, false setelahnya atau sebelum check-in", () => {
    const base = Date.parse(target.scannedAt);
    expect(withinUndoWindow(target, new Date(base + CHECKIN_UNDO_WINDOW_MS).toISOString())).toBe(
      true,
    );
    expect(
      withinUndoWindow(target, new Date(base + CHECKIN_UNDO_WINDOW_MS + 1).toISOString()),
    ).toBe(false);
    expect(withinUndoWindow(target, new Date(base - 1).toISOString())).toBe(false);
  });
});

describe("uuid7", () => {
  it("berformat UUID v7 yang diterima zod dan unik", () => {
    const ids = Array.from({ length: 1000 }, () => uuid7());
    expect(new Set(ids).size).toBe(1000);
    for (const id of ids.slice(0, 50)) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(z.uuid().safeParse(id).success).toBe(true);
    }
  });

  it("urut menurut waktu pembuatan", () => {
    const earlier = uuid7(1_000_000_000_000);
    const later = uuid7(1_000_000_000_001);
    expect(earlier < later).toBe(true);
  });
});
