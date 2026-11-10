/**
 * Foto contoh sementara untuk halaman undangan, sampai foto mempelai diunggah lewat admin.
 *
 * Bila ada, foto diambil dari `src/assets/contoh/foto-1.jpg` sampai `foto-5.jpg`. Folder itu sengaja
 * tidak masuk git (berisi foto acuan gaya milik pasangan lain, dari reference-foto/), jadi di clone
 * baru dan di CI halaman memakai gambar SVG pengganti di bawah. Foto contoh WAJIB diganti foto
 * mempelai sendiri sebelum undangan dibagikan.
 *
 * Urutan foto: 1 hitam putih di punggung bukit · 2 senja di lereng · 3 kabut, bergandengan ·
 * 4 potret dekat jendela · 5 bermain koran.
 */
export type PhotoId = 1 | 2 | 3 | 4 | 5;

const SAMPLES = import.meta.glob<string>("../../../assets/contoh/foto-*.jpg", {
  eager: true,
  import: "default",
});

/** Titik fokus tiap foto (object-position), supaya potongan lebar seperti letterbox tidak memotong orangnya. */
const FOCUS: Record<PhotoId, string> = {
  1: "50% 80%",
  2: "50% 74%",
  3: "50% 58%",
  4: "50% 35%",
  5: "50% 30%",
};

export const photoFocus = (id: PhotoId) => FOCUS[id];

/** Bentuk sosok di gambar SVG pengganti, satu per nomor foto. */
const FIGURES: Record<PhotoId, string> = {
  1: '<circle cx="200" cy="170" r="30" fill="#e9dfcb"/><path d="M152 215Q200 195 248 215L262 400 236 400 228 560 212 560 200 430 188 560 172 560 164 400 138 400Z" fill="#efe6d4"/>',
  2: '<path d="M0 340Q100 290 200 330T400 290V560H0Z" fill="#17120d"/><path d="M0 420Q140 380 260 420T400 400V560H0Z" fill="#0d0a07"/><circle cx="90" cy="120" r="34" fill="#f6ecd6" opacity=".6"/>',
  3: '<circle cx="150" cy="190" r="32" fill="#e9dfcb"/><path d="M100 248Q150 226 200 248L212 420 190 420 184 560 160 560 150 450 140 560 118 560 112 420 88 420Z" fill="#efe6d4"/><circle cx="262" cy="206" r="30" fill="#2a2420"/><path d="M214 260Q262 240 310 260L322 360 340 470 312 470 306 560 282 560 262 480 242 560 218 560 212 470 186 470 200 360Z" fill="#1c1713"/>',
  4: '<circle cx="200" cy="215" r="58" fill="#e9dfcb"/><path d="M50 560Q60 340 200 312 340 340 350 560Z" fill="#efe6d4"/>',
  5: '<circle cx="190" cy="200" r="30" fill="#e9dfcb"/><path d="M140 248Q190 228 240 248L270 360 330 420 318 440 250 400 240 470 120 470 130 330Z" fill="#d9cdb4"/>',
};

/** Rona tanah dan langit pucat saja, supaya cocok dengan nada foto prewedding. */
const HUES: Record<PhotoId, number> = { 1: 28, 2: 36, 3: 205, 4: 24, 5: 18 };

function placeholder(id: PhotoId) {
  const hue = HUES[id];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},14%,44%)"/><stop offset="1" stop-color="hsl(${hue},12%,8%)"/></linearGradient></defs><rect width="400" height="560" fill="url(#g)"/>${FIGURES[id]}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function photo(id: PhotoId) {
  return SAMPLES[`../../../assets/contoh/foto-${id}.jpg`] ?? placeholder(id);
}
