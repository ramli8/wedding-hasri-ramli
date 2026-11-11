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
- Edge Caddy hanya menerima lalu lintas dari Cloudflare dan meneruskan IP asli pengunjung ke API
  sebagai `X-Client-Ip`. Pengaturan Cloudflare dan VPS yang wajib ada di bagian 7.

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

## 7. Pengamanan dari serangan (DDoS, peretas)

Tidak ada server kecil yang bisa menahan DDoS sendirian. Serangan besar ditahan **Cloudflare**; VPS
hanya perlu memastikan tidak ada jalan memutar dan satu sumber tidak bisa menghabiskan sumber daya.

### Lapisan yang sudah ada di kode dan konfigurasi

| Lapisan | Di mana | Menahan |
| --- | --- | --- |
| Hanya Cloudflare yang boleh masuk | `deploy/edge.Caddyfile` (`cloudflare_only`) | Serangan langsung ke IP VPS yang melewati Cloudflare |
| IP asli dari edge (`X-Client-Ip`) | `edge.Caddyfile`, `clientIp` | Pemalsuan IP untuk mengakali pembatas |
| Batas waktu koneksi | `edge.Caddyfile` (`timeouts`), `apps/api/src/index.ts` | Koneksi lambat (slowloris) |
| Batas body 4 MB (unggahan punya batas sendiri) | `apps/api/src/app.ts` | Permintaan raksasa yang menghabiskan RAM |
| 1.200 permintaan/menit per IP untuk rute tanpa login (300 terbukti memblokir tamu yang berbagi IP) | `apps/api/src/app.ts` | Banjir permintaan ke halaman tamu, login, pairing |
| Batas tebakan kode tamu, login, dan pairing | `routes/public.ts`, `routes/share.ts`, `routes/auth.ts`, `routes/device.ts` | Menebak kode tamu, sandi admin, atau kode pairing |
| Argon2 maksimal 4 serentak | `apps/api/src/auth/password.ts` | Banjir login yang menghabiskan RAM |
| Isi undangan di-cache (dibuang saat admin mengubah) dan rute tamu memakai maks. 6 koneksi DB | `services/layout.ts`, `apps/api/src/app.ts` | Lonjakan pengunjung tidak menahan sinkron HP pintu dan admin |
| Batas waktu kueri 30 detik | `apps/api/src/db/client.ts` | Kueri macet yang menahan koneksi database |
| Batas RAM/CPU/proses per container | `deploy/*.compose.yaml` | Satu layanan diserang lalu menjatuhkan seluruh VPS |
| CSP ketat, HSTS, `X-Frame-Options` | `deploy/web.Caddyfile` | XSS dan clickjacking |
| Postgres tidak dibuka ke internet | `deploy/stack.compose.yaml` (tanpa `ports`) | Akses langsung ke database |

### Pengaturan Cloudflare (wajib)

1. Semua record DNS situs **Proxied** (awan oranye). Tanpa ini edge Caddy menolak semua pengunjung,
   karena yang masuk tidak datang dari Cloudflare. Untuk akses langsung sementara, isi
   `EXTRA_ALLOWED_IPS` di `deploy/.env.edge`.
2. SSL/TLS: **Full (strict)**, aktifkan **Always Use HTTPS** dan **Minimum TLS 1.2**.
3. Security → WAF → **Managed rules** (gratis): aktifkan Cloudflare Free Managed Ruleset.
4. Security → WAF → **Rate limiting rules** (paket gratis mendapat 1 aturan). Sarankan:
   - Jika URI Path diawali `/api/v1/auth/` **atau** `/api/v1/public/` **atau** `/api/v1/device/`
   - lebih dari 60 permintaan per 10 detik per IP → Block selama 10 detik.
5. **Jangan** aktifkan *Bot Fight Mode*: ia bisa menantang crawler WhatsApp/Instagram sehingga
   pratinjau tautan `/u/KODE` tidak muncul.
6. Saat diserang: aktifkan **Under Attack Mode**. Mode ini memberi tantangan JavaScript yang tidak bisa
   dijawab HP scanner dan laptop booth (mereka memakai `fetch`, bukan browser biasa). Buat dulu
   Custom rule *Skip* (lewati "Security Level" dan "Super Bot Fight Mode") untuk path yang diawali
   `/api/v1/sync/`, `/api/v1/booth/`, dan `/api/v1/device/`, supaya check-in tetap jalan. Matikan
   lagi setelah serangan reda. Check-in di pintu tetap jalan offline selama server tidak terjangkau.

### Pengaturan VPS (wajib)

- SSH hanya dengan key (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`), lalu
  pasang `fail2ban` untuk SSH.
- `unattended-upgrades` aktif untuk pembaruan keamanan.
- Firewall `ufw`: izinkan hanya 22, 80, 443 (TCP) dan 443 (UDP). Port yang dibuka Docker **melewati
  ufw**; itu sebabnya penyaringan Cloudflare dilakukan di edge Caddy, dan hanya edge yang membuka port.
  Jangan menambah `ports:` di `stack.compose.yaml` (mis. untuk Postgres atau API).
- File `deploy/.env.*` berisi rahasia: `chmod 600`, jangan di-commit.
- Batas RAM container (`mem_limit`) dijumlah untuk prod + staging + edge sekitar 4 GB. Di VPS 2 GB,
  matikan stack staging menjelang hari-H (`docker compose -p wedding-staging ... down`).
- Perbarui daftar IP Cloudflare di `edge.Caddyfile` (dua tempat) bila https://www.cloudflare.com/ips/ berubah.
- Pantau `/api/health` dengan UptimeRobot (bagian 6) agar serangan atau down cepat ketahuan.

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

## Pratinjau tautan (WhatsApp, Instagram)

Crawler WhatsApp dan Instagram tidak menjalankan JavaScript, jadi tag Open Graph harus ada di HTML.
Karena itu `/u/*` diteruskan Caddy ke API (`deploy/web.Caddyfile`), dan API menyajikan `index.html`
aplikasi web yang sudah disisipi judul, deskripsi, dan gambar milik tamu itu. Variabel
`WEB_INDEX_URL` (di `deploy/stack.compose.yaml`: `http://web/index.html`) memberi tahu API dari mana
mengambil `index.html`. Isi judul, deskripsi, dan gambar di admin: Pengaturan → Pratinjau tautan.

Tes setelah deploy: `curl -s https://DOMAIN/u/KODE | grep og:` harus menampilkan tag `og:title`,
`og:description`, dan `og:image`. WhatsApp menyimpan pratinjau per tautan, jadi tautan yang sudah
terlanjur dikirim sebelum pengaturan ini diisi tidak ikut berubah.
