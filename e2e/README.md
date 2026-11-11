# Uji menyeluruh peramban

Dua skrip yang menjalankan aplikasi sungguhan di Firefox tanpa tampilan (headless). Keduanya
**tidak** ikut CI; jalankan manual sebelum perubahan besar pada scanner atau sinkronisasi.

| Perintah | Yang diuji |
|---|---|
| `pnpm e2e` | Pairing dua "HP" lewat admin, check-in online, server dimatikan lalu check-in offline di dua perangkat, tamu walk-in, sinkronisasi ulang, duplikat dan review admin, daftar cetak, membuka aplikasi tanpa server web dan API sama sekali (service worker), pembaca QR offline, pencabutan perangkat. Memakai **build produksi** (`vite preview`). |
| `pnpm e2e:load` | **Uji beban** tanpa peramban. API build produksi dibatasi 2 core CPU (`taskset`, seperti VPS 2 vCPU) dan heap 512 MB. Bawaan: 500 tamu undangan (100 di antaranya berbagi satu IP, seperti Wi-Fi gedung/CGNAT) dan 300 pengunjung iseng yang menebak kode, semuanya datang dalam 10 detik, sambil 4 HP pintu check-in dan sinkron. Memeriksa tidak ada jawaban tak terduga, p95 tiap endpoint ≤ 1 detik, dan semua RSVP, ucapan, check-in tersimpan serta hadiah tidak terpilih melebihi jumlahnya. Database `wedding_load`. |
| `pnpm e2e:qr` | Pembacaan beberapa bentuk QR (kecil, tautan, koreksi rendah) lewat modul detektor, dan memastikan WASM diambil dari aplikasi sendiri, bukan dari CDN. Memakai server pengembangan. |

## Prasyarat

- Postgres pengembangan menyala (`pnpm dev:db`). Skrip membuat dan **mengosongkan** database terpisah
  `wedding_e2e`; data pengembangan tidak tersentuh.
- Firefox terpasang. Bila bukan di `/usr/bin/firefox`: `FIREFOX_PATH=/jalur/firefox`.
- Port 3000 (API), 4173 (web produksi), dan 5198 (web pengembangan, hanya `e2e:qr`) kosong.

## Pengaturan

| Variabel | Fungsi |
|---|---|
| `E2E_DATABASE_URL` | Database uji (bawaan `postgres://wedding:wedding@localhost:5433/wedding_e2e`) |
| `E2E_API_PORT` | Port API uji bila 3000 terpakai (mis. 3100) |
| `E2E_SKIP_BUILD=1` | Lewati build web (memakai `apps/web/dist` yang ada) |
| `E2E_OUT` | Folder tangkapan layar (bawaan `e2e/out`, tidak masuk git) |

Uji beban (`pnpm e2e:load`) memakai variabel `LOAD_GUESTS`, `LOAD_CURIOUS`, `LOAD_SHARED`,
`LOAD_DEVICES`, `LOAD_RAMP_S` (detik kedatangan), `LOAD_CPUS` (core untuk API, bawaan `0,1`), dan
`LOAD_P95_MS`. Agar pembangkit beban tidak berebut CPU dengan API, jalankan di core lain, mis.
`E2E_DATABASE_URL=postgres://wedding:wedding@localhost:5433/wedding_load taskset -c 2-7 node e2e/load.mjs`.

Hasil terukur (11 Nov 2026, laptop 8 core, API 2 core):

| Beban | Hasil |
|---|---|
| 500 tamu + 300 iseng dalam 10 detik | p95 semua endpoint < 60 ms, semua data tersimpan |
| 1.000 tamu + 1.000 iseng dalam 10 detik (±13.500 permintaan) | p95 < 300 ms, sinkron HP pintu p95 < 100 ms |
| 2.000 tamu + 3.000 iseng dalam 5 detik (±33.000 permintaan) | Tidak ada data hilang atau galat, tetapi p95 tamu 4–9 detik: batas satu proses Node (±1.200 permintaan/detik). HP pintu tetap check-in offline dan sinkron menyusul. |

Skrip berakhir dengan kode 0 bila semua pemeriksaan lolos, selain itu 1 beserta daftar yang gagal.

## Yang tidak bisa diuji di sini

Kamera sungguhan (peramban headless tidak punya kamera), Chrome Android (mesin QR bawaan, getar,
suara, senter, kunci layar), dan iPhone. Itu harus dicoba di perangkat fisik; halaman **Uji
Kesiapan** di aplikasi membantu memeriksa sebagian besarnya.
