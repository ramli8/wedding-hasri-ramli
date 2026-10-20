# Uji menyeluruh peramban

Dua skrip yang menjalankan aplikasi sungguhan di Firefox tanpa tampilan (headless). Keduanya
**tidak** ikut CI; jalankan manual sebelum perubahan besar pada scanner atau sinkronisasi.

| Perintah | Yang diuji |
|---|---|
| `pnpm e2e` | Pairing dua "HP" lewat admin, check-in online, server dimatikan lalu check-in offline di dua perangkat, tamu walk-in, sinkronisasi ulang, duplikat dan review admin, daftar cetak, membuka aplikasi tanpa server web dan API sama sekali (service worker), pembaca QR offline, pencabutan perangkat. Memakai **build produksi** (`vite preview`). |
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
| `E2E_SKIP_BUILD=1` | Lewati build web (memakai `apps/web/dist` yang ada) |
| `E2E_OUT` | Folder tangkapan layar (bawaan `e2e/out`, tidak masuk git) |

Skrip berakhir dengan kode 0 bila semua pemeriksaan lolos, selain itu 1 beserta daftar yang gagal.

## Yang tidak bisa diuji di sini

Kamera sungguhan (peramban headless tidak punya kamera), Chrome Android (mesin QR bawaan, getar,
suara, senter, kunci layar), dan iPhone. Itu harus dicoba di perangkat fisik; halaman **Uji
Kesiapan** di aplikasi membantu memeriksa sebagian besarnya.
