import { BOOTH_PHOTO_HEIGHT, BOOTH_PHOTO_WIDTH, type BoothFrame } from "@wedding/shared";
import QRCode from "qrcode";

/**
 * Bingkai photobooth bertema bunga (contoh dari pemilik, 11 Nov 2026), digambar di canvas 1800×1200
 * (4R mendatar, 300 dpi). Setiap bingkai punya satu jendela foto; foto dipotong menutupi jendela
 * itu, lalu bingkai ditumpuk di atasnya. Bunga, daun, dan pelat nama digambar oleh kode (tanpa
 * berkas gambar), jadi tetap jalan offline. Foto tidak diberi filter warna.
 *
 * Kunci bingkai (`poster`, `strip`, `tiket`) dipertahankan dari desain lama supaya foto dan
 * pengaturan yang sudah tersimpan tetap sah; nama tampilannya ada di BOOTH_FRAME_LABELS.
 *
 * Teks mengikuti isi undangan; ganti di sini bila nama, tanggal, atau lokasi berubah.
 */
const TEXT = {
  kicker: "THE WEDDING OF",
  names: "Hasri & Ramli",
  first: "Hasri",
  second: "Ramli",
  date: "Jumat, 21 Mei 2027",
  venue: "Gedung Graha Bunga",
  qr: "Unduh fotomu",
};

const COLOR = {
  cream: "#fbf6ef",
  paper: "#fffdf9",
  gold: "#c9a66b",
  goldDeep: "#9c7a45",
  ink: "#5b3f3a",
  rose: "#8f4a55",
  dim: "#8a7268",
};

const FONT = {
  script: '"Great Vibes", "Brush Script MT", cursive',
  serif: '"Cormorant Garamond", Georgia, serif',
};

/** Font yang harus sudah dimuat sebelum menggambar (lihat `loadFrameFonts`). */
const FONT_FACES = [`400 64px ${FONT.script}`, `500 32px ${FONT.serif}`, `400 32px ${FONT.serif}`];

export type Rect = { x: number; y: number; w: number; h: number };

export type FrameSpec = {
  /** Kotak jendela foto dalam koordinat canvas 1800×1200 (foto menutupi kotak ini). */
  window: Rect;
  /** Sudut atas jendela dibulatkan (bingkai lengkung); 0 = persegi. */
  archRadius: number;
  /** Warna latar layar booth agar pratinjau menyatu dengan bingkai. */
  ground: string;
};

