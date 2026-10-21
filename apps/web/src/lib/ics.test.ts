import { describe, expect, it } from "vitest";
import { buildIcs, icsFilename } from "./ics.js";

const NOW = new Date("2026-10-21T00:00:00Z");
const base = {
  uid: "abc@hasri-ramli",
  title: "Resepsi",
  startsAt: "2027-05-21T03:00:00.000Z",
  endsAt: "2027-05-21T05:00:00.000Z",
};

describe("buildIcs", () => {
  it("membuat VEVENT dengan waktu UTC dan baris berakhiran CRLF", () => {
    const ics = buildIcs(base, NOW);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("UID:abc@hasri-ramli\r\n");
    expect(ics).toContain("DTSTAMP:20261021T000000Z\r\n");
    expect(ics).toContain("DTSTART:20270521T030000Z\r\n");
    expect(ics).toContain("DTEND:20270521T050000Z\r\n");
    expect(ics).toContain("SUMMARY:Resepsi\r\n");
    expect(ics).toContain("TRIGGER:-P1D");
    // Tidak ada LF telanjang (semua baris CRLF).
    expect(ics.replace(/\r\n/g, "").includes("\n")).toBe(false);
  });

  it("tanpa jam selesai berdurasi dua jam", () => {
    const ics = buildIcs({ ...base, endsAt: null }, NOW);
    expect(ics).toContain("DTEND:20270521T050000Z\r\n");
  });

  it("menetralkan koma, titik koma, garis miring terbalik, dan baris baru", () => {
    const ics = buildIcs(
      { ...base, location: "Gedung A, Jl. Mawar; Surabaya", description: "Baris 1\nBaris 2 \\ ok" },
      NOW,
    );
    expect(ics).toContain("LOCATION:Gedung A\\, Jl. Mawar; Surabaya\r\n");
    expect(ics).toContain("DESCRIPTION:Baris 1\\nBaris 2 \\\\ ok\r\n");
  });

  it("melipat baris panjang (maksimal 75 byte) tanpa memotong karakter", () => {
    const long = "Pernikahan ".repeat(30) + "é".repeat(40);
    const ics = buildIcs({ ...base, description: long }, NOW);
    const encoder = new TextEncoder();
    for (const line of ics.split("\r\n"))
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    // Setelah dilipat dan disambung lagi, isinya utuh.
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain(`DESCRIPTION:${long.replace(/\s+$/, "")}`);
  });
});

describe("icsFilename", () => {
  it("membuat nama berkas aman", () => {
    expect(icsFilename("Resepsi Pernikahan!")).toBe("resepsi-pernikahan.ics");
    expect(icsFilename("???")).toBe("acara.ics");
  });
});
