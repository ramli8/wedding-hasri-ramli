import { describe, expect, it } from "vitest";
import { formatPhone, formatRupiah, parseAmount } from "./format.js";

describe("format", () => {
  it("memberi pemisah ribuan gaya Indonesia", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(1_500_000)).toBe("Rp 1.500.000");
  });

  it("membaca isian nominal dengan atau tanpa pemisah", () => {
    expect(parseAmount("500000")).toBe(500_000);
    expect(parseAmount("1.500.000")).toBe(1_500_000);
    expect(parseAmount(" 250 000 ")).toBe(250_000);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("12,5")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  it("menampilkan nomor HP Indonesia gaya lokal, nomor luar negeri dengan +", () => {
    expect(formatPhone("6281234567801")).toBe("0812-3456-7801");
    expect(formatPhone("628123456789")).toBe("0812-3456-789");
    expect(formatPhone("6591234567")).toBe("+6591234567");
  });
});
