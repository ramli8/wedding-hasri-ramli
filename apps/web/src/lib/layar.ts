import type { LayarMode } from "@wedding/shared";

/**
 * Penyimpanan layar sapa/dapur di peramban. Layar selalu butuh internet dan tidak punya data yang
 * belum terkirim, jadi cukup localStorage (bukan Dexie): token perangkat dan mode terakhir.
 */
export type LayarAuth = { token: string; deviceId: string; deviceName: string };

const AUTH_KEY = "wedding-layar-auth";
const MODE_KEY = "wedding-layar-mode";

export function getLayarAuth(): LayarAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as LayarAuth) : null;
  } catch {
    return null;
  }
}

export function setLayarAuth(auth: LayarAuth | null) {
  try {
    if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    /* penyimpanan diblokir: layar perlu dipasangkan lagi setelah dimuat ulang */
  }
}

export function getLayarMode(): LayarMode {
  try {
    return localStorage.getItem(MODE_KEY) === "dapur" ? "dapur" : "sapa";
  } catch {
    return "sapa";
  }
}

export function setLayarMode(mode: LayarMode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* abaikan */
  }
}