export const FRAME_SPECS: Record<BoothFrame, FrameSpec> = {
  // Bunga di keempat sudut, pelat nama di tengah bawah (paling mirip contoh pemilik).
  poster: { window: { x: 60, y: 60, w: 1680, h: 1080 }, archRadius: 0, ground: COLOR.cream },
  // Foto besar di kiri, panel krem berbunga di kanan berisi nama dan QR.
  strip: { window: { x: 60, y: 60, w: 1200, h: 1080 }, archRadius: 0, ground: COLOR.cream },
  // Jendela lengkung di tengah, untaian bunga di kedua sisi.
  tiket: { window: { x: 300, y: 60, w: 1200, h: 960 }, archRadius: 340, ground: COLOR.cream },
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

/** Nomor foto: 4 digit, mis. 0127 (untuk petugas; tidak tercetak di bingkai). */
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
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "alphabetic";
  // letterSpacing belum ada di semua peramban; tanpa itu teks tetap terbaca, hanya lebih rapat.
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${opts.spacing ?? 0}px`;
  ctx.fillText(value, x, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}

function roundRect(ctx: Ctx, r: Rect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, radius);
}

/** Jalur jendela foto: persegi, atau lengkung dengan sudut atas membulat besar. */
function windowPath(ctx: Ctx, spec: FrameSpec, inset = 0) {
  const { x, y, w, h } = spec.window;
  const r = spec.archRadius;
  ctx.beginPath();
  if (r > 0) {
    ctx.roundRect(x + inset, y + inset, w - inset * 2, h - inset * 2, [
      Math.max(0, r - inset),
      Math.max(0, r - inset),
      0,
      0,
    ]);
  } else {
    ctx.rect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  }
}

// --- Bunga ---------------------------------------------------------------------------------------

type Palette = { edge: string; mid: string; heart: string };

const BLUSH: Palette = { edge: "#f0a9ac", mid: "#f8d3d0", heart: "#c9606f" };
const PEACH: Palette = { edge: "#f2b38f", mid: "#fbdcc6", heart: "#c97b52" };
const ROSE: Palette = { edge: "#e58a96", mid: "#f6c2c6", heart: "#a8485a" };
const LEAF = { light: "#b9c9a6", dark: "#7f9a74", vein: "#e8eedf" };

/** Bunga berlapis (kesan cat air): tiga lapis kelopak dengan gradasi, putik di tengah. */
function blossom(ctx: Ctx, x: number, y: number, r: number, rot: number, palette: Palette) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const layers: [number, number][] = [
    [1, 6],
    [0.72, 5],
    [0.46, 5],
  ];
  layers.forEach(([scale, count], layer) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + layer * 0.55;
      const dist = r * 0.5 * scale;
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(dist, 0);
      const g = ctx.createRadialGradient(-r * 0.3 * scale, 0, 0, 0, 0, r * 0.6 * scale);
      g.addColorStop(0, palette.mid);
      g.addColorStop(1, palette.edge);
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.56 * scale, r * 0.4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.heart;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOR.gold;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2, r * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Daun runcing dengan tulang daun tipis. */
function leaf(ctx: Ctx, x: number, y: number, len: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, LEAF.dark);
  g.addColorStop(1, LEAF.light);
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.26, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.26, 0, 0);
  ctx.fill();
  ctx.strokeStyle = LEAF.vein;
  ctx.lineWidth = Math.max(1.5, len * 0.015);
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(len * 0.05, 0);
  ctx.lineTo(len * 0.9, 0);
  ctx.stroke();
  ctx.restore();
}

/** Kuncup kecil. */
function bud(ctx: Ctx, x: number, y: number, r: number, palette: Palette) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, palette.mid);
  g.addColorStop(1, palette.edge);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Rangkaian bunga di satu titik. `dir` = arah rangkaian menjulur (radian); bunga besar di pangkal,
 * daun dan kuncup menjulur ke arah `dir` dan ke kedua sisinya. Susunannya tetap (tanpa acak),
 * jadi pratinjau dan hasil cetak selalu sama.
 */
function cluster(ctx: Ctx, x: number, y: number, scale: number, dir: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  ctx.scale(scale, scale);
  const leaves: [number, number, number, number][] = [
    [40, -30, 230, -0.55],
    [40, 30, 230, 0.55],
    [90, -10, 260, -0.15],
    [70, 20, 200, 0.25],
    [-10, -60, 170, -1.2],
    [-10, 60, 170, 1.2],
    [150, -70, 150, -0.35],
    [150, 70, 150, 0.4],
  ];
  for (const [lx, ly, len, rot] of leaves) leaf(ctx, lx, ly, len, rot);
  bud(ctx, 260, -60, 16, BLUSH);
  bud(ctx, 285, 40, 13, PEACH);
  bud(ctx, 210, 95, 12, ROSE);
  blossom(ctx, 150, 30, 58, 0.4, PEACH);
  blossom(ctx, 120, -70, 52, 1.1, BLUSH);
  blossom(ctx, 30, 70, 64, 0.2, BLUSH);
  blossom(ctx, 0, -20, 92, 0.9, ROSE);
  blossom(ctx, 205, -5, 34, 0.3, ROSE);
  ctx.restore();
}

// --- QR halaman foto ------------------------------------------------------------------------------

/** Kartu QR putih berisi tautan halaman foto tamu (`/foto/<id>`), dengan keterangan di bawahnya. */
function qrCard(ctx: Ctx, url: string, x: number, y: number, size: number) {
  const pad = 16;
  const label = 34;
  ctx.save();
  ctx.shadowColor = "rgba(91,63,58,.18)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fff";
  roundRect(ctx, { x, y, w: size, h: size + label }, 16);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 2;
  roundRect(ctx, { x, y, w: size, h: size + label }, 16);
  ctx.stroke();

  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const cell = (size - pad * 2) / n;
  ctx.fillStyle = "#1f1714";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        // +0.5 agar tidak ada celah tipis antarsel saat dicetak.
        ctx.fillRect(x + pad + c * cell, y + pad + r * cell, cell + 0.5, cell + 0.5);
      }
    }
  }
  text(ctx, TEXT.qr, x + size / 2, y + size + 18, {
    font: `500 22px ${FONT.serif}`,
    color: COLOR.ink,
    spacing: 1,
  });
}

// --- Bingkai ---------------------------------------------------------------------------------------

/** Garis emas ganda di sekeliling jendela foto. */
function goldOutline(ctx: Ctx, spec: FrameSpec) {
  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 6;
  windowPath(ctx, spec, -14);
  ctx.stroke();
  ctx.lineWidth = 2;
  windowPath(ctx, spec, -26);
  ctx.stroke();
}

/** Pelat nama putih bertepi emas (seperti contoh), berpusat di (cx, cy). */
function namePlate(ctx: Ctx, cx: number, cy: number) {
  const w = 700;
  const h = 236;
  const box = { x: cx - w / 2, y: cy - h / 2, w, h };
  ctx.save();
  ctx.shadowColor = "rgba(91,63,58,.22)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = COLOR.paper;
  roundRect(ctx, box, 118);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 5;
  roundRect(ctx, box, 118);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  roundRect(ctx, { x: box.x + 12, y: box.y + 12, w: w - 24, h: h - 24 }, 106);
  ctx.stroke();

  text(ctx, TEXT.kicker, cx, box.y + 62, {
    font: `500 26px ${FONT.serif}`,
    color: COLOR.goldDeep,
    spacing: 7,
  });
  text(ctx, TEXT.names, cx, box.y + 160, { font: `400 104px ${FONT.script}`, color: COLOR.rose });
  text(ctx, `${TEXT.date} · ${TEXT.venue}`, cx, box.y + 206, {
    font: `500 26px ${FONT.serif}`,
    color: COLOR.ink,
    spacing: 1,
  });
}

/** A: bunga di empat sudut, pelat nama di tengah bawah, QR di pojok kanan bawah. */
function decorSudut(ctx: Ctx, spec: FrameSpec, qr: string | null) {
  goldOutline(ctx, spec);
  const W = BOOTH_PHOTO_WIDTH;
  const H = BOOTH_PHOTO_HEIGHT;
  cluster(ctx, 40, 40, 1.05, Math.PI / 4);
  cluster(ctx, W - 40, 40, 1.05, (Math.PI * 3) / 4);
  cluster(ctx, 40, H - 40, 1.05, -Math.PI / 4);
  // Sudut kanan bawah lebih kecil agar QR tidak tertutup bunga.
  cluster(ctx, W - 30, H - 30, qr ? 0.62 : 1.05, (-Math.PI * 3) / 4);
  namePlate(ctx, W / 2, H - 150);
  if (qr) qrCard(ctx, qr, W - 312, H - 362, 230);
}

/** B: foto di kiri, panel krem di kanan berisi nama bersusun, tanggal, dan QR. */
function decorPanel(ctx: Ctx, spec: FrameSpec, qr: string | null) {
  goldOutline(ctx, spec);
  const W = BOOTH_PHOTO_WIDTH;
  const H = BOOTH_PHOTO_HEIGHT;
  const panelX = spec.window.x + spec.window.w;
  const cx = (panelX + W) / 2;

  cluster(ctx, W - 30, 30, 0.95, (Math.PI * 3) / 4);
  cluster(ctx, 40, H - 40, 1.0, -Math.PI / 4);
  cluster(ctx, panelX + 10, 40, 0.6, Math.PI / 3);

  const top = qr ? 330 : 420;
  text(ctx, TEXT.kicker, cx, top, {
    font: `500 28px ${FONT.serif}`,
    color: COLOR.goldDeep,
    spacing: 7,
  });
  text(ctx, TEXT.first, cx, top + 130, { font: `400 128px ${FONT.script}`, color: COLOR.rose });
  text(ctx, "&", cx, top + 200, { font: `400 64px ${FONT.script}`, color: COLOR.gold });
  text(ctx, TEXT.second, cx, top + 310, { font: `400 128px ${FONT.script}`, color: COLOR.rose });
  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 120, top + 362);
  ctx.lineTo(cx + 120, top + 362);
  ctx.stroke();
  text(ctx, TEXT.date, cx, top + 412, { font: `500 30px ${FONT.serif}`, color: COLOR.ink });
  text(ctx, TEXT.venue, cx, top + 452, { font: `400 28px ${FONT.serif}`, color: COLOR.dim });
  // QR di pojok kanan bawah panel (permintaan pemilik), bukan di tengah kolom teks.
  if (qr) qrCard(ctx, qr, W - 284, H - 302, 220);
}

/** C: jendela lengkung di tengah, untaian bunga di kedua sisi, nama di bawah, QR di pojok kanan bawah. */
function decorLengkung(ctx: Ctx, spec: FrameSpec, qr: string | null) {
  goldOutline(ctx, spec);
  const W = BOOTH_PHOTO_WIDTH;
  const H = BOOTH_PHOTO_HEIGHT;
  const { x, y, w, h } = spec.window;

  // Untaian menjulur naik di kedua sisi lengkung, dari pangkal di bawah. Dengan QR, untaian kanan
  // condong ke atas agar pojok kanan bawah kosong untuk QR.
  cluster(ctx, x - 10, y + h - 20, 1.0, -Math.PI / 2 - 0.35);
  cluster(ctx, x + 40, y + 300, 0.62, -Math.PI / 2 + 0.6);
  cluster(
    ctx,
    x + w + 10,
    y + h - (qr ? 60 : 20),
    qr ? 0.85 : 1.0,
    -Math.PI / 2 + (qr ? 0.1 : 0.35),
  );
  cluster(ctx, x + w - 40, y + 300, 0.62, -Math.PI / 2 - 0.6);
  cluster(ctx, 30, 30, 0.75, Math.PI / 4);
  cluster(ctx, W - 30, 30, 0.75, (Math.PI * 3) / 4);
  if (!qr) cluster(ctx, W - 30, H - 30, 0.75, (-Math.PI * 3) / 4);

  text(ctx, TEXT.names, W / 2, H - 70, { font: `400 100px ${FONT.script}`, color: COLOR.rose });
  text(ctx, `${TEXT.date} · ${TEXT.venue}`, W / 2, H - 22, {
    font: `500 26px ${FONT.serif}`,
    color: COLOR.ink,
    spacing: 1,
  });
  if (qr) qrCard(ctx, qr, W - 238, H - 290, 214);
}

/**
 * Menggambar bingkai saja (tanpa foto): latar krem, jendela foto dikosongkan (transparan), lalu
 * hiasan yang boleh menutupi tepi foto (bunga, pelat nama, QR). Dipakai sebagai lapisan atas
 * pratinjau langsung dan saat menyusun hasil.
 *
 * `qr` = tautan halaman foto tamu (`/foto/<id>`, unik per foto); kosong = tanpa QR.
 */
export function drawFrame(ctx: Ctx, frame: BoothFrame, qr: string | null = null) {
  const spec = FRAME_SPECS[frame];
  ctx.save();
  ctx.fillStyle = spec.ground;
  ctx.fillRect(0, 0, BOOTH_PHOTO_WIDTH, BOOTH_PHOTO_HEIGHT);
  ctx.globalCompositeOperation = "destination-out";
  windowPath(ctx, spec);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  if (frame === "poster") decorSudut(ctx, spec, qr);
  else if (frame === "strip") decorPanel(ctx, spec, qr);
  else decorLengkung(ctx, spec, qr);
  ctx.restore();
}

/**
 * Menyusun hasil akhir 1800×1200: foto (tidak dicerminkan, tanpa filter) dipotong ke jendela, lalu
 * bingkai di atasnya.
 */
export function composePhoto(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  sourceSize: { width: number; height: number },
  frame: BoothFrame,
  qr: string | null,
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
  drawFrame(overlayCtx, frame, qr);

  ctx.fillStyle = spec.ground;
  ctx.fillRect(0, 0, BOOTH_PHOTO_WIDTH, BOOTH_PHOTO_HEIGHT);
  ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, win.x, win.y, win.w, win.h);
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
