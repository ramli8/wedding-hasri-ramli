/**
 * Normalisasi nomor HP ke format internasional tanpa "+": 0812-3456-7890 → 6281234567890.
 * Mengembalikan null bila hasilnya bukan 9–15 digit.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s().-]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("620"))
    digits = `62${digits.slice(3)}`; // "+62 0812…" salah ketik umum
  else if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;

  return /^\d{9,15}$/.test(digits) ? digits : null;
}

/** "@Nama", "instagram.com/nama/" atau "nama" → "nama". Null bila bukan username yang sah. */
export function normalizeInstagram(input: string): string | null {
  let value = input.trim();
  value = value.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "");
  value = value
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "")
    .toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(value) ? value : null;
}
