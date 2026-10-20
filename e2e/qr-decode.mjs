// Memastikan pembaca QR (zxing-wasm) bekerja, dan memuat WASM dari aplikasi sendiri, bukan dari CDN.
// Kamera tidak ada di peramban headless, jadi gambar QR dibuat dengan paket `qrcode` lalu dibaca
// oleh modul detektor yang sama dengan yang dipakai scanner.
import QRCode from "qrcode";
import {
  closeBrowsers,
  killTree,
  newPage,
  REPO,
  reporter,
  sleep,
  spawnTree,
  waitHttp,
} from "./lib.mjs";

const PORT = 5198;
const BASE = `http://localhost:${PORT}`;
const { problems, check } = reporter();

const dev = spawnTree(
  `${REPO}/apps/web/node_modules/.bin/vite`,
  ["--host", "localhost", "--port", String(PORT), "--strictPort"],
  {
    cwd: `${REPO}/apps/web`,
    stdio: "ignore",
  },
);

try {
  check(await waitHttp(`${BASE}/`), "server pengembangan web berjalan");

  const samples = {
    "kode mentah 300px": await QRCode.toDataURL("ABC234", { width: 300, margin: 2 }),
    "kode mentah kecil 120px": await QRCode.toDataURL("XYZ789", { width: 120, margin: 1 }),
    "tautan undangan": await QRCode.toDataURL("https://nikah.example/u/HJK456", {
      width: 320,
      margin: 2,
    }),
    "koreksi kesalahan rendah": await QRCode.toDataURL("MNP234", {
      width: 260,
      margin: 2,
      errorCorrectionLevel: "L",
    }),
  };
  const expected = {
    "kode mentah 300px": "ABC234",
    "kode mentah kecil 120px": "XYZ789",
    "tautan undangan": "https://nikah.example/u/HJK456",
    "koreksi kesalahan rendah": "MNP234",
  };

  const page = await newPage("qr", { width: 800, height: 600 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });

  const wasmRequests = [];
  page.on("request", (r) => {
    if (r.url().includes(".wasm")) wasmRequests.push(r.url());
  });

  const results = await page.evaluate(async (images) => {
    const { createQrDetector } = await import("/src/lib/scan/detector.ts");
    const detector = await createQrDetector();
    const out = { kind: detector.kind, values: {} };
    for (const [name, dataUrl] of Object.entries(images)) {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      out.values[name] = await detector.detect(canvas);
    }
    // gambar tanpa QR tidak boleh menghasilkan apa-apa
    const blank = document.createElement("canvas");
    blank.width = blank.height = 200;
    const ctx = blank.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 200, 200);
    out.values.kosong = await detector.detect(blank);
    return out;
  }, samples);

  check(
    results.kind === "wasm",
    `detektor memakai WASM karena peramban ini tidak punya BarcodeDetector (kind=${results.kind})`,
  );
  for (const [name, want] of Object.entries(expected)) {
    const got = results.values[name] ?? [];
    check(got.length === 1 && got[0] === want, `${name}: terbaca "${got[0] ?? "—"}"`);
  }
  check((results.values.kosong ?? []).length === 0, "gambar tanpa QR tidak menghasilkan bacaan");

  await sleep(300);
  check(
    wasmRequests.length >= 1 && wasmRequests.every((u) => u.startsWith(`http://localhost:${PORT}`)),
    `berkas WASM diambil dari aplikasi sendiri (${wasmRequests.length} permintaan)`,
  );
  check(
    page.external.length === 0,
    `tidak ada permintaan ke luar localhost: ${page.external.slice(0, 2).join(" | ") || "bersih"}`,
  );
  check(page.errors.length === 0, `tidak ada error JavaScript ${page.errors.slice(0, 1).join("")}`);
} catch (err) {
  console.log("KEGAGALAN SKRIP:", err.stack?.split("\n").slice(0, 5).join("\n"));
  problems.push(`skrip berhenti: ${err.message}`);
} finally {
  await closeBrowsers();
  killTree(dev);
}

console.log(
  problems.length === 0
    ? "\nSEMUA LOLOS"
    : `\n${problems.length} MASALAH:\n- ${problems.join("\n- ")}`,
);
process.exit(problems.length === 0 ? 0 : 1);
