export interface GiftBrand {
  label: string;
  bg: string;
  fg: string;
}

const BRAND_MAP: Record<string, GiftBrand> = {
  bca: { label: "BCA", bg: "#0060AD", fg: "#FFFFFF" },
  mandiri: { label: "MANDIRI", bg: "#00357B", fg: "#F5B324" },
  bri: { label: "BRI", bg: "#00529C", fg: "#FFFFFF" },
  bni: { label: "BNI", bg: "#F26F21", fg: "#FFFFFF" },
  cimb: { label: "CIMB", bg: "#ED1C24", fg: "#FFFFFF" },
  niaga: { label: "CIMB", bg: "#ED1C24", fg: "#FFFFFF" },
  permata: { label: "PERMATA", bg: "#00A0DF", fg: "#FFFFFF" },
  btn: { label: "BTN", bg: "#F39200", fg: "#FFFFFF" },
  bsi: { label: "BSI", bg: "#1D5C43", fg: "#FFFFFF" },
  muamalat: { label: "MUA", bg: "#00674F", fg: "#FFFFFF" },
  gopay: { label: "GOPAY", bg: "#00AED6", fg: "#FFFFFF" },
  shopeepay: { label: "SHOPEEPAY", bg: "#EE4D2D", fg: "#FFFFFF" },
  ovo: { label: "OVO", bg: "#4C3494", fg: "#FFFFFF" },
  dana: { label: "DANA", bg: "#118EEA", fg: "#FFFFFF" },
  linkaja: { label: "LINKAJA", bg: "#E7305B", fg: "#FFFFFF" },
  qris: { label: "QRIS", bg: "#C21F2C", fg: "#FFFFFF" },
  paypal: { label: "PAYPAL", bg: "#003087", fg: "#FFFFFF" },
};

const FALLBACK_COLORS = ["#00529C", "#4C3494", "#118EEA", "#E7305B"];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getGiftBrand(name: string): GiftBrand {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized in BRAND_MAP) return BRAND_MAP[normalized];
  for (const [key, brand] of Object.entries(BRAND_MAP)) {
    if (normalized.includes(key)) return brand;
  }
  return {
    label: Array.from(name.trim())[0]?.toUpperCase() ?? "?",
    bg: FALLBACK_COLORS[hashName(name) % FALLBACK_COLORS.length],
    fg: "#FFFFFF",
  };
}
