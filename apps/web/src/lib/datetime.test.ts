import { describe, expect, it } from "vitest";
import { isoToWibDate, isoToWibTime, wibTimeToIso } from "./datetime.js";

describe("jam sesi WIB", () => {
  it("memecah ISO UTC menjadi tanggal dan jam WIB", () => {
    expect(isoToWibDate("2027-05-21T03:00:00Z")).toBe("2027-05-21");
    expect(isoToWibTime("2027-05-21T03:00:00Z")).toBe("10:00");
    // 20.00 UTC sudah hari berikutnya di WIB
    expect(isoToWibDate("2027-05-21T20:00:00Z")).toBe("2027-05-22");
  });

  it("menggabungkan tanggal acara dan jam WIB menjadi ISO UTC", () => {
    expect(wibTimeToIso("2027-05-21", "10:00")).toBe("2027-05-21T03:00:00.000Z");
  });

  it("mengembalikan null bila tanggal atau jam kosong", () => {
    expect(wibTimeToIso("", "10:00")).toBeNull();
    expect(wibTimeToIso("2027-05-21", "")).toBeNull();
    expect(isoToWibTime(null)).toBe("");
  });
});
