// Uji beban: ratusan tamu membuka undangan bersamaan (mis. sesaat setelah undangan disebar lewat
// WhatsApp), ditambah pengunjung iseng yang tidak diundang dan HP scanner yang check-in di pintu.
// Lihat e2e/README.md. API memakai build produksi dan dibatasi 2 core CPU (seperti VPS 2 vCPU).
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ADMIN,
  API,
  API_PORT,
  createAdminAccount,
  killTree,
  prepareDatabase,
  REPO,
  reporter,
  spawnTree,
  truncateDatabase,
  waitHttp,
} from "./lib.mjs";

const GUESTS = Number(process.env.LOAD_GUESTS ?? 500);
const CURIOUS = Number(process.env.LOAD_CURIOUS ?? 300);
/** Tamu yang berbagi satu IP (Wi-Fi gedung atau CGNAT operator seluler). */
const SHARED_IP_GUESTS = Number(process.env.LOAD_SHARED ?? 100);
const DEVICES = Number(process.env.LOAD_DEVICES ?? 4);
/** Semua pengunjung datang dalam rentang ini (detik). */
const RAMP_S = Number(process.env.LOAD_RAMP_S ?? 10);
const CPUS = process.env.LOAD_CPUS ?? "0,1";
const P95_LIMIT_MS = Number(process.env.LOAD_P95_MS ?? 1000);
const ORIGIN = "http://localhost:4173";
const WISH_QTY = 5;
/** Versi protokol sinkron dibaca dari kontrak bersama, supaya uji ini tidak basi saat versinya naik. */
const SYNC_VERSION = readFileSync(`${REPO}/packages/shared/src/version.ts`, "utf8").match(
  /SYNC_PROTOCOL_VERSION\s*=\s*(\d+)/,
)?.[1];

const { problems, check } = reporter();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = () => Array.from({ length: 6 }, () => pick([...ALPHABET])).join("");

// --- pencatatan -------------------------------------------------------------------------------------
const stats = new Map(); // label -> { ms: number[], codes: Map<status, n> }
const unexpected = [];

/** Satu permintaan HTTP; `ok` adalah status yang dianggap benar untuk skenario ini. */
async function call(label, ip, path, { method = "GET", body, ok = [200], headers = {} } = {}) {
  const started = performance.now();
  let status = 0;
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        "x-client-ip": ip,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    status = res.status;
    await res.arrayBuffer();
  } catch {
    status = -1; // koneksi gagal
  }
  const ms = performance.now() - started;
  const entry = stats.get(label) ?? { ms: [], codes: new Map() };
  entry.ms.push(ms);
  entry.codes.set(status, (entry.codes.get(status) ?? 0) + 1);
  stats.set(label, entry);
  if (!ok.includes(status)) unexpected.push(`${label} -> ${status}`);
  return status;
}

const percentile = (sorted, p) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0;

function printStats() {
  console.log("\nendpoint                      jumlah   p50    p95    p99    maks   status");
  for (const [label, { ms, codes }] of [...stats].sort()) {
    const s = [...ms].sort((a, b) => a - b);
    const f = (v) => `${Math.round(v)}`.padStart(5);
    const statuses = [...codes].map(([c, n]) => `${c}:${n}`).join(" ");
    console.log(
      `${label.padEnd(28)} ${String(s.length).padStart(6)} ${f(percentile(s, 50))}  ${f(percentile(s, 95))}  ${f(percentile(s, 99))}  ${f(s.at(-1) ?? 0)}   ${statuses}`,
    );
  }
}

// --- server -----------------------------------------------------------------------------------------
let apiProc = null;
let indexServer = null;
let mediaDir = "";

