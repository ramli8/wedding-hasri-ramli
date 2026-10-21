const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** 1500000 -> "Rp 1.500.000". */
export const formatRupiah = (amount: number) => `Rp ${rupiah.format(amount)}`;

/** Mengubah isian angka (boleh berpemisah titik/spasi, mis. "1.500.000") menjadi bilangan bulat, atau null. */
export function parseAmount(text: string): number | null {
  const digits = text.replace(/[.\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits);
}
