import type { HomeResponse } from "@wedding/shared";
import { describe, expect, it } from "vitest";
import { buildTasks, daysUntil } from "../pages/home-page.js";

const base: HomeResponse = {
  eventDate: "2027-05-21T03:00:00.000Z",
  guests: { total: 10, neverSent: 0 },
  rsvp: null,
  checkin: null,
  vendors: {
    summary: {
      selectedCount: 0,
      categoryCount: 0,
      contractTotal: 0,
      paidTotal: 0,
      remaining: 0,
      overdueCount: 0,
      dueSoonCount: 0,
    },
    due: [],
  },
  gifts: { count: 0, amplopTotal: 0, transferTotal: 0, barangCount: 0, notThanked: 0 },
  guestbookUnreplied: 0,
  coupleFilled: true,
};

describe("daysUntil", () => {
  it("menghitung selisih hari menurut tanggal WIB", () => {
    const now = Date.parse("2027-05-20T20:00:00Z"); // 21 Mei 03.00 WIB
    expect(daysUntil("2027-05-21T03:00:00Z", now)).toBe(0);
    expect(daysUntil("2027-05-21T03:00:00Z", Date.parse("2027-05-20T10:00:00Z"))).toBe(1);
    expect(daysUntil("2027-05-21T03:00:00Z", Date.parse("2027-05-11T05:00:00Z"))).toBe(10);
    expect(daysUntil("2027-05-21T03:00:00Z", Date.parse("2027-05-22T05:00:00Z"))).toBe(-1);
  });
});

describe("buildTasks", () => {
  it("kosong bila tidak ada yang perlu dikerjakan", () => {
    expect(buildTasks(base)).toEqual([]);
  });

  it("hanya memuat yang jumlahnya lebih dari nol, yang mendesak di depan", () => {
    const tasks = buildTasks({
      ...base,
      guests: { total: 10, neverSent: 4 },
      rsvp: {
        eventName: "R",
        invited: 10,
        hadir: 3,
        hadirPax: 5,
        tidakHadir: 0,
        ragu: 0,
        belum: 7,
      },
      checkin: { eventName: "R", invited: 10, arrived: 0, needsReview: 2 },
      guestbookUnreplied: 1,
      vendors: {
        ...base.vendors,
        summary: { ...base.vendors.summary, overdueCount: 1, dueSoonCount: 2 },
      },
    });
    expect(tasks.map((t) => t.key)).toEqual([
      "overdue",
      "review",
      "unsent",
      "rsvp",
      "due-soon",
      "guestbook",
    ]);
    expect(tasks.filter((t) => t.urgent).map((t) => t.key)).toEqual(["overdue", "review"]);
  });

  it("ucapan terima kasih hanya muncul setelah acara berlalu", () => {
    const home = { ...base, gifts: { ...base.gifts, notThanked: 3 } };
    expect(buildTasks(home, Date.parse("2027-05-01T00:00:00Z"))).toEqual([]);
    expect(buildTasks(home, Date.parse("2027-05-25T00:00:00Z")).map((t) => t.key)).toEqual([
      "thanks",
    ]);
  });

  it("mengingatkan bila belum ada tamu atau profil mempelai belum lengkap", () => {
    expect(
      buildTasks({ ...base, guests: { total: 0, neverSent: 0 }, coupleFilled: false }).map(
        (t) => t.key,
      ),
    ).toEqual(["no-guests", "couple"]);
  });
});