async function startServers(dbUrl) {
  // index.html palsu untuk /u/KODE (di produksi diambil dari container web).
  indexServer = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(
      '<!doctype html><html><head><title>Hasri & Ramli</title></head><body><div id="root"></div></body></html>',
    );
  });
  await new Promise((r) => indexServer.listen(0, "127.0.0.1", r));
  const indexUrl = `http://127.0.0.1:${indexServer.address().port}/index.html`;

  const build = spawnSync("pnpm", ["--filter", "@wedding/api", "build"], {
    cwd: REPO,
    stdio: "ignore",
  });
  if (build.status !== 0) throw new Error("Build API gagal");

  mediaDir = mkdtempSync(join(tmpdir(), "wedding-load-media-"));
  // taskset: API hanya boleh memakai 2 core, mendekati VPS 2 vCPU. RAM dibatasi seperti container.
  apiProc = spawnTree(
    "taskset",
    ["-c", CPUS, "node", "--max-old-space-size=512", "dist/index.js"],
    {
      cwd: `${REPO}/apps/api`,
      env: {
        ...process.env,
        NODE_ENV: "production",
        COOKIE_SECURE: "true",
        TRUST_PROXY: "true",
        DATABASE_URL: dbUrl,
        ALLOWED_ORIGINS: ORIGIN,
        LOG_LEVEL: "warn",
        PORT: String(API_PORT),
        MEDIA_DIR: mediaDir,
        WEB_INDEX_URL: indexUrl,
      },
      stdio: ["ignore", "ignore", "inherit"],
    },
  );
  return waitHttp(`${API}/api/health`);
}

function stopServers() {
  killTree(apiProc);
  indexServer?.close();
  if (mediaDir) rmSync(mediaDir, { recursive: true, force: true });
}

// --- data ---------------------------------------------------------------------------------------------
async function seed() {
  createAdminAccount();
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, "x-client-ip": "10.0.0.1" },
    body: JSON.stringify(ADMIN),
  });
  if (res.status !== 200) throw new Error(`login admin gagal: ${res.status}`);
  globalThis.__cookie = res.headers.get("set-cookie").split(";")[0];

  const adminCall = async (method, path, body) => {
    const r = await fetch(`${API}/api/v1/admin${path}`, {
      method,
      headers: { "content-type": "application/json", origin: ORIGIN, cookie: globalThis.__cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    if (r.status >= 300) throw new Error(`${method} ${path}: ${r.status} ${text}`);
    return JSON.parse(text);
  };

  await adminCall("PUT", "/settings", {
    groomName: "Ramli",
    brideName: "Hasri",
    publicBaseUrl: "https://contoh.com",
  });
  const { event } = await adminCall("POST", "/events", {
    slug: "resepsi",
    name: "Resepsi",
    startsAt: "2027-05-21T11:00:00.000Z",
    endsAt: "2027-05-21T14:00:00.000Z",
    checkinEnabled: true,
    hasRsvp: true,
  });

  // Tamu dibuat lewat admin API (jalur yang sama dengan pemakaian nyata), 20 sekaligus.
  const guests = [];
  for (let i = 0; i < GUESTS; i += 20) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(20, GUESTS - i) }, (_, j) =>
        adminCall("POST", "/guests", {
          displayName: `Tamu ${i + j + 1}`,
          phone: `0812${String(10_000_000 + i + j)}`,
          isRombongan: (i + j) % 10 === 0,
          eventIds: [event.id],
        }),
      ),
    );
    guests.push(...batch.map((b) => b.guest));
  }

  const { item: wish } = await adminCall("POST", "/invitation/wishes", {
    name: "Rice cooker",
    quantity: WISH_QTY,
  });

  // Satu foto untuk diuji penyajian /media.
  const requireFromApi = createRequire(`${REPO}/apps/api/package.json`);
  const sharp = requireFromApi("sharp");
  const png = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: "#884422" },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.append("file", new File([png], "foto.png"));
  const up = await fetch(`${API}/api/v1/admin/media`, {
    method: "POST",
    headers: { origin: ORIGIN, cookie: globalThis.__cookie },
    body: form,
  });
  const { media } = await up.json();

  const devices = [];
  for (let d = 0; d < DEVICES; d++) {
    const { pairingCode } = await adminCall("POST", "/devices", { name: `HP Pintu ${d + 1}` });
    const r = await fetch(`${API}/api/v1/device/pair`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sync-version": SYNC_VERSION,
        "x-client-ip": `10.9.0.${d + 1}`,
      },
      body: JSON.stringify({ code: pairingCode }),
    });
    devices.push(await r.json());
  }
  return { event, guests, wish, media, devices, adminCall };
}

