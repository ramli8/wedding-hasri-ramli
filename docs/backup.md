# Cadangan dan pemulihan

Dua hal harus aman: **database** (tamu, check-in, hadiah, vendor, isi undangan) dan **folder foto**
(volume Docker `media`). Keduanya dicadangkan otomatis ke Cloudflare R2 oleh layanan `backup`.

| Apa | Cara | Isi |
|---|---|---|
| Cadangan otomatis | layanan `backup` (profile `backup`) | `pg_dump` (format custom) tiap 6 jam + salinan foto |
| Unduhan manual | Pengaturan → Cadangan & ekspor | JSON semua data, ZIP foto, CSV tamu |

Unduhan manual hanya pelengkap (arsip pribadi). Pemulihan sungguhan memakai dump dari R2.

> Status: pipeline (dump, verifikasi, unggah, salin foto, retensi, pemulihan) sudah diuji lokal
> dengan Docker ke tujuan folder lokal dan pemulihan ke database baru. **Belum diuji ke R2
> sungguhan**; langkah R2 di bawah akan diperbaiki saat akunnya siap.

## 1. Menyiapkan R2 (sekali)

1. Cloudflare dashboard → R2 → buat bucket, mis. `hasri-ramli-backup` (jangan publik).
2. R2 → Manage API tokens → buat token **Object Read & Write** yang dibatasi ke bucket itu saja.
   Simpan Access Key ID, Secret Access Key, dan endpoint
   `https://<account-id>.r2.cloudflarestorage.com`.
3. (Disarankan) Atur aturan siklus hidup bucket agar objek lama otomatis kedaluwarsa, mis. 90 hari.
   Skrip sudah membersihkan dump yang lebih tua dari `BACKUP_RETENTION_DAYS` (bawaan 30 hari),
   tetapi 10 dump terbaru selalu disimpan.

## 2. Mengaktifkan di VPS

Tambahkan ke `deploy/.env.prod` (contoh ada di `deploy/.env.stack.example`):

```
BACKUP_DEST=r2:hasri-ramli-backup/prod
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
# opsional
BACKUP_INTERVAL_HOURS=6
BACKUP_RETENTION_DAYS=30
BACKUP_PING_URL=https://hc-ping.com/<uuid>
```

Lalu jalankan layanannya (staging tidak perlu):

```bash
docker compose -p wedding-prod --env-file deploy/.env.prod -f deploy/stack.compose.yaml \
  --profile backup up -d --build backup
docker compose -p wedding-prod --env-file deploy/.env.prod -f deploy/stack.compose.yaml \
  logs -f backup
```

Putaran pertama berjalan langsung saat layanan menyala. Log yang benar berakhir dengan `selesai`.
Setiap putaran memverifikasi dump (`pg_restore --list`) sebelum mengunggah; dump yang rusak
membuat putaran gagal, bukan tersimpan diam-diam.

Struktur di bucket:

```
prod/db/db-20270101T000000Z.dump     # satu berkas per putaran
prod/media/<id>/large.webp           # foto disalin (tidak pernah dihapus otomatis)
prod/media/<id>/thumb.webp
```

Foto memakai `rclone copy`, bukan `sync`: foto yang dihapus dari server tidak ikut terhapus dari
cadangan (lebih aman; sisa foto lama tidak dipermasalahkan).

## 3. Pemantauan

- `docker compose ps`: layanan `backup` punya healthcheck; statusnya `unhealthy` bila tidak ada
  cadangan berhasil dalam dua kali selang ditambah 30 menit.
- `BACKUP_PING_URL` (mis. healthchecks.io): dipanggil tiap putaran berhasil, dan `/fail` saat
  gagal. Atur layanannya agar mengirim pesan bila ping berhenti datang. Ini satu-satunya cara
  mengetahui cadangan mati tanpa melihat server.

## 4. Memulihkan database

Latih ini **sebelum** hari-H, ke database terpisah (staging), bukan saat darurat.

```bash
# 1. ambil dump (dari mesin mana pun yang punya rclone dan akses R2)
rclone ls r2:hasri-ramli-backup/prod/db            # pilih yang terbaru
rclone copy r2:hasri-ramli-backup/prod/db/db-<stempel>.dump ./

# 2. hentikan API agar tidak menulis selama pemulihan
docker compose -p wedding-prod --env-file deploy/.env.prod -f deploy/stack.compose.yaml stop api

# 3. pulihkan (menimpa isi database)
docker compose -p wedding-prod --env-file deploy/.env.prod -f deploy/stack.compose.yaml \
  run --rm --no-deps -v "$PWD:/d:ro" --entrypoint /usr/local/bin/restore.sh \
  backup /d/db-<stempel>.dump \
  "postgres://wedding:<POSTGRES_PASSWORD>@postgres:5432/wedding"

# 4. nyalakan lagi
docker compose -p wedding-prod --env-file deploy/.env.prod -f deploy/stack.compose.yaml start api
```

Migrasi yang belum ada di dump dijalankan otomatis saat API menyala. Periksa jumlah tamu di
halaman Beranda setelah pulih.

## 5. Memulihkan foto

```bash
docker compose -p wedding-prod --env-file deploy/.env.prod -f deploy/stack.compose.yaml \
  run --rm --no-deps --entrypoint rclone -v wedding-prod_media:/data/media backup \
  copy r2:hasri-ramli-backup/prod/media /data/media
```

(Nama volume mengikuti nama project: `wedding-prod_media`.) Foto yang tidak ada di database
disapu otomatis oleh API setelah satu jam bila tidak dipakai bagian mana pun.

## 6. Yang tidak tercakup

- Akun admin ikut di dump database (kata sandi berupa hash argon2). Berkas `.env.*` dan kredensial
  R2 **tidak** dicadangkan; simpan di pengelola kata sandi.
- Cadangan berada di akun Cloudflare yang sama dengan DNS/CDN. Untuk perlindungan tambahan, unduh
  JSON dan ZIP dari Pengaturan secara berkala ke penyimpanan lain.
