// Uji menyeluruh: pairing, check-in, offline, duplikat antar-perangkat, sinkronisasi, dan membuka
// aplikasi tanpa server (service worker). Lihat e2e/README.md.

import { mkdirSync } from "node:fs";
import {
  ADMIN,
  admin,
  adminLogin,
  buildWeb,
  clickButton,
  closeBrowsers,
  createAdminAccount,
  lower,
  newPage,
  OUT,
  prepareDatabase,
  reporter,
  sleep,
  startApi,
  startPreview,
  stopApi,
  stopPreview,
  text,
  truncateDatabase,
  WEB,
  waitText,
} from "./lib.mjs";

mkdirSync(OUT, { recursive: true });
const { problems, check } = reporter();

/** Di HP kolom cari ada di tab "Cari tamu"; buka tabnya dulu bila belum terlihat. */
async function openSearch(page) {
  if (await page.$("#cari-tamu")) return;
  await page.evaluate(() => {
    [...document.querySelectorAll("nav[aria-label=Mode] button")]
      .find((b) => b.textContent.includes("Cari tamu"))
      ?.click();
  });
  await page.waitForSelector("#cari-tamu");
}

async function checkInByCode(page, code) {
  await openSearch(page);
  await page.evaluate(() => {
    const el = document.querySelector("#cari-tamu");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.type("#cari-tamu", code);
  await sleep(400);
  await page.keyboard.press("Enter");
  await page.waitForSelector("[role=alertdialog]", { timeout: 8000 });
}
/** Tamu rombongan: isi jumlah orang di layar prompt (bawaan 2), lalu catat. */
async function submitPax(page, pax) {
  await page.waitForSelector('[aria-label="Jumlah orang rombongan"]');
  await page.evaluate((target) => {
    const root = document.querySelector('[aria-label="Jumlah orang rombongan"]');
    const input = root.querySelector("input");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, String(target));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, pax);
  await page.waitForFunction(
    (label) =>
      [...document.querySelectorAll('[aria-label="Jumlah orang rombongan"] button')].some((b) =>
        b.textContent.includes(label),
      ),
    {},
    `${pax} orang`,
  );
  await page.evaluate((label) => {
    [...document.querySelectorAll('[aria-label="Jumlah orang rombongan"] button')]
      .find((b) => b.textContent.includes(label))
      ?.click();
  }, `Catat masuk · ${pax} orang`);
  await page.waitForFunction(
    () =>
      !document.querySelector('[aria-label="Jumlah orang rombongan"]') &&
      document.querySelector("[role=alertdialog]"),
    { timeout: 8000 },
  );
}

const overlayText = (page) =>
  page.evaluate(() => document.querySelector("[role=alertdialog]")?.innerText ?? "");
async function closeOverlay(page) {
  await page.evaluate(() => {
    const buttons = [
      ...(document.querySelector("[role=alertdialog]")?.querySelectorAll("button") ?? []),
    ];
    buttons.find((b) => ["Lanjut scan", "Tutup"].includes(b.textContent.trim()))?.click();
  });
  await page.waitForFunction(() => !document.querySelector("[role=alertdialog]"), {
    timeout: 8000,
  });
}
async function pairDevice(page, code) {
  await page.goto(`${WEB}/scan`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => location.pathname === "/scan/pasang", { timeout: 10000 });
  await page.type("input", code.replace("-", ""));
  await clickButton(page, "Pasangkan");
  await page.waitForFunction(() => location.pathname === "/scan", { timeout: 30000 });
}
const headerText = (page) => page.evaluate(() => document.querySelector("header")?.innerText ?? "");
const pendingCount = async (page) => {
  const m = /(\d+)\s*antre/i.exec(await headerText(page));
  return m ? Number(m[1]) : 0;
};
const dashboard = async () => (await admin("GET", "/checkins/dashboard")).json;

async function syncFromReadiness(page) {
  await page.goto(`${WEB}/scan/siap`, { waitUntil: "networkidle0" });
  await waitText(page, "Antrean kirim");
  await clickButton(page, "Sinkron sekarang");
  await sleep(3500);
}

async function qrSelfTest(page) {
  await page.waitForFunction(
    () => {
      const li = [...document.querySelectorAll("li")].find((x) =>
        x.innerText.toLowerCase().includes("pembaca qr"),
      );
      return li && !li.innerText.toLowerCase().includes("menguji");
    },
    { timeout: 30000 },
  );
  return page.evaluate(() =>
    [...document.querySelectorAll("li")]
      .find((x) => x.innerText.toLowerCase().includes("pembaca qr"))
      .innerText.replace(/\s+/g, " "),
  );
}

try {
  console.log("== menyiapkan database, build, dan server");
  await prepareDatabase();
  buildWeb();
  check(await startApi(), "API berjalan");
  await truncateDatabase();
  createAdminAccount();
  check(await startPreview(), "web (build produksi) berjalan");
  await adminLogin();

  const event = (
    await admin("POST", "/events", {
      slug: "resepsi",
      name: "Resepsi",
      startsAt: "2027-05-21T03:00:00Z",
      endsAt: "2027-05-21T07:00:00Z",
      checkinEnabled: true,
    })
  ).json.event;
  const group = (
    await admin("POST", "/groups", {
      name: "Surabaya",
      isVip: true,
      gate: "A",
      sessions: [
        { eventId: event.id, startsAt: "2027-05-21T03:00:00Z", endsAt: "2027-05-21T05:00:00Z" },
      ],
    })
  ).json.group;
  let phone = 81200000;
  const mk = async (displayName, extra = {}) =>
    (
      await admin("POST", "/guests", {
        displayName,
        phone: `0${phone++}`,
        eventIds: [event.id],
        ...extra,
      })
    ).json.guest;
  const budi = await mk("Bpk. Budi", {
    isRombongan: true,
    groupId: group.id,
    usherNote: "Pemain inti",
  });
  const sari = await mk("Sari");
  const joko = await mk("Pak Joko", { isRombongan: true });
  const dewi = await mk("Bu Dewi");
  const rina = await mk("Rina");

  console.log("== admin membuat dua perangkat lewat UI");
  const adminPage = await newPage("admin", { width: 1280, height: 900 });
  await adminPage.goto(`${WEB}/admin/masuk`, { waitUntil: "networkidle0" });
  await adminPage.type("input[type=email]", ADMIN.email);
  await adminPage.type("input[type=password]", ADMIN.password);
  await adminPage.keyboard.press("Enter");
  await adminPage.waitForFunction(() => location.pathname === "/admin", { timeout: 15000 });
  await adminPage.goto(`${WEB}/admin/perangkat`, { waitUntil: "networkidle0" });

  const codes = [];
  for (const name of ["HP Gerbang A", "HP Gerbang B"]) {
    await clickButton(adminPage, "Tambah perangkat");
    await adminPage.waitForSelector("[role=dialog] input");
    await adminPage.type("[role=dialog] input", name);
    await clickButton(adminPage, "Buat kode pairing");
    await adminPage.waitForSelector("[data-testid=pairing-code]");
    codes.push(await adminPage.$eval("[data-testid=pairing-code]", (e) => e.textContent.trim()));
    if (name === "HP Gerbang A") await adminPage.screenshot({ path: `${OUT}/1-pairing-code.png` });
    await clickButton(adminPage, "Selesai");
    await adminPage.waitForFunction(() => !document.querySelector("[role=dialog]"));
  }
  check(
    codes.every((c) => /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(c)),
    `kode pairing tampil di admin (${codes.join(", ")})`,
  );

  console.log("== perangkat memasangkan diri");
  const A = await newPage("A");
  const B = await newPage("B");
  await pairDevice(A, codes[0]);
  await pairDevice(B, codes[1]);
  await waitText(A, "5 tamu");
  await waitText(B, "5 tamu");
  check(true, "kedua perangkat terpasang dan mengunduh 5 tamu");
  const aText = await lower(A);
  check(
    aText.includes("hp gerbang a") && aText.includes("resepsi"),
    "header menampilkan nama perangkat dan acara",
  );
  await A.screenshot({ path: `${OUT}/2-scanner-idle.png` });

  console.log("== check-in online");
  await checkInByCode(A, budi.code);
  let ov = (await overlayText(A)).toLowerCase();
  check(
    ov.includes("rombongan") && ov.includes("bpk. budi") && ov.includes("berapa orang"),
    "scan Budi (rombongan): layar menanyakan jumlah orang, belum tercatat",
  );
  check((await pendingCount(A)) === 0, "belum ada yang ditulis sebelum jumlah diisi");
  await submitPax(A, 4);
  ov = (await overlayText(A)).toLowerCase();
  check(ov.includes("masuk") && ov.includes("bpk. budi"), "setelah jumlah diisi: layar MASUK");
  check(ov.includes("vip") && ov.includes("pemain inti"), "VIP dan catatan penjaga tampil");
  check(ov.includes("4"), "jumlah yang dicatat = 4");
  await A.screenshot({ path: `${OUT}/3-result-vip.png` });
  await A.evaluate(() => document.querySelector('[aria-label="Kurangi satu orang"]').click());
  await waitText(A, "3");
  await sleep(700);
  await closeOverlay(A);
  await openSearch(A);
  const cleared = await A.$eval("#cari-tamu", (el) => el.value);
  check(cleared === "", "kolom cari dikosongkan setelah check-in");

  await sleep(7000);
  let dash = await dashboard();
  check(
    dash.totals.arrived === 1 && dash.totals.arrivedPax === 3,
    `dashboard admin: 1 masuk, 3 orang (dapat ${dash.totals.arrived}/${dash.totals.arrivedPax})`,
  );

  await sleep(6000);
  await checkInByCode(B, budi.code);
  ov = (await overlayText(B)).toLowerCase();
  check(
    ov.includes("sudah masuk") && ov.includes("hp gerbang a"),
    "perangkat B melihat 'sudah masuk' lewat HP Gerbang A",
  );
  await B.screenshot({ path: `${OUT}/4-already.png` });
  await closeOverlay(B);

  await checkInByCode(A, "ZZZZZZ");
  ov = (await overlayText(A)).toLowerCase();
  check(
    ov.includes("tidak valid") && ov.includes("kode tidak dikenal"),
    "kode asing: layar TIDAK VALID",
  );
  await closeOverlay(A);

  console.log("== server mati: check-in offline di dua perangkat");
  await stopApi();
  await checkInByCode(A, sari.code);
  await closeOverlay(A);
  await checkInByCode(A, dewi.code);
  await closeOverlay(A);
  await checkInByCode(B, sari.code); // duplikat disengaja: B belum tahu A sudah menerima Sari
  ov = (await overlayText(B)).toLowerCase();
  check(
    ov.includes("masuk") && !ov.includes("sudah masuk"),
    "B menerima Sari karena belum tahu A sudah menerima (duplikat disengaja)",
  );
  await closeOverlay(B);
  await checkInByCode(B, joko.code);
  await submitPax(B, 2);
  await closeOverlay(B);
  await sleep(3000);
  check((await headerText(A)).toLowerCase().includes("offline"), "perangkat A menampilkan OFFLINE");
  const pa = await pendingCount(A);
  const pb = await pendingCount(B);
  check(pa === 2 && pb === 2, `antrean A=2 dan B=2 (dapat ${pa}/${pb})`);
  await A.screenshot({ path: `${OUT}/5-offline.png` });

  console.log("== walk-in saat offline");
  await openSearch(A);
  await clickButton(A, "Tamu baru (tidak di daftar)");
  await A.waitForSelector("[role=dialog] input");
  await A.type("[role=dialog] input", "Tamu Mendadak");
  await clickButton(A, "Catat masuk");
  await A.waitForSelector("[role=alertdialog]");
  ov = (await overlayText(A)).toLowerCase();
  check(
    ov.includes("tamu mendadak") && ov.includes("masuk"),
    "tamu walk-in langsung tercatat masuk offline",
  );
  await closeOverlay(A);

  console.log("== server menyala lagi: sinkronisasi");
  check(await startApi(), "API menyala kembali");
  for (const page of [A, B]) await syncFromReadiness(page);
  for (const page of [A, B]) {
    await page.waitForFunction(
      () => {
        const li = [...document.querySelectorAll("li")].find((x) =>
          x.innerText.toLowerCase().includes("antrean kirim"),
        );
        return li?.innerText.toLowerCase().includes("kosong");
      },
      { timeout: 40000 },
    );
  }
  check(true, "antrean A dan B kosong setelah sinkron");
  const qrOnline = await qrSelfTest(A);
  check(
    /terbaca dalam \d+ ms/i.test(qrOnline),
    `pembaca QR berfungsi di build produksi: ${qrOnline}`,
  );
  await A.screenshot({ path: `${OUT}/6-readiness.png`, fullPage: true });

  dash = await dashboard();
  check(
    dash.totals.arrived === 5,
    `5 masuk tercatat di server (dapat ${dash.totals.arrived}): Budi, Sari, Joko, Dewi, walk-in`,
  );
  check(
    dash.totals.needsReview === 1,
    `Sari terdeteksi duplikat untuk diperiksa (dapat ${dash.totals.needsReview})`,
  );
  check(dash.totals.walkins === 1, "tamu walk-in tercatat di server");
  const review = (await admin("GET", "/checkins/review")).json.items;
  check(
    review.length === 1 &&
      review[0].displayName === "Sari" &&
      review[0].duplicates.length === 1 &&
      !!review[0].primary.deviceName,
    "antrean review: Sari, satu duplikat, dengan nama perangkat",
  );

  console.log("== admin: dashboard, review, dan daftar cetak");
  await adminPage.goto(`${WEB}/admin/checkin`, { waitUntil: "networkidle0" });
  await waitText(adminPage, "Perlu diperiksa");
  await adminPage.screenshot({ path: `${OUT}/7-dashboard.png`, fullPage: true });
  await clickButton(adminPage, "Abaikan duplikat");
  await sleep(1500);
  dash = await dashboard();
  check(
    dash.totals.needsReview === 0,
    "review selesai lewat UI: tidak ada lagi yang perlu diperiksa",
  );

  await adminPage.goto(`${WEB}/admin/tamu/cetak`, { waitUntil: "networkidle0" });
  await waitText(adminPage, "Pak Joko");
  const printText = await adminPage.evaluate(() => document.querySelector("main")?.innerText ?? "");
  check(
    printText.includes(budi.code) &&
      printText.includes("Bpk. Budi") &&
      printText.includes("6 undangan"),
    "daftar cetak memuat tamu, kode, dan jumlahnya",
  );
  await adminPage.screenshot({ path: `${OUT}/8-print-list.png`, fullPage: true });

  console.log("== tamu walk-in dikenali perangkat lain");
  await B.goto(`${WEB}/scan`, { waitUntil: "networkidle0" });
  await sleep(6000);
  await openSearch(B);
  await B.type("#cari-tamu", "mendadak");
  await sleep(600);
  const found = (await text(B)).toLowerCase();
  check(
    found.includes("tamu mendadak") && /[a-hj-np-z2-9]{6}/i.test(found),
    "B menemukan tamu walk-in dengan kodenya setelah sinkron",
  );

  console.log("== aplikasi terbuka tanpa server sama sekali (service worker)");
  await A.goto(`${WEB}/scan`, { waitUntil: "networkidle0" });
  await A.reload({ waitUntil: "networkidle0" });
  const sw = await A.evaluate(async () => ({
    controller: !!navigator.serviceWorker?.controller,
    active: !!(await navigator.serviceWorker?.getRegistration())?.active,
  }));
  check(
    sw.active && sw.controller,
    `service worker aktif dan mengendalikan halaman (${JSON.stringify(sw)})`,
  );
  await stopApi();
  stopPreview();
  await sleep(1500);
  let loadedOffline = false;
  try {
    await A.goto(`${WEB}/scan`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await waitText(A, "Tamu", 10000);
    loadedOffline = true;
  } catch (err) {
    console.log("   catatan:", err.message.slice(0, 120));
  }
  check(loadedOffline, "halaman scanner terbuka dari cache saat server web dan API mati");
  if (loadedOffline) {
    await waitText(A, "6 tamu", 8000).catch(() => {});
    await checkInByCode(A, rina.code);
    ov = (await overlayText(A)).toLowerCase();
    check(
      ov.includes("masuk") && ov.includes("rina"),
      "check-in berjalan offline sepenuhnya (tanpa server mana pun)",
    );
    await A.screenshot({ path: `${OUT}/9-offline-reload.png` });
    await closeOverlay(A);

    // WASM pembaca QR harus tersedia dari cache saat tidak ada server sama sekali
    await A.goto(`${WEB}/scan/siap`, { waitUntil: "domcontentloaded", timeout: 15000 });
    const qrOffline = await qrSelfTest(A);
    check(
      /terbaca dalam \d+ ms/i.test(qrOffline),
      `pembaca QR berfungsi tanpa server (WASM dari cache): ${qrOffline}`,
    );
    await A.screenshot({ path: `${OUT}/9b-readiness-offline.png`, fullPage: true });
  }
  const errors = [...A.errors, ...B.errors];
  check(errors.length === 0, `tidak ada error JavaScript (${errors.slice(0, 2).join(" | ")})`);
  const external = [...A.external, ...B.external];
  check(
    external.length === 0,
    `tidak ada permintaan ke luar localhost (${external.slice(0, 2).join(" | ")})`,
  );

  console.log("== kembali online: check-in offline terkirim, lalu perangkat B dicabut");
  await startApi();
  await startPreview();
  await sleep(1500);
  await syncFromReadiness(A);
  dash = await dashboard();
  check(
    dash.totals.arrived === 6,
    `check-in Rina yang dicatat tanpa server terkirim: total 6 (dapat ${dash.totals.arrived})`,
  );

  const devB = (await admin("GET", "/devices")).json.items.find((d) => d.name === "HP Gerbang B");
  await admin("POST", `/devices/${devB.id}/revoke`, {});
  await B.goto(`${WEB}/scan/siap`, { waitUntil: "networkidle0" });
  await waitText(B, "Perangkat aktif");
  await clickButton(B, "Sinkron sekarang");
  await waitText(B, "dicabut", 20000);
  check(true, "perangkat B tahu dirinya dicabut setelah online");
  await B.screenshot({ path: `${OUT}/10-revoked.png` });
} catch (err) {
  console.log("KEGAGALAN SKRIP:", err.stack?.split("\n").slice(0, 5).join("\n"));
  problems.push(`skrip berhenti: ${err.message}`);
} finally {
  await closeBrowsers();
  await stopApi();
  stopPreview();
}

console.log(
  problems.length === 0
    ? "\nSEMUA LOLOS"
    : `\n${problems.length} MASALAH:\n- ${problems.join("\n- ")}`,
);
process.exit(problems.length === 0 ? 0 : 1);
