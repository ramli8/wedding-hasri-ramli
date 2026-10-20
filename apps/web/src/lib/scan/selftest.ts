import { createQrDetector } from "./detector.js";
import { SELFTEST_IMAGE, SELFTEST_TEXT } from "./selftest-qr.js";

export type QrSelfTest =
  | { ok: true; engine: "native" | "wasm"; ms: number }
  | { ok: false; error: string };

/**
 * Membaca sebuah QR contoh yang tertanam di aplikasi memakai mesin yang sama dengan scanner.
 * Membuktikan, tanpa kamera dan tanpa internet, bahwa pembaca QR (termasuk WASM) benar-benar
 * berfungsi di perangkat ini.
 */
export async function runQrSelfTest(): Promise<QrSelfTest> {
  const started = performance.now();
  try {
    const image = new Image();
    image.src = SELFTEST_IMAGE;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d")?.drawImage(image, 0, 0);

    const detector = await createQrDetector();
    const values = await detector.detect(canvas);
    if (values[0] !== SELFTEST_TEXT) {
      return {
        ok: false,
        error: `QR contoh terbaca "${values[0] ?? "kosong"}", seharusnya "${SELFTEST_TEXT}"`,
      };
    }
    return { ok: true, engine: detector.kind, ms: Math.round(performance.now() - started) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Pembaca QR gagal" };
  }
}
