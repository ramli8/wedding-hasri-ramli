import type { TicketResponse } from "@wedding/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadTicket, saveTicket } from "./ticket-cache.js";

const TICKET: TicketResponse = {
  guest: { code: "ABC234", displayName: "Sari", isRombongan: false, groupName: null },
  couple: { groomName: "Ramli", brideName: "Hasri" },
  events: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Resepsi",
      startsAt: "2027-05-21T03:00:00.000Z",
      endsAt: "2027-05-21T07:00:00.000Z",
      venueName: null,
      address: null,
      mapsUrl: null,
      checkinEnabled: true,
      hasRsvp: true,
      session: null,
      rsvp: { status: "hadir", pax: 1 },
    },
  ],
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("cache tiket", () => {
  it("menyimpan dan memuat tiket per kode", () => {
    saveTicket("ABC234", TICKET);
    expect(loadTicket("ABC234")).toEqual(TICKET);
    expect(loadTicket("ZZZZZZ")).toBeNull();
  });

  it("mengabaikan salinan yang rusak atau bentuknya sudah lama", () => {
    localStorage.setItem("ticket:ABC234", "{bukan json");
    expect(loadTicket("ABC234")).toBeNull();
    localStorage.setItem("ticket:ABC234", JSON.stringify({ guest: { code: "ABC234" } }));
    expect(loadTicket("ABC234")).toBeNull();
  });

  it("tidak melempar saat penyimpanan tidak tersedia (mode privat)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => saveTicket("ABC234", TICKET)).not.toThrow();
    expect(loadTicket("ABC234")).toBeNull();
  });
});
