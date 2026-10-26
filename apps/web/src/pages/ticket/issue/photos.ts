/** Foto contoh berupa SVG gelap dan sinematik (mirip foto prewedding), sampai foto asli diunggah. */
type Kind = "stand" | "sit" | "portrait" | "detail" | "pair" | "land";

const HUES = [28, 200, 8, 150, 265, 45, 180];

const FIGURES: Record<Kind, string> = {
  stand:
    '<circle cx="200" cy="170" r="30" fill="#e9dfcb"/><path d="M152 215Q200 195 248 215L262 400 236 400 228 560 212 560 200 430 188 560 172 560 164 400 138 400Z" fill="#efe6d4"/>',
  sit: '<circle cx="190" cy="200" r="30" fill="#e9dfcb"/><path d="M140 248Q190 228 240 248L270 360 330 420 318 440 250 400 240 470 120 470 130 330Z" fill="#d9cdb4"/>',
  portrait:
    '<circle cx="200" cy="215" r="58" fill="#e9dfcb"/><path d="M50 560Q60 340 200 312 340 340 350 560Z" fill="#efe6d4"/>',
  pair: '<circle cx="150" cy="190" r="32" fill="#e9dfcb"/><path d="M100 248Q150 226 200 248L212 420 190 420 184 560 160 560 150 450 140 560 118 560 112 420 88 420Z" fill="#efe6d4"/><circle cx="262" cy="206" r="30" fill="#2a2420"/><path d="M214 260Q262 240 310 260L322 360 340 470 312 470 306 560 282 560 262 480 242 560 218 560 212 470 186 470 200 360Z" fill="#1c1713"/>',
  detail:
    '<path d="M0 420Q120 300 240 360T400 330V560H0Z" fill="#0f0c09"/><circle cx="300" cy="140" r="38" fill="#f6ecd6" opacity=".7"/>',
  land: '<path d="M0 340Q100 290 200 330T400 290V560H0Z" fill="#17120d"/><path d="M0 420Q140 380 260 420T400 400V560H0Z" fill="#0d0a07"/><circle cx="90" cy="120" r="34" fill="#f6ecd6" opacity=".6"/>',
};

export function photo(kind: Kind, tone = 0) {
  const hue = HUES[tone % HUES.length] ?? 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},22%,46%)"/><stop offset="1" stop-color="hsl(${hue},24%,9%)"/></linearGradient><radialGradient id="v" cx=".5" cy=".45" r=".8"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs><rect width="400" height="560" fill="url(#g)"/>${FIGURES[kind]}<rect width="400" height="560" fill="url(#v)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export type PhotoKind = Kind;
