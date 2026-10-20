// Pembantu bersama untuk uji menyeluruh peramban (lihat e2e/README.md).
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

export const REPO = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
export const FIREFOX = process.env.FIREFOX_PATH ?? "/usr/bin/firefox";
export const OUT = process.env.E2E_OUT ?? `${REPO}/e2e/out`;
export const API_PORT = 3000;
export const WEB_PORT = 4173;
export const API = `http://localhost:${API_PORT}`;
export const WEB = `http://localhost:${WEB_PORT}`;
export const ORIGINS = `http://localhost:5173,${WEB}`;
export const ADMIN = { email: "uji@example.com", password: "sandi-uji-visual-1" };

// Database terpisah dari data pengembangan: uji ini menghapus semua isinya.
const DB_URL =
  process.env.E2E_DATABASE_URL ?? "postgres://wedding:wedding@localhost:5433/wedding_e2e";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function reporter() {
  const problems = [];
  const check = (ok, label) => {
    console.log(`${ok ? "OK   " : "GAGAL"} ${label}`);
    if (!ok) problems.push(label);
  };
  return { problems, check };
}

export async function waitHttp(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {}
    await sleep(300);
  }
  return false;
}

/** Membuat database uji bila belum ada, lalu mengosongkan tabelnya setelah migrasi dijalankan API. */
export async function prepareDatabase() {
  const requireFromApi = createRequire(`${REPO}/apps/api/package.json`);
  const postgres = requireFromApi("postgres");
  const url = new URL(DB_URL);
  const name = url.pathname.slice(1);
  url.pathname = "/postgres";
  const admin = postgres(url.toString(), { max: 1 });
  const exists = await admin`select 1 from pg_database where datname = ${name}`;
  if (exists.length === 0) await admin.unsafe(`create database "${name}"`);
  await admin.end();
  return DB_URL;
}

export async function truncateDatabase() {
  const requireFromApi = createRequire(`${REPO}/apps/api/package.json`);
  const postgres = requireFromApi("postgres");
  const sql = postgres(DB_URL, { max: 1 });
  const tables = await sql`select tablename from pg_tables where schemaname = 'public'`;
  const names = tables.map((t) => `"${t.tablename}"`).join(", ");
  if (names) await sql.unsafe(`truncate table ${names} restart identity cascade`);
  await sql.end();
}

export function buildWeb() {
  if (process.env.E2E_SKIP_BUILD) return;
  // NODE_ENV tidak boleh "development" (mis. dari .env) agar build berisi React produksi.
  const env = { ...process.env, VITE_APP_VERSION: "e2e" };
  delete env.NODE_ENV;
  const result = spawnSync("pnpm", ["--filter", "@wedding/web", "build"], {
    cwd: REPO,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("Build web gagal");
}

export function createAdminAccount() {
  const result = spawnSync(
    "pnpm",
    ["--filter", "@wedding/api", "admin:create", "--email", ADMIN.email, "--name", "Ramli"],
    {
      cwd: REPO,
      env: { ...process.env, DATABASE_URL: DB_URL, ADMIN_PASSWORD: ADMIN.password },
      stdio: "ignore",
    },
  );
  if (result.status !== 0) throw new Error("Gagal membuat akun admin uji");
}

/** Mematikan proses beserta anak-anaknya (tsx dan vite menjalankan proses turunan). */
export function killTree(proc) {
  if (!proc?.pid) return;
  try {
    process.kill(-proc.pid, "SIGTERM");
  } catch {
    proc.kill("SIGTERM");
  }
}

/** Menjalankan proses di grup sendiri supaya seluruhnya bisa dimatikan lewat killTree. */
export const spawnTree = (command, args, options) =>
  spawn(command, args, { ...options, detached: true });

// --- proses server ---------------------------------------------------------------------------------------
let apiProc = null;
let previewProc = null;

export async function startApi() {
  apiProc = spawnTree(
    `${REPO}/apps/api/node_modules/.bin/tsx`,
    ["--env-file-if-exists=../../.env", "src/index.ts"],
    {
      cwd: `${REPO}/apps/api`,
      env: { ...process.env, DATABASE_URL: DB_URL, ALLOWED_ORIGINS: ORIGINS, LOG_LEVEL: "warn" },
      stdio: "ignore",
    },
  );
  return waitHttp(`${API}/api/health`);
}

export async function stopApi() {
  if (!apiProc) return;
  killTree(apiProc);
  apiProc = null;
  const end = Date.now() + 10000;
  while (Date.now() < end) {
    try {
      await fetch(`${API}/api/health`);
      await sleep(200);
    } catch {
      return;
    }
  }
}

export async function startPreview() {
  previewProc = spawnTree(
    `${REPO}/apps/web/node_modules/.bin/vite`,
    ["preview", "--host", "localhost", "--port", String(WEB_PORT), "--strictPort"],
    { cwd: `${REPO}/apps/web`, stdio: "ignore" },
  );
  return waitHttp(`${WEB}/`);
}

export function stopPreview() {
  killTree(previewProc);
  previewProc = null;
}

// --- API admin ------------------------------------------------------------------------------------------------
let cookie = "";
export async function adminLogin() {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: WEB },
    body: JSON.stringify(ADMIN),
  });
  cookie = res.headers.get("set-cookie").split(";")[0];
}

export async function admin(method, path, body) {
  const res = await fetch(`${API}/api/v1/admin${path}`, {
    method,
    headers: { "content-type": "application/json", origin: WEB, cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

// --- peramban -----------------------------------------------------------------------------------------------------
const browsers = [];

/** Peramban terpisah = perangkat terpisah (IndexedDB dan service worker sendiri). */
export async function newPage(name, viewport = { width: 420, height: 900 }) {
  const browser = await puppeteer.launch({
    browser: "firefox",
    executablePath: FIREFOX,
    headless: true,
  });
  browsers.push(browser);
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.errors = [];
  page.external = [];
  page.on("pageerror", (e) => page.errors.push(`${name}: ${e}`));
  page.on("request", (request) => {
    const url = request.url();
    if (!/^(http:\/\/localhost|data:|blob:|about:|moz-extension:)/.test(url))
      page.external.push(url);
  });
  return page;
}

export async function closeBrowsers() {
  for (const browser of browsers) await browser.close().catch(() => {});
}

export const text = (page) => page.evaluate(() => document.body.innerText);
export const lower = async (page) => (await text(page)).toLowerCase();
export const waitText = (page, needle, timeout = 15000) =>
  page.waitForFunction(
    (t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()),
    { timeout },
    needle,
  );
export const clickButton = (page, label) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll("button, a")].find(
      (b) => b.textContent.trim() === t && !b.disabled,
    );
    if (!el) throw new Error(`Tombol tidak ditemukan: ${t}`);
    el.click();
  }, label);