// --- skenario -----------------------------------------------------------------------------------------
async function invitedGuest(ctx, guest, ip) {
  await sleep(Math.random() * RAMP_S * 1000);
  await call("GET /u/KODE", ip, `/u/${guest.code}`);
  await call("GET invitation", ip, "/api/v1/public/invitation");
  await call("GET ticket", ip, `/api/v1/public/ticket/${guest.code}`);
  await call("GET guestbook", ip, "/api/v1/public/guestbook");
  await call("GET claims", ip, `/api/v1/public/claims/${guest.code}`);
  await call("GET /media thumb", ip, `/media/${ctx.media.id}/thumb.webp`);
  await sleep(500 + Math.random() * 2000); // membaca halaman
  await call("POST rsvp", ip, "/api/v1/public/rsvp", {
    method: "POST",
    body: {
      code: guest.code,
      eventId: ctx.event.id,
      status: "hadir",
      ...(guest.isRombongan ? { pax: 3 } : {}),
    },
  });
  ctx.rsvped.add(guest.id);
  if (Math.random() < 0.3) {
    await call("POST guestbook", ip, "/api/v1/public/guestbook", {
      method: "POST",
      body: { code: guest.code, message: `Selamat menempuh hidup baru dari ${guest.displayName}` },
      ok: [201],
    });
    ctx.guestbookPosts += 1;
  }
  if (Math.random() < 0.1) {
    // Beberapa tamu berebut hadiah yang sama: hanya WISH_QTY yang boleh dapat.
    const status = await call("POST claims", ip, "/api/v1/public/claims", {
      method: "POST",
      body: { code: guest.code, wishId: ctx.wish.id, quantity: 1 },
      ok: [200, 409],
    });
    if (status === 200) ctx.claimed += 1;
  }
}

async function curiousVisitor(ip) {
  await sleep(Math.random() * RAMP_S * 1000);
  // Tidak diundang: menebak-nebak kode dan membuka halaman umum.
  await call("GET /u/ACAK", ip, `/u/${randomCode()}`);
  await call("GET invitation", ip, "/api/v1/public/invitation");
  await call("GET guestbook", ip, "/api/v1/public/guestbook");
  for (let i = 0; i < 3; i++) {
    await call("GET ticket ACAK", ip, `/api/v1/public/ticket/${randomCode()}`, { ok: [404] });
  }
}

/** HP pintu: setiap ±1 detik mencatat check-in tamu lalu sinkron (push + snapshot) seperti aplikasi. */
async function doorDevice(ctx, device, index, queue, until) {
  let rev = 0;
  let seq = 0;
  const ip = `10.9.0.${index + 1}`;
  const headers = { authorization: `Bearer ${device.token}`, "x-sync-version": SYNC_VERSION };
  while (Date.now() < until) {
    const batch = queue.splice(0, 3);
    const events = batch.map((guest) => ({
      id: randomUUID(),
      kind: "checkin",
      guestId: guest.id,
      eventId: ctx.event.id,
      pax: guest.isRombongan ? 3 : 1,
      method: "qr",
      scannedAt: new Date().toISOString(),
    }));
    await call("POST sync/push", ip, "/api/v1/sync/push", {
      method: "POST",
      headers,
      body: {
        deviceTime: new Date().toISOString(),
        appVersion: "load",
        pendingOutbox: events.length,
        walkins: [],
        events,
      },
    });
    ctx.checkedIn += events.length;
    const started = performance.now();
    const res = await fetch(`${API}/api/v1/sync/snapshot?sinceRev=${rev}&sinceSeq=${seq}`, {
      headers: { ...headers, "x-client-ip": ip },
    });
    const ms = performance.now() - started;
    const label = rev === 0 ? "GET snapshot penuh" : "GET snapshot delta";
    const entry = stats.get(label) ?? { ms: [], codes: new Map() };
    entry.ms.push(ms);
    entry.codes.set(res.status, (entry.codes.get(res.status) ?? 0) + 1);
    stats.set(label, entry);
    if (res.status === 200) {
      const snap = await res.json();
      rev = snap.guestRev;
      seq = snap.checkinSeq;
    } else {
      unexpected.push(`${label} -> ${res.status}`);
    }
    await sleep(1000);
  }
}

