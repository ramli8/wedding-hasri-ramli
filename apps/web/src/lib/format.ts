const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** 1500000 -> "Rp 1.500.000". */
export const formatRupiah = (amount: number) => `Rp ${rupiah.format(amount)}`;

/** Mengubah isian angka (boleh berpemisah titik/spasi, mis. "1.500.000") menjadi bilangan bulat, atau null. */
export function parseAmount(text: string): number | null {
  const digits = text.replace(/[.\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits);
}

/**
 * Nomor tersimpan (angka saja, berawalan kode negara) untuk ditampilkan: nomor Indonesia ditulis
 * gaya lokal "0812-3456-7801", nomor luar negeri "+<angka>".
 */
export function formatPhone(phone: string): string {
  if (!phone.startsWith("62")) return `+${phone}`;
  const local = `0${phone.slice(2)}`;
  return [local.slice(0, 4), local.slice(4, 8), local.slice(8)].filter(Boolean).join("-");
}
