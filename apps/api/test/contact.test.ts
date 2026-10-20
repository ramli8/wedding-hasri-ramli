import {
  formatEventDate,
  formatTimeRange,
  instagramDmUrl,
  normalizeInstagram,
  normalizePhone,
  renderTemplate,
  whatsappUrl,
} from "@wedding/shared";
import { describe, expect, it } from "vitest";
import { generateUniqueCodes, normalizeCode } from "../src/domain/guest-code.js";

describe("normalizePhone", () => {
  it.each([
    ["0812-3456-7890", "6281234567890"],
    ["+62 812 3456 7890", "6281234567890"],
    ["62812.3456.7890", "6281234567890"],
    ["812 3456 7890", "6281234567890"],
    ["0062 812 3456 7890", "6281234567890"],
    ["+62 0812 3456 7890", "6281234567890"], // salah ketik umum
    ["(0812) 3456 7890", "6281234567890"],
    ["+60 12-345 6789", "60123456789"], // nomor luar negeri dibiarkan
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "abc", "0812", "08123456789012345678", "0812-abc-7890"])("menolak %j", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("normalizeInstagram", () => {
  it.each([
    ["@Sari.Rahma", "sari.rahma"],
    ["sari_rahma", "sari_rahma"],
    ["https://www.instagram.com/sari.rahma/", "sari.rahma"],
    ["instagram.com/sari.rahma?igsh=abc", "sari.rahma"], // tanpa skema
    ["https://instagram.com/sari.rahma?igsh=abc", "sari.rahma"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeInstagram(input)).toBe(expected);
  });

  it.each(["", "@", "nama dengan spasi", "a".repeat(31), "nama!", "instagram.com/"])(
    "menolak %j",
    (input) => {
      expect(normalizeInstagram(input)).toBeNull();
    },
  );
});

describe("renderTemplate", () => {
  const vars = {
    panggilan: "Bpk. Budi",
    link: "https://x.id/u/ABC234",
    acara: "Resepsi",
    tanggal: "Jumat, 21 Mei 2027",
    jam_sesi: "10.00–12.00 WIB",
  };

  it("mengganti semua variabel, termasuk yang muncul lebih dari sekali", () => {
    expect(renderTemplate("Yth {panggilan}, {acara}. {panggilan}!", vars)).toBe(
      "Yth Bpk. Budi, Resepsi. Bpk. Budi!",
    );
  });

  it("membuang baris yang hanya berisi variabel kosong, dan menjaga baris lain", () => {
    const empty = { ...vars, tanggal: "", jam_sesi: "" };
    expect(
      renderTemplate(
        "Halo {panggilan}\nTanggal: {tanggal}\nWaktu: {jam_sesi}\nSampai jumpa",
        empty,
      ),
    ).toBe("Halo Bpk. Budi\nSampai jumpa");
  });

  it("baris dengan sebagian variabel kosong tetap dipertahankan", () => {
    expect(renderTemplate("{acara} {jam_sesi}", { ...vars, jam_sesi: "" })).toBe("Resepsi ");
  });

  it("template bawaan menghasilkan pesan lengkap, dan rapi bila tanggal dan jam kosong", async () => {
    const { DEFAULT_MESSAGE_TEMPLATE } = await import("@wedding/shared");
    const full = renderTemplate(DEFAULT_MESSAGE_TEMPLATE, vars);
    expect(full).toContain("Tanggal: Jumat, 21 Mei 2027");
    expect(full).toContain("Waktu: 10.00–12.00 WIB");
    expect(full).toContain("https://x.id/u/ABC234");

    const bare = renderTemplate(DEFAULT_MESSAGE_TEMPLATE, { ...vars, tanggal: "", jam_sesi: "" });
    expect(bare).not.toContain("Tanggal:");
    expect(bare).not.toContain("Waktu:");
    expect(bare).toContain("Kami mengundang Anda ke Resepsi.");
  });

  it("membiarkan variabel yang tidak dikenal", () => {
    expect(renderTemplate("Halo {nama_lain} {panggilan}", vars)).toBe("Halo {nama_lain} Bpk. Budi");
  });
});

describe("format tanggal dan jam", () => {
  it("memakai zona waktu WIB, bukan zona mesin", () => {
    // 03:00 UTC = 10.00 WIB
    expect(formatTimeRange("2027-05-21T03:00:00Z", "2027-05-21T05:00:00Z")).toBe("10.00–12.00 WIB");
    expect(formatEventDate("2027-05-21T03:00:00Z")).toBe("Jumat, 21 Mei 2027");
  });

  it("tanggal WIB bisa berbeda dari tanggal UTC", () => {
    // 20 Mei 20:00 UTC = 21 Mei 03:00 WIB
    expect(formatEventDate("2027-05-20T20:00:00Z")).toBe("Jumat, 21 Mei 2027");
  });

  it("kosong bila tanggal tidak ada", () => {
    expect(formatEventDate(null)).toBe("");
  });
});

describe("tautan pesan", () => {
  it("meng-encode teks WhatsApp", () => {
    expect(whatsappUrl("6281234567890", "Halo & selamat\nsiang")).toBe(
      "https://wa.me/6281234567890?text=Halo%20%26%20selamat%0Asiang",
    );
  });

  it("membuat tautan DM Instagram", () => {
    expect(instagramDmUrl("sari.rahma")).toBe("https://ig.me/m/sari.rahma");
  });
});

describe("kode tamu", () => {
  it("6 karakter dari alfabet tanpa I, O, 0, 1", () => {
    const codes = generateUniqueCodes(500, new Set());
    for (const code of codes) expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  it("unik dan menghindari kode yang sudah dipakai", () => {
    const taken = new Set(["AAAAAA"]);
    const codes = generateUniqueCodes(1000, taken);
    expect(new Set(codes).size).toBe(1000);
    expect(codes).not.toContain("AAAAAA");
  });

  it("normalizeCode mengabaikan huruf kecil dan spasi", () => {
    expect(normalizeCode("  ab3dEf ")).toBe("AB3DEF");
  });
});
