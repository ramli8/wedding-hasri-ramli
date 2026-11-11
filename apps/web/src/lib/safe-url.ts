/**
 * Tautan dari data (peta, wishlist, siaran langsung) hanya dipakai bila http(s). Lapisan kedua di
 * samping validasi server: data lama di database bisa saja berisi `javascript:...`, yang bila
 * dijadikan href menjalankan skrip saat diklik tamu atau admin.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