// --- jalannya uji --------------------------------------------------------------------------------------
async function main() {
  // Database dipilih lewat skrip `pnpm e2e:load` (bawaan wedding_load), terpisah dari wedding_e2e.
  const dbUrl = await prepareDatabase();
  console.log(`== menyalakan API produksi (CPU ${CPUS}, heap 512 MB)`);
  check(await startServers(dbUrl), "API menyala");
  await truncateDatabase();

  console.log(`== menyiapkan ${GUESTS} tamu, ${DEVICES} HP pintu`);
  const seeded = await seed();
  const ctx = { ...seeded, rsvped: new Set(), guestbookPosts: 0, claimed: 0, checkedIn: 0 };

  console.log(
    `== beban: ${GUESTS} tamu (${SHARED_IP_GUESTS} di antaranya berbagi satu IP) + ${CURIOUS} pengunjung iseng dalam ${RAMP_S} detik, ${DEVICES} HP check-in`,
  );
  const started = Date.now();
  const doorQueue = [...ctx.guests]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(GUESTS * 0.6));
  const doors = ctx.devices.map((device, i) =>
    doorDevice(ctx, device, i, doorQueue, started + (RAMP_S + 15) * 1000),
  );
  const visitors = [
    ...ctx.guests.map((guest, i) =>
      invitedGuest(ctx, guest, i < SHARED_IP_GUESTS ? "100.64.0.1" : `100.70.${i >> 8}.${i & 255}`),
    ),
    ...Array.from({ length: CURIOUS }, (_, i) => curiousVisitor(`100.80.${i >> 8}.${i & 255}`)),
  ];
  await Promise.all([...visitors, ...doors]);
  const seconds = (Date.now() - started) / 1000;
  const total = [...stats.values()].reduce((n, s) => n + s.ms.length, 0);
  printStats();
  console.log(
    `\n${total} permintaan dalam ${seconds.toFixed(1)} detik (${Math.round(total / seconds)}/detik)\n`,
  );

  // --- pemeriksaan -------------------------------------------------------------------------------------
  check(
    unexpected.length === 0,
    `tidak ada jawaban tak terduga (${unexpected.length}: ${[...new Set(unexpected)].slice(0, 6).join(", ")})`,
  );
  for (const [label, { ms }] of stats) {
    const p95 = percentile(
      [...ms].sort((a, b) => a - b),
      95,
    );
    check(p95 <= P95_LIMIT_MS, `${label}: p95 ${Math.round(p95)} ms <= ${P95_LIMIT_MS} ms`);
  }

  const dash = await ctx.adminCall("GET", `/checkins/dashboard?eventId=${ctx.event.id}`);
  const rsvp = await ctx.adminCall("GET", `/rsvps?eventId=${ctx.event.id}`);
  const gb = await (
    await fetch(`${API}/api/v1/public/guestbook?pageSize=1`, {
      headers: { "x-client-ip": "10.0.0.2" },
    })
  ).json();
  const wish = (await ctx.adminCall("GET", "/invitation/wishes")).items.find(
    (w) => w.id === ctx.wish.id,
  );

  check(
    rsvp.totals.hadir === ctx.rsvped.size,
    `RSVP tersimpan semua (${rsvp.totals.hadir}/${ctx.rsvped.size})`,
  );
  check(
    gb.total === ctx.guestbookPosts,
    `ucapan tersimpan semua (${gb.total}/${ctx.guestbookPosts})`,
  );
  check(
    wish.claimed <= WISH_QTY,
    `hadiah tidak dipilih melebihi jumlahnya (${wish.claimed}/${WISH_QTY})`,
  );
  check(
    wish.claimed === Math.min(ctx.claimed, WISH_QTY),
    `jumlah pilihan hadiah cocok (${wish.claimed}, sukses ${ctx.claimed})`,
  );
  check(
    dash.totals.arrived === ctx.checkedIn,
    `check-in tercatat semua di server (${dash.totals.arrived}/${ctx.checkedIn})`,
  );
}

try {
  await main();
} catch (err) {
  console.error(err);
  problems.push(String(err));
} finally {
  stopServers();
}
if (problems.length) {
  console.log(`\n${problems.length} MASALAH:`);
  for (const p of problems) console.log(`- ${p}`);
  process.exit(1);
}
console.log("\nSEMUA LOLOS");
