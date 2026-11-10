import { BOOTH_PHOTO_HEIGHT, BOOTH_PHOTO_WIDTH, type BoothFrame } from "@wedding/shared";

/**
 * Bingkai photobooth bawaan (mockup "Mockup Photobooth", dipilih 10 Nov 2026), digambar di canvas
 * 1800×1200 (4R mendatar, 300 dpi). Setiap bingkai punya satu jendela foto; foto dipotong menutupi
 * jendela itu lalu bingkai ditumpuk di atasnya.
 *
 * Teks mengikuti isi undangan statis (`pages/ticket/issue/content.ts`). Ganti di sini bila nama,
 * tanggal, atau lokasi berubah.
 */
const TEXT = {
  title: "HASRI & RAMLI",
  presenter: "KELUARGA BPK. BUASAN & BPK. NGATMARI MEMPERSEMBAHKAN",
  billing: [
    "DIBINTANGI HASRI WIJI AQSARI · MOHAMAD RIZAL RAMLI",
    "DAN PARA TAMU TERHORMAT · DISUTRADARAI OLEH TAKDIR",
  ],
  premiere: "TAYANG 21 · 05 · 2027",
  scene: "ADEGAN 21 · INT. GEDUNG GRAHA BUNGA · MALAM",
  thanks: ["Terima kasih sudah menjadi", "bagian dari cerita kami."],
  date: "21.05.2027",
  studio: "GRAHA BUNGA",
  seat: "TAMU KEHORMATAN",
  keepsake: ["Simpan tiket ini", "sebagai kenangan."],
};

const COLOR = {
  reel: "#0e0c0a",
  screen: "#efe6d6",
  sand: "#ebe3d5",
  umber: "#221c17",
  dim: "#6f6458",
  dimOnDark: "#a89a8a",
  ember: "#a5532f",
  emberOnDark: "#c9784f",
};

const FONT = {
  display: '"Bebas Neue", Impact, "Arial Narrow", sans-serif',
  serif: '"Cormorant Garamond", Georgia, serif',
  script: '"Courier Prime", "Courier New", monospace',
};

/** Font yang harus sudah dimuat sebelum menggambar (lihat `loadFrameFonts`). */
const FONT_FACES = [
  `400 64px ${FONT.display}`,
  `italic 400 32px ${FONT.serif}`,
  `400 24px ${FONT.script}`,
  `700 24px ${FONT.script}`,
];

export type Rect = { x: number; y: number; w: number; h: number };

export type FrameSpec = {
  /** Jendela foto dalam koordinat canvas 1800×1200. */
  window: Rect;
  /** Filter foto: poster hitam putih, lainnya hangat. Juga dipakai sebagai CSS filter pratinjau. */
  photoFilter: string;
  /** Warna latar layar booth agar pratinjau menyatu dengan bingkai. */
  ground: string;
};

const BW = "grayscale(1) contrast(1.15) brightness(0.95)";
const WARM = "saturate(0.85) contrast(1.05) sepia(0.12)";

export const FRAME_SPECS: Record<BoothFrame, FrameSpec> = {
  poster: { window: { x: 72, y: 72, w: 1656, h: 800 }, photoFilter: BW, ground: COLOR.reel },
  strip: { window: { x: 88, y: 132, w: 1624, h: 744 }, photoFilter: WARM, ground: COLOR.sand },
  tiket: { window: { x: 64, y: 64, w: 1240, h: 1072 }, photoFilter: WARM, ground: COLOR.sand },
};

export const PHOTO_SIZE = { width: BOOTH_PHOTO_WIDTH, height: BOOTH_PHOTO_HEIGHT };

/**
 * Potongan sumber (sx, sy, sw, sh) agar gambar `src` menutupi `target` tanpa gepeng, seperti
 * `object-fit: cover`: sisi yang berlebih dipotong sama rata di kedua ujung.
 */
export function coverCrop(src: { width: number; height: number }, target: Rect): Rect {
  const srcRatio = src.width / src.height;
  const targetRatio = target.w / target.h;
  if (srcRatio > targetRatio) {
    const w = src.height * targetRatio;
    return { x: (src.width - w) / 2, y: 0, w, h: src.height };
  }
  const h = src.width / targetRatio;
  return { x: 0, y: (src.height - h) / 2, w: src.width, h };
}

/** Nomor foto di tiket: 4 digit, mis. 0127. */
export const formatPhotoNumber = (n: number) => String(n).padStart(4, "0");

export async function loadFrameFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(FONT_FACES.map((face) => document.fonts.load(face).catch(() => [])));
}

