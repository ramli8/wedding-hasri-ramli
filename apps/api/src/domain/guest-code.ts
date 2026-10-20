import { randomInt } from "node:crypto";

// 32 karakter tanpa yang mudah tertukar (I, O, 0, 1): 32^6 ≈ 1 miliar kombinasi.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** Membuat `count` kode unik yang belum ada di `taken`. `taken` ikut diperbarui. */
export function generateUniqueCodes(count: number, taken: Set<string>): string[] {
  const codes: string[] = [];
  while (codes.length < count) {
    const code = generateCode();
    if (taken.has(code)) continue;
    taken.add(code);
    codes.push(code);
  }
  return codes;
}

/** Kode yang diketik manual: abaikan huruf kecil dan spasi di sekitarnya. */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}
