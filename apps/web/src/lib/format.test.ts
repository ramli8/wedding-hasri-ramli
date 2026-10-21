import { describe, expect, it } from "vitest";
import { formatRupiah, parseAmount } from "./format.js";

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
});
