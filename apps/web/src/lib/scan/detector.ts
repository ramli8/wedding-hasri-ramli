import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

type Source = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

export interface QrDetector {
  /** Mengembalikan isi semua QR yang terbaca pada gambar atau frame video. */
  detect(source: Source): Promise<string[]>;
  /** Mesin yang sedang dipakai; berubah ke "wasm" bila mesin bawaan ternyata tidak berfungsi. */
  readonly kind: "native" | "wasm";
}

type NativeDetector = {
  detect(source: unknown): Promise<{ rawValue: string }[]>;
};
type NativeDetectorCtor = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats(): Promise<string[]>;
};

/** Sisi terpanjang gambar yang dikirim ke pembaca WASM. Frame kamera 1280px cukup diperkecil. */
const MAX_SIDE = 800;

const sizeOf = (source: Source) =>
  source instanceof HTMLVideoElement
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.width, height: source.height };

/**
 * Pembaca QR berbasis zxing-wasm, dipanggil langsung (tanpa ponyfill BarcodeDetector). Jalur lewat
 * ponyfill terbukti gagal di build kita ("Failed to allocate ... bytes in WASM memory"), sedangkan
 * `readBarcodes` langsung berfungsi; uji pembaca QR di halaman Uji Kesiapan menjaga hal ini.
 */
async function createWasmDetector(): Promise<(source: Source) => Promise<string[]>> {
  // Berkas WASM diambil dari aplikasi sendiri, bukan dari CDN, supaya tetap berfungsi saat
  // internet mati dan bisa di-cache oleh service worker.
  await prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith(".wasm") ? wasmUrl : prefix + path,
    },
    fireImmediately: true,
  });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D tidak tersedia");

  return async (source) => {
    const { width, height } = sizeOf(source);
    if (!width || !height) return [];
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const results = await readBarcodes(image, { formats: ["QRCode"], maxNumberOfSymbols: 1 });
    return results.filter((r) => r.isValid).map((r) => r.text);
  };
}

/** Kanvas kecil untuk menguji apakah mesin bawaan benar-benar bisa mendeteksi. */
function probeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  return canvas;
}

/**
 * Memakai BarcodeDetector bawaan peramban bila ada dan benar-benar berfungsi (Chrome Android).
 *
 * "Ada" tidak cukup: sebagian peramban mengaku mendukung `qr_code` tetapi `detect()` melempar
 * "Barcode detection service unavailable". Karena itu mesin bawaan diuji dulu dengan satu panggilan
 * nyata, dan jika gagal di tengah pemakaian pun scanner pindah ke WASM, bukan diam-diam berhenti.
 */
export async function createQrDetector(): Promise<QrDetector> {
  let wasmDetect: ((source: Source) => Promise<string[]>) | null = null;
  const wasm = async () => {
    wasmDetect ??= await createWasmDetector();
    return wasmDetect;
  };

  let nativeDetect: ((source: Source) => Promise<string[]>) | null = null;
  const Native = (globalThis as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector;
  if (Native) {
    try {
      if ((await Native.getSupportedFormats()).includes("qr_code")) {
        const native = new Native({ formats: ["qr_code"] });
        await native.detect(probeCanvas());
        nativeDetect = async (source) => (await native.detect(source)).map((b) => b.rawValue);
      }
    } catch {
      /* mesin bawaan tidak berfungsi: pakai WASM */
    }
  }

  const detector: QrDetector & { kind: "native" | "wasm" } = {
    kind: nativeDetect ? "native" : "wasm",
    async detect(source) {
      if (detector.kind === "native" && nativeDetect) {
        try {
          return await nativeDetect(source);
        } catch {
          detector.kind = "wasm"; // gagal di tengah pemakaian
        }
      }
      return (await wasm())(source);
    },
  };
  if (!nativeDetect) await wasm();
  return detector;
}
