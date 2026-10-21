# Deploy ke VPS

Satu VPS menjalankan tiga compose project:

| Project | File | Isi |
|---|---|---|
| `wedding-edge` | `deploy/edge.compose.yaml` | Caddy: TLS dan routing berdasarkan domain |
| `wedding-prod` | `deploy/stack.compose.yaml` | postgres + api + web (produksi) |
| `wedding-staging` | `deploy/stack.compose.yaml` | postgres + api + web (staging, database terpisah) |

Edge dan stack berbicara lewat jaringan Docker `edge`. Stack tidak membuka port ke luar.

> Status: konfigurasi stack dan edge sudah diuji secara lokal (build image, migrasi otomatis, login,
> cache aset, validasi Caddyfile). **Belum pernah dijalankan di VPS sungguhan**, jadi langkah di
> bawah akan diperbaiki saat VPS siap.

## 1. Persiapan VPS (sekali)

- Lokasi server: Singapura atau Jakarta. Spek awal: 2 vCPU, 2–4 GB RAM.
- Login SSH hanya dengan key; matikan login password.
- Firewall: buka hanya 22, 80, 443 (TCP) dan 443 (UDP, HTTP/3).
- Pasang Docker Engine + plugin Compose, dan aktifkan pembaruan keamanan otomatis.
- DNS: arahkan `contoh.com` dan `staging.contoh.com` ke IP VPS (lewat Cloudflare, mode proxy
  aktif, SSL/TLS mode **Full (strict)**). Aturan cache Cloudflare: lewati `/api/*`.

## 2. Konfigurasi

```bash
git clone <repo> && cd <repo>
docker network create edge

cp deploy/.env.edge.example    deploy/.env.edge       # PROD_DOMAIN, STAGING_DOMAIN
cp deploy/.env.stack.example   deploy/.env.prod       # STACK_NAME=prod,    PUBLIC_ORIGIN=https://contoh.com
cp deploy/.env.stack.example   deploy/.env.staging    # STACK_NAME=staging, PUBLIC_ORIGIN=https://staging.contoh.com
```

Isi `POSTGRES_PASSWORD` yang berbeda dan acak di `.env.prod` dan `.env.staging`.
`APP_VERSION` diisi hash commit (`git rev-parse --short HEAD`) agar `/api/health` menunjukkan versi.

## 3. Menjalankan

```bash
docker compose -p wedding-edge    --env-file deploy/.env.edge    -f deploy/edge.compose.yaml  up -d
docker compose -p wedding-staging --env-file deploy/.env.staging -f deploy/stack.compose.yaml up -d --build
docker compose -p wedding-prod    --env-file deploy/.env.prod    -f deploy/stack.compose.yaml up -d --build
```

Migrasi database berjalan otomatis saat API start.

## 4. Membuat admin pertama

```bash
docker compose -p wedding-prod --env-file deploy/.env.prod -f deploy/stack.compose.yaml \
  exec api node dist/create-admin.js --email kamu@contoh.com --name "Nama"
```

Kata sandi ditanyakan tanpa tampil di layar (minimal 10 karakter). Ulangi untuk admin kedua.

## 5. Cadangan

Cadangan terjadwal ke R2 (database + folder foto) dan cara memulihkannya ada di
[`docs/backup.md`](backup.md). Aktifkan sebelum data sungguhan masuk.

## 6. Pemeriksaan

- `https://contoh.com/api/health` harus mengembalikan `{"status":"ok", ...}`.
- Pantau URL itu dengan UptimeRobot (notifikasi ke HP).
- Log: `docker compose -p wedding-prod ... logs -f api`.

## Gambar unggahan

Foto yang diunggah admin disimpan di volume Docker `media` (dipasang di `/data/media` pada container
api, variabel `MEDIA_DIR`) dalam folder per gambar: `<id>/large.webp` (resolusi asli, near-lossless,
sehingga cukup besar) dan `<id>/thumb.webp`. Caddy meneruskan `/media/*` ke API, yang memberi
`Cache-Control: immutable`.

- **Volume ini harus ikut backup**, bersama `pg_dump`. Database hanya menyimpan metadatanya;
  kalau volume hilang, baris gambar masih ada tetapi fotonya tidak.
- Aturan cache Cloudflare: `/media/*` boleh di-cache (WebP di-cache secara bawaan); hanya `/api/*` yang dilewati.
- Image API memasang `sharp` (modul native) saat build, seperti argon2; versinya mengikuti `pnpm-lock.yaml`.
- Satu foto resolusi asli bisa beberapa MB. Perhatikan sisa disk VPS bila galeri besar.

## Belum ada (menyusul)

- Backup `pg_dump` terjadwal ke Cloudflare R2 dan uji restore. Dikerjakan begitu VPS dan akun R2 siap.
- Deploy otomatis dari CI (saat ini manual).