type Ctx = CanvasRenderingContext2D;

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  opts: { font: string; color: string; align?: CanvasTextAlign; spacing?: number },
) {
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "alphabetic";
  // letterSpacing belum ada di semua peramban; tanpa itu teks tetap terbaca, hanya lebih rapat.
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${opts.spacing ?? 0}px`;
  ctx.fillText(value, x, y);
}

/** Lubang sproket: lingkaran berwarna latar dengan jarak tetap. */
function sprocketRow(ctx: Ctx, y: number, from: number, to: number) {
  ctx.fillStyle = COLOR.sand;
  for (let x = from + 30; x < to - 10; x += 60) {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPoster(ctx: Ctx) {
  ctx.fillStyle = COLOR.reel;
  ctx.fillRect(0, 0, BOOTH_PHOTO_WIDTH, BOOTH_PHOTO_HEIGHT);
  text(ctx, TEXT.presenter, 72, 948, {
    font: `400 22px ${FONT.script}`,
    color: COLOR.dimOnDark,
    spacing: 4.4,
  });
  text(ctx, TEXT.title, 66, 1124, {
    font: `400 184px ${FONT.display}`,
    color: COLOR.screen,
    spacing: 3.6,
  });
  const right = BOOTH_PHOTO_WIDTH - 72;
  TEXT.billing.forEach((line, i) => {
    text(ctx, line, right, 1016 + i * 34, {
      font: `400 27px ${FONT.display}`,
      color: COLOR.dimOnDark,
      align: "right",
      spacing: 2,
    });
  });
  text(ctx, TEXT.premiere, right, 1120, {
    font: `400 28px ${FONT.script}`,
    color: COLOR.emberOnDark,
    align: "right",
    spacing: 7,
  });
}

function drawStrip(ctx: Ctx) {
  ctx.fillStyle = COLOR.sand;
  ctx.fillRect(0, 0, BOOTH_PHOTO_WIDTH, BOOTH_PHOTO_HEIGHT);
  ctx.fillStyle = COLOR.reel;
  ctx.fillRect(56, 56, 1688, 896);
  sprocketRow(ctx, 94, 56, 1744);
  sprocketRow(ctx, 914, 56, 1744);
  text(ctx, TEXT.scene, 72, 1022, {
    font: `400 24px ${FONT.script}`,
    color: COLOR.dim,
    spacing: 4.3,
  });
  text(ctx, TEXT.title, 68, 1150, {
    font: `400 144px ${FONT.display}`,
    color: COLOR.umber,
  });
  const right = BOOTH_PHOTO_WIDTH - 72;
  TEXT.thanks.forEach((line, i) => {
    text(ctx, line, right, 1050 + i * 44, {
      font: `italic 400 38px ${FONT.serif}`,
      color: COLOR.dim,
      align: "right",
    });
  });
  text(ctx, TEXT.date, right, 1150, {
    font: `400 28px ${FONT.script}`,
    color: COLOR.ember,
    align: "right",
    spacing: 4,
  });
}

function drawTiket(ctx: Ctx, photoNumber: string) {
  ctx.fillStyle = COLOR.sand;
  ctx.fillRect(0, 0, BOOTH_PHOTO_WIDTH, BOOTH_PHOTO_HEIGHT);

  // Sobekan tiket: titik berlubang vertikal di antara foto dan potongan tiket.
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLOR.umber;
  for (let y = 16; y < BOOTH_PHOTO_HEIGHT; y += 32) {
    ctx.beginPath();
    ctx.arc(1354, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const left = 1404;
  text(ctx, "PEMUTARAN PERDANA", left, 100, {
    font: `400 22px ${FONT.script}`,
    color: COLOR.ember,
    spacing: 4,
  });
  text(ctx, "HASRI", left, 232, { font: `400 120px ${FONT.display}`, color: COLOR.umber });
  text(ctx, "& RAMLI", left, 338, { font: `400 120px ${FONT.display}`, color: COLOR.umber });

  const fields: [string, string][] = [
    ["TANGGAL", TEXT.date],
    ["STUDIO", TEXT.studio],
    ["KURSI", TEXT.seat],
    ["NO.", photoNumber],
  ];
  fields.forEach(([label, value], i) => {
    const y = 600 + i * 96;
    text(ctx, label, left, y, { font: `400 20px ${FONT.script}`, color: COLOR.dim, spacing: 3.6 });
    text(ctx, value, left, y + 42, { font: `700 30px ${FONT.script}`, color: COLOR.umber });
  });

  TEXT.keepsake.forEach((line, i) => {
    text(ctx, line, left, 1092 + i * 40, {
      font: `italic 400 34px ${FONT.serif}`,
      color: COLOR.dim,
    });
  });
}

/**
 * Menggambar bingkai saja (tanpa foto), dengan jendela foto dikosongkan (transparan). Dipakai
 * sebagai lapisan atas pratinjau langsung dan saat menyusun hasil.
 */
export function drawFrame(ctx: Ctx, frame: BoothFrame, photoNumber = "0000") {
  ctx.save();
  if (frame === "poster") drawPoster(ctx);
  else if (frame === "strip") drawStrip(ctx);
  else drawTiket(ctx, photoNumber);
  const { x, y, w, h } = FRAME_SPECS[frame].window;
  ctx.clearRect(x, y, w, h);
  ctx.restore();
}

/**
 * Menyusun hasil akhir 1800×1200: foto (tidak dicerminkan) dipotong ke jendela dengan filter
 * bingkai, lalu bingkai di atasnya.
 */
export function composePhoto(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  sourceSize: { width: number; height: number },
  frame: BoothFrame,
  photoNumber: string,
) {
  canvas.width = BOOTH_PHOTO_WIDTH;
  canvas.height = BOOTH_PHOTO_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");

  const spec = FRAME_SPECS[frame];
  const win = spec.window;
  const crop = coverCrop(sourceSize, win);

  // Bingkai digambar di canvas terpisah agar jendela transparannya tidak menghapus foto.
  const overlay = document.createElement("canvas");
  overlay.width = BOOTH_PHOTO_WIDTH;
  overlay.height = BOOTH_PHOTO_HEIGHT;
  const overlayCtx = overlay.getContext("2d");
  if (!overlayCtx) throw new Error("Canvas tidak tersedia");
  drawFrame(overlayCtx, frame, photoNumber);

  ctx.fillStyle = spec.ground;
  ctx.fillRect(0, 0, BOOTH_PHOTO_WIDTH, BOOTH_PHOTO_HEIGHT);
  ctx.save();
  ctx.filter = spec.photoFilter;
  ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, win.x, win.y, win.w, win.h);
  ctx.restore();
  ctx.drawImage(overlay, 0, 0);
}

/** Hasil canvas sebagai JPEG berkualitas tinggi (untuk dicetak dan diunggah). */
export function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal menyimpan foto"))),
      "image/jpeg",
      0.95,
    );
  });
}
