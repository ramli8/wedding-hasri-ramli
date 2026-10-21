# Rancangan Rebuild — Wedding Hasri & Ramli

Status: **draf untuk di-review**. Belum ada kode yang ditulis. Kode lama (`backend/` Go, `frontend/` Next.js) dibuang dan dibuat ulang; yang diambil hanya daftar fitur.

Acara: **21 Mei 2027**. Aplikasi harus siap dipakai **~21 Maret 2027** (2 bulan uji + setup VPS).

---

## 1. Tujuan dan batasan

| Prioritas | Tujuan |
|---|---|
| 1 | **Check-in QR di hari-H harus cepat dan tetap jalan saat internet mati** (3–4 HP Android + laptop). |
| 2 | Admin untuk mengelola tamu, pesan WhatsApp, dan memantau kehadiran. |
| 3 | Undangan web yang ringan dan cepat (desain menyusul; ide game 2D masih rencana). |
| 4 | Pencatatan vendor dan amplop/hadiah. |

Batasan:
- Satu pernikahan. Tanpa `wedding_id`, tanpa multi-tenant.
- 500–1000 tamu. Satu undangan bisa mewakili kelompok (pasangan, 4 orang, satu tim klub), jadi jumlah orang dicatat saat check-in.
- Bahasa Indonesia saja. Semua waktu disimpan UTC, ditampilkan WIB (`Asia/Jakarta`).
- Perangkat check-in: **Android + Chrome** (PWA terpasang). iPhone tidak didukung.
- Admin hanya 2 akun (Anda dan pasangan). Penjaga pintu tidak punya akun, hanya perangkat terdaftar.

## 2. Stack

| Lapisan | Pilihan |
|---|---|
| Bahasa | TypeScript di semua tempat |
| Runtime API | **Node.js LTS** (keputusan: bukan Bun; Hono tidak terikat runtime jadi bisa dipindah nanti) |
| API | Hono + Zod |
| ORM / migrasi | Drizzle ORM + drizzle-kit |
| Database | PostgreSQL |
| Web | Vite + React + TanStack Router + TanStack Query + Tailwind 4 + shadcn/ui (shadcn ditambahkan di fase 2, saat form kompleks pertama dibuat) |
| Offline | Service worker (vite-plugin-pwa / Workbox) + IndexedDB (Dexie) |
| Scan QR | `barcode-detector` (ponyfill zxing-wasm; memakai `BarcodeDetector` native bila ada) |
| Pencarian offline | MiniSearch (fuzzy, in-memory dari Dexie) |
| Auth | Session cookie buatan sendiri (admin), token perangkat (penjaga) |
| Lint/format | Biome |
| Test | Vitest, Playwright (mode offline), k6 (uji beban) |
| Deploy | Docker Compose + Caddy, di belakang proxy Cloudflare |

### Struktur repo

```
/
├── apps/
│   ├── api/            Hono + Drizzle (Node)
│   └── web/            Vite React: admin, scanner, e-ticket, (nanti) undangan
├── packages/
│   └── shared/         skema Zod + tipe (dipakai api dan web)
├── deploy/             compose, Caddyfile, skrip backup
├── docs/
└── pnpm-workspace.yaml
```

Kode lama: beri tag `legacy-v1` di `main` saat ini, lalu kerjakan di branch `rewrite` yang menghapus `backend/` dan `frontend/`. Aset yang masih dipakai (foto, musik) disalin manual ke `apps/web/public` nanti.

## 3. Konsep inti

- **Event** (acara): akad, resepsi, dst. Hanya event dengan `checkin_enabled` yang punya QR dan check-in. Hari ini hanya **resepsi**. Event dengan `has_rsvp` punya RSVP aplikasi (hanya resepsi). Acara lain hanya diinfokan lewat pesan WhatsApp.
- **Tamu** = satu undangan (bukan satu orang). Tidak ada kuota; tamu bisa ditandai **rombongan** (`is_rombongan`), lalu penjaga mengisi jumlah orang yang datang saat check-in. Tamu biasa otomatis 1 orang.
- **Kelompok** (kategori): label + warna + penanda VIP + **jam sesi per event** (mis. Surabaya 10.00–12.00, Lumajang 12.00–13.00). Jam sesi dipakai untuk info di undangan dan dicatat di log; **scanner tidak menampilkan peringatan** dan penjaga melihat tampilan yang sama untuk semua.
- **Kode tamu**: 6 karakter acak dari 32 huruf/angka (tanpa `I`, `O`, `0`, `1`). QR berisi kode mentah itu saja (QR kecil, scan cepat) dan kode bisa diketik manual.
- **Check-in** adalah log *append-only*. Status akhir tamu dihitung dari log, bukan ditimpa. Ini yang membuat sinkronisasi offline aman dan idempoten.

## 4. Skema database (PostgreSQL)

Uang disimpan sebagai `bigint` rupiah. Semua `timestamptz`. Primary key `uuid` (v7 untuk data yang dibuat klien).

```sql
-- Admin & perangkat -------------------------------------------------
CREATE TABLE admins (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,              -- argon2id
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES admins ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,          -- sha256 dari token cookie
  expires_at timestamptz NOT NULL,
  user_agent text, ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE devices (                       -- HP/laptop penjaga
  id uuid PRIMARY KEY,
  name text NOT NULL,                        -- "HP Gerbang A"
  pairing_code_hash text, pairing_expires_at timestamptz,   -- kode sekali pakai
  token_hash text UNIQUE,                    -- diisi setelah pairing
  status text NOT NULL DEFAULT 'pending',    -- pending | active | revoked
  last_seen_at timestamptz,
  last_sync_at timestamptz,
  pending_outbox int NOT NULL DEFAULT 0,     -- dilaporkan perangkat saat sync
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Konfigurasi (satu baris) -----------------------------------------
CREATE TABLE settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  groom_name text NOT NULL, bride_name text NOT NULL,
  public_base_url text NOT NULL,             -- https://domain
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Acara & kelompok ---------------------------------------------------
CREATE TABLE events (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,                        -- "Resepsi"
  starts_at timestamptz, ends_at timestamptz,
  venue_name text, address text, maps_url text, notes text,
  checkin_enabled boolean NOT NULL DEFAULT false,
  has_rsvp boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE guest_groups (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#64748b',
  is_vip boolean NOT NULL DEFAULT false,
  gate text,                                 -- "A", "B" (opsional)
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE group_sessions (                -- jam sesi kelompok per acara
  group_id uuid NOT NULL REFERENCES guest_groups ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  PRIMARY KEY (group_id, event_id)
);

-- Tamu ----------------------------------------------------------------
CREATE SEQUENCE guest_rev_seq;               -- penanda perubahan untuk sync delta

CREATE TABLE guests (
  id uuid PRIMARY KEY,                       -- boleh dibuat klien (walk-in)
  code char(6) UNIQUE,                       -- diberikan server; walk-in dapat saat sync
  display_name text NOT NULL,                -- "Bpk. Budi & Keluarga"
  full_name text,
  phone text,                                -- E.164 tanpa '+': 62812...
  instagram text,                            -- tanpa '@'
  group_id uuid REFERENCES guest_groups,
  quota int NOT NULL DEFAULT 1 CHECK (quota >= 1),
  note text,                                 -- catatan internal
  usher_note text,                           -- tampil di layar penjaga
  source text NOT NULL DEFAULT 'admin',      -- admin | import | walkin
  rev bigint NOT NULL DEFAULT nextval('guest_rev_seq'),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source = 'walkin' OR phone IS NOT NULL OR instagram IS NOT NULL)
);
CREATE INDEX guests_rev_idx ON guests (rev);
CREATE INDEX guests_group_idx ON guests (group_id) WHERE deleted_at IS NULL;

CREATE TABLE guest_events (                  -- siapa diundang ke acara apa
  guest_id uuid NOT NULL REFERENCES guests ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events ON DELETE CASCADE,
  sent_at timestamptz,                       -- pesan sudah dikirim
  sent_via text,                             -- whatsapp | instagram | other
  PRIMARY KEY (guest_id, event_id)
);

CREATE TABLE message_templates (
  event_id uuid PRIMARY KEY REFERENCES events ON DELETE CASCADE,
  body text NOT NULL                         -- variabel: {panggilan} {link} {acara} {tanggal} {jam_sesi}
);

-- RSVP & ucapan (fase 4) -------------------------------------------
CREATE TYPE rsvp_status AS ENUM ('hadir','tidak_hadir','ragu');
CREATE TABLE rsvps (
  guest_id uuid NOT NULL REFERENCES guests ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events ON DELETE CASCADE,
  status rsvp_status NOT NULL,
  pax int NOT NULL DEFAULT 1 CHECK (pax >= 0),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guest_id, event_id)
);

CREATE TABLE guestbook (
  id uuid PRIMARY KEY,
  guest_id uuid REFERENCES guests ON DELETE SET NULL,
  name text NOT NULL, message text NOT NULL,
  reply text, replied_at timestamptz,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Check-in (append-only) ---------------------------------------------
CREATE TABLE checkin_events (
  id uuid PRIMARY KEY,                       -- dibuat KLIEN (uuid v7) => sync idempoten
  kind text NOT NULL,                        -- checkin | undo | set_pax
  guest_id uuid NOT NULL REFERENCES guests,
  event_id uuid NOT NULL REFERENCES events,
  target_id uuid REFERENCES checkin_events,  -- untuk undo / set_pax
  pax int,                                   -- untuk checkin / set_pax
  method text,                               -- qr | code | search | walkin | admin
  device_id uuid REFERENCES devices,         -- null bila oleh admin
  admin_id uuid REFERENCES admins,
  scanned_at timestamptz NOT NULL,           -- waktu terkoreksi (lihat §6.4)
  device_time timestamptz,                   -- jam mentah perangkat (audit)
  received_at timestamptz NOT NULL DEFAULT now(),
  outside_session boolean NOT NULL DEFAULT false,   -- hanya untuk log
  CHECK (kind <> 'checkin' OR pax >= 0)
);
CREATE INDEX checkin_guest_idx ON checkin_events (guest_id, event_id, scanned_at);

CREATE TABLE checkin_reviews (               -- keputusan admin atas duplikat
  guest_id uuid NOT NULL REFERENCES guests,
  event_id uuid NOT NULL REFERENCES events,
  resolved_by uuid NOT NULL REFERENCES admins,
  resolution text NOT NULL,                  -- keep_first | merge_pax | ignore
  note text,
  resolved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guest_id, event_id)
);

-- Vendor (fase 6) ------------------------------------------------------
CREATE TABLE vendor_categories (
  id uuid PRIMARY KEY, name text NOT NULL UNIQUE, sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE vendors (
  id uuid PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES vendor_categories,
  name text NOT NULL, contact_person text, phone text, instagram text, address text,
  reference_price bigint, contract_amount bigint,
  is_selected boolean NOT NULL DEFAULT false,
  note text, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_selected_vendor_per_category
  ON vendors (category_id) WHERE is_selected AND deleted_at IS NULL;
CREATE TABLE vendor_payments (
  id uuid PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES vendors ON DELETE CASCADE,
  paid_on date NOT NULL, amount bigint NOT NULL CHECK (amount > 0), note text
);
-- status bayar (unpaid/partial/paid) dihitung dari SUM(payments) vs contract_amount

-- Amplop & hadiah (fase 6) -------------------------------------------
CREATE TABLE gifts (
  id uuid PRIMARY KEY,
  guest_id uuid REFERENCES guests ON DELETE SET NULL,
  giver_name text NOT NULL,                  -- terisi dari tamu, atau diketik bila bukan tamu
  kind text NOT NULL,                        -- amplop | transfer | barang
  amount bigint, item_description text, note text,
  received_at date,
  thanked_at timestamptz,
  recorded_by uuid NOT NULL REFERENCES admins,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Tabel konten undangan (`couples`, `story_items`, `gallery_items`, `faqs`, `bank_accounts`, `ewallets`, `sections`, `media`, `wishlist_*`) dirinci di awal fase 5 setelah desain undangan dipilih. Aturan yang sudah pasti: tabel biasa (bukan satu JSONB besar), `sort_order` untuk urutan, tanpa `wedding_id`.

### Status check-in (view)

Per `(guest_id, event_id)`:
1. Ambil semua `checkin_events` `kind='checkin'` yang **tidak** punya `undo` yang menunjuknya.
2. **Primary** = yang `scanned_at` paling awal (seri → `id` terkecil). `pax` efektif = `pax` primary, atau `set_pax` terakhir untuk primary itu.
3. Sisanya adalah **duplikat**. Duplikat tetap tersimpan lengkap (perangkat, jam, pax) dan muncul di antrean "perlu diperiksa" sampai ada `checkin_reviews`.

Total orang hadir = Σ `pax` efektif primary. Kartu souvenir terbagi = angka yang sama (hanya total, tidak dicatat per tamu).

## 5. API

Semua di bawah `/api/v1`. JSON. Validasi Zod dari `packages/shared`. Error seragam `{ error: { code, message } }`.

**Publik** (rate limit per IP):
- `GET /public/ticket/:code` → nama panggilan, kelompok, acara + jam sesi. Tidak mengembalikan HP/IG. (E-ticket tetap bisa menggambar QR tanpa endpoint ini.)
- *(fase 4)* `POST /public/rsvp`, `GET/POST /public/guestbook`.

**Admin** (cookie session; semua `POST/PUT/DELETE` cek header `Origin`). Dalam implementasi semua rute ini berada di bawah awalan `/admin`, mis. `/api/v1/admin/guests`, dan pembaruan memakai `PUT` (bukan `PATCH`). Daftar di bawah menulis jalur tanpa awalan itu:
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`
- `GET/POST /guests`, `GET/PATCH/DELETE /guests/:id`, `POST /guests/:id/restore`
- `POST /guests/import/preview`, `POST /guests/import/commit`, `GET /guests/export.csv`, `GET /guests/template.csv`
- `POST /guests/:id/mark-sent` `{ event_id, via }`
- `GET/POST/PATCH/DELETE /groups` (+ jam sesi), `/events`, `/templates/:event_id`
- `GET/POST /devices` (buat kode pairing), `POST /devices/:id/revoke`
- `GET /checkins` (log, filter), `GET /checkins/review` (antrean duplikat), `POST /checkins/resolve`, `POST /checkins/:id/undo`, `POST /checkins/manual`
- `GET /dashboard/checkin`
- *(fase 6)* `/vendors`, `/gifts`

**Perangkat** (`Authorization: Bearer <device token>`, hanya jalur ini yang bisa diakses):
- `POST /device/pair` `{ code, name }` → `{ token }` (kode sekali pakai, kedaluwarsa 24 jam)
- `GET /sync/snapshot?since_rev=N` → `{ server_time, rev, event, groups, sessions, guests[], deleted_guest_ids[], checkins[] }`. `since_rev=0` = unduh penuh (±1000 tamu ≈ puluhan KB gzip).
- `POST /sync/push` `{ device_time, pending_outbox, guests?[], events[] }` → hasil per event `{ id, status: accepted|duplicate|invalid|noop }`.

Penjaga tidak mendapat nomor HP/Instagram tamu di snapshot (tidak dibutuhkan di pintu).

## 6. Check-in offline-first

### 6.1 Alur di perangkat

```
kamera → decode → cari kode di Dexie (O(1))
   ├─ tidak ada            → MERAH  "Kode tidak dikenal"
   ├─ sudah ada check-in   → KUNING "Sudah masuk 11.42 · Gerbang A"
   └─ belum                → HIJAU  (tamu biasa: 1 orang; rombongan: penjaga mengisi jumlah dulu; VIP = tampilan khusus)
                              └─ tulis ke outbox (uuid v7) → UI siap scan berikutnya
```

Hasil muncul dalam <100 ms karena hanya baca IndexedDB. Jaringan tidak ada di jalur ini. Setelah hasil, layar otomatis kembali ke kamera; kode yang sama diabaikan 3 detik (anti scan ganda). Getar + suara singkat. Layar menampilkan nama, kelompok, kuota, `usher_note`; **tanpa** peringatan waktu sesi.

### 6.2 Penyimpanan lokal (Dexie)

| Store | Isi |
|---|---|
| `guests` | snapshot tamu, indeks by `code` |
| `groups`, `sessions`, `event` | referensi |
| `checkins` | check-in yang sudah dikenal server (dari snapshot) |
| `outbox` | event milik perangkat ini yang belum terkonfirmasi server |
| `meta` | `rev`, `server_offset_ms`, versi aplikasi, `last_sync_at` |

"Sudah masuk?" = ada di `checkins` **atau** `outbox`. Pencarian nama memakai MiniSearch yang dibangun dari `guests`.

### 6.3 Sinkronisasi

- Loop di latar depan (layar scanner selalu menyala): tiap ~5 detik bila online → `push` outbox, lalu `snapshot?since_rev`. Backoff eksponensial saat gagal. Background Sync dipakai sebagai tambahan saja, bukan andalan.
- Server memproses setiap event dengan `INSERT ... ON CONFLICT (id) DO NOTHING`, jadi kirim ulang aman.
- Event hanya dihapus dari outbox setelah server mengonfirmasi `id`-nya.
- Tamu **walk-in** dibuat di perangkat dengan `id` uuid dan tanpa kode; server memberi `code` saat `push`, dan perangkat mendapatkannya di `snapshot` berikutnya.
- Snapshot memuat `checkins` dari perangkat lain, jadi perangkat B tahu bahwa tamu sudah masuk lewat perangkat A begitu keduanya tersinkron.

### 6.4 Konflik dan jam perangkat

- **Duplikat**: dua perangkat offline menerima tamu yang sama. Saat tersinkron, primary = `scanned_at` paling awal; sisanya masuk antrean review admin. Hasil akhir **tidak bergantung urutan kedatangan** (properti ini diuji, lihat §9).
- **Jam HP bisa salah.** Setiap kali sync berhasil, klien menyimpan `server_offset_ms = server_time − jam_lokal`. `scanned_at` ditulis sebagai `jam_lokal + offset_terakhir`; jam mentah disimpan di `device_time` untuk audit.
- **Undo / koreksi jumlah**: penjaga hanya boleh untuk check-in terakhir miliknya dalam 2 menit (dicek klien **dan** server, berdasarkan `scanned_at`). Selebihnya hanya admin.
- Kelompok tidak punya atribut gerbang (dihapus di migrasi 0003; lihat §14). Duplikat antar gerbang ditangani antrean review, bukan pembagian tamu.

### 6.5 Ketahanan PWA

- Service worker mem-precache seluruh aplikasi; aplikasi terbuka tanpa internet.
- `navigator.storage.persist()` diminta saat pairing. Aplikasi dipasang ke layar utama.
- **Pembaruan aplikasi hanya manual** (`registerType: 'prompt'`): tidak pernah ganti versi otomatis saat acara. Versi tampil di footer.
- Layar **Uji Kesiapan Perangkat**: daftar tamu ter-cache (jumlah + rev), kamera berfungsi, penyimpanan persisten aktif, jam sinkron, outbox kosong, versi sama dengan server. Dijalankan di H-1.
- Wake Lock API menjaga layar tetap menyala di halaman scanner.
- **Cadangan kertas**: admin bisa ekspor daftar tamu (urut nama, kolom centang) untuk dicetak sebagai jaring pengaman terakhir.

### 6.6 Laptop

Aplikasi yang sama (PWA). Dua tampilan: **Pusat Kontrol** (dashboard, antrean duplikat, daftar perangkat) dan **Meja Bantuan** (cari nama dengan keyboard, tambah walk-in). Scanner USB yang bekerja seperti keyboard didukung lewat kolom input kode yang selalu fokus.

### 6.7 Versi kontrak sinkronisasi

Skema database, bentuk data API, dan format penyimpanan IndexedDB di HP bisa berubah selama pengembangan. Agar HP penjaga yang masih menjalankan aplikasi lama tidak gagal diam-diam:

- `packages/shared` memuat konstanta `SYNC_PROTOCOL_VERSION` (bilangan bulat). Perangkat mengirimnya di header `X-Sync-Version` pada setiap request `/device/*` dan `/sync/*`. Server mengumumkan `min_supported` di respons snapshot.
- Versi di bawah `min_supported` ditolak dengan `426 { code: "APP_OUTDATED", min_version }`. Perangkat menampilkan banner "Perbarui aplikasi" di luar layar scanner.
- **Versi lama tidak boleh kehilangan data.** Meski sinkronisasi ditolak, perangkat tetap bisa scan offline dan `outbox` tidak dihapus. Setelah aplikasi diperbarui, `outbox` dikirim seperti biasa.
- Perubahan kontrak sebisa mungkin **aditif** (field baru yang boleh diabaikan klien lama) dan tidak menaikkan versi. Versi dinaikkan hanya untuk perubahan yang merusak. Server menerima versi sekarang dan satu versi sebelumnya selama masa transisi.
- Perubahan struktur Dexie memakai `version(n).upgrade()` yang memindahkan `outbox` apa adanya. Ini wajib punya tes.
- Halaman Perangkat di admin menampilkan versi aplikasi dan versi protokol tiap perangkat, dan Uji Kesiapan Perangkat menandai perangkat yang tertinggal.
- Skema Zod di `packages/shared` dipakai server dan klien sekaligus. Ada tes kontrak yang gagal bila bentuk payload `push`/`snapshot` berubah tanpa menaikkan versi yang sesuai.

## 7. Dashboard hari-H

`GET /dashboard/checkin`, disegarkan tiap 5 detik di laptop:
- Undangan masuk / total, **total orang hadir** (kebutuhan katering), kartu souvenir terbagi.
- Rincian per kelompok dan per gerbang; hadir vs RSVP hadir.
- 20 check-in terbaru; jumlah duplikat yang menunggu review.
- Per perangkat: nama, terakhir sync, `pending_outbox`. Perangkat dengan outbox menumpuk atau lama tidak sync diberi tanda.

## 8. Pesan WhatsApp / Instagram

- Tombol per tamu per acara membuka `https://wa.me/<hp>?text=<pesan>` dengan template event itu. Setelah dibuka, tamu bisa ditandai terkirim (`guest_events.sent_at`).
- Tamu tanpa HP: tombol **Salin pesan** + **Buka DM Instagram**. Instagram tidak bisa dikirim otomatis.
- Link personal: `https://domain/u/KODE`. Di fase awal halaman ini adalah e-ticket (QR + nama + acara + jam sesi + tombol unduh PNG); setelah fase 5 menjadi undangan lengkap.
- E-ticket digambar di browser dari `KODE` pada URL sehingga tetap ringan dan terbuka di sinyal lemah.
- Filter admin: belum dikirim / sudah dikirim / hanya Instagram / per kelompok.

## 9. Auth dan keamanan

- Admin: email + password (argon2id), cookie `HttpOnly; Secure; SameSite=Lax`, token acak 32 byte (yang disimpan hanya hash), sesi 30 hari bergeser. Rate limit login. Tanpa register publik; dua admin di-seed dari CLI.
- Perangkat: admin membuat kode pairing sekali pakai → perangkat menukar dengan token panjang yang hanya diterima `/device/*` dan `/sync/*`. Bisa dicabut dari admin (cek di tiap request, jadi HP hilang langsung ditolak).
- Kode tamu 6 karakter dari 32 simbol (≈10⁹ kombinasi); `/public/ticket/:code` dibatasi rate limit. Isi publik sengaja minim (tanpa HP/IG).
- Link/QR yang diteruskan tamu ke orang lain tidak dicegah; konsekuensinya hanya duplikat yang ditandai.
- Data pribadi (HP, IG) tidak masuk snapshot perangkat penjaga.
- VPS: SSH key saja, ufw buka 80/443/ssh, update keamanan otomatis, `.env` tidak masuk git.

## 10. Deploy dan operasional

```
Cloudflare (proxy, cache aset statis, bypass /api/*)
   └─ VPS (Singapura/Jakarta)
        ├─ edge (Caddy)        TLS + routing per domain, satu-satunya yang membuka port 80/443
        ├─ stack prod          web (Caddy: file statis + /api → api), api (Node 24), postgres
        ├─ stack staging       sama seperti prod, database terpisah
        └─ backup              cron: pg_dump | gzip → rclone → Cloudflare R2 (belum dibuat)
```

Detail dan perintahnya ada di [deploy.md](deploy.md).

- Dua stack terpisah di VPS yang sama: **produksi** dan **staging** (`staging.domain`), masing-masing database sendiri.
- Migrasi Drizzle dijalankan saat api start. `GET /api/health` dipantau UptimeRobot (notifikasi ke HP).
- Backup harian; tiap jam pada H-1 sampai H+1. **Uji restore** minimal sekali sebelum Maret dan sekali lagi di H-7.
- Log: pino ke stdout, rotasi log Docker.
- CI (GitHub Actions): typecheck, lint, test, build. Deploy awal manual lewat skrip `deploy/deploy.sh`.
- Spek awal: 2 vCPU, 2–4 GB RAM.
- Domain: **belum dipilih**; dibeli lebih dulu supaya staging/produksi bisa disiapkan.

## 11. Pengujian

| Jenis | Isi |
|---|---|
| Unit | Logika sync dan status check-in sebagai modul murni (tanpa DB/jaringan). |
| **Property test** | Untuk urutan kedatangan event acak, status akhir `(primary, duplikat, pax)` selalu sama (konvergen). Kirim ulang event tidak mengubah hasil. |
| Integrasi | API + Postgres sungguhan (Testcontainers). |
| E2E offline | Playwright dengan `context.setOffline(true)`: buka aplikasi, scan, matikan/nyalakan jaringan, pastikan outbox terkirim. |
| Beban | k6: 4 perangkat sync + ratusan pembuka e-ticket bersamaan. |
| Simulasi | Latihan penuh 500 tamu dengan internet dimatikan (Januari–Maret) + latihan restore backup. |

## 12. Fase dan target (perkiraan)

| Fase | Isi | Target perkiraan |
|---|---|---|
| 1 | Fondasi: repo, CI, Postgres + migrasi, auth admin, deploy VPS + staging, domain | pertengahan Nov 2026 |
| 2 | Tamu: CRUD, kelompok + sesi, acara, impor/ekspor CSV, template pesan, tombol WhatsApp/Instagram | awal Des 2026 |
| 3 | **Scanner + check-in offline**, perangkat + pairing, dashboard, duplikat, Uji Kesiapan | akhir Des 2026 |
| 4 | E-ticket, RSVP (resepsi) | Jan 2027 |
| 5 | Editor konten + desain undangan, termasuk buku ucapan | Jan–Feb 2027 |
| 6 | Vendor, amplop/hadiah | Feb–Mar 2027 |
| — | **Uji nyata fase 3** (simulasi, internet mati, restore) paralel dengan fase 4–6 | Jan–Mar 2027 |

Tanggal di atas adalah perkiraan awal dan akan disesuaikan dengan kecepatan kerja nyata.

### Pembekuan skema (H-30)

Mulai **21 April 2027** (H-30) bagian check-in dan sinkronisasi dibekukan:

- Yang dibekukan: tabel `checkin_events`, `checkin_reviews`, kolom `guests` yang ikut dalam snapshot, endpoint `/device/*` dan `/sync/*`, serta aplikasi scanner.
- Setelah itu hanya **perbaikan bug**, tidak ada fitur baru dan tidak ada perubahan kontrak. Semua perbaikan melewati staging dan uji E2E offline sebelum naik produksi.
- Versi aplikasi scanner terakhir dipasang di semua perangkat paling lambat **7 Mei 2027** (H-14), lalu dijalankan Uji Kesiapan Perangkat.
- Modul lain (vendor, amplop, konten undangan) tetap boleh berubah setelah pembekuan, selama migrasinya aditif, tidak menyentuh tabel yang dibekukan, dan sudah dicoba di staging dengan salinan data produksi serta backup yang baru.
- Sebelum pembekuan, perubahan skema bebas selama lewat migrasi. Kalau masih data uji, riwayat migrasi boleh dirapikan ulang.

## 13. Risiko yang diketahui

| Risiko | Mitigasi |
|---|---|
| Jam HP salah | Offset terhadap jam server; jam mentah disimpan (§6.4). |
| Chrome menghapus data lokal / tab dimatikan | `storage.persist()`, PWA terpasang, Wake Lock, Uji Kesiapan di H-1. |
| Pembaruan aplikasi saat acara | Pembaruan hanya manual; versi ditampilkan. |
| Kamera sulit membaca di tempat gelap | Kode pendek = QR kecil dan sederhana; input kode manual + cari nama; uji di venue. |
| Duplikat antar gerbang | Dibagi per gerbang; antrean review admin. |
| VPS mati | Uptime monitor, backup per jam di H-1..H+1, scanner tidak bergantung server saat acara. |
| Cadangan terakhir | Daftar tamu cetak. |
| Aplikasi di HP tertinggal dari server setelah perubahan kontrak | Versi protokol + `426 APP_OUTDATED`, `outbox` tidak pernah dihapus, pembekuan H-30, versi final terpasang H-14 (§6.7, §12). |

## 14. Catatan implementasi fase 1

Selisih antara rancangan di atas dan yang benar-benar dibangun di fase 1:

- **Skema:** baru `admins`, `admin_sessions`, `settings`. Tabel lain dibuat di fasenya masing-masing lewat migrasi Drizzle.
- **Belum dipasang:** shadcn/ui (fase 2), service worker/PWA dan Dexie (fase 3), backup otomatis (menunggu VPS dan R2).
- **Versi yang terpasang** (ditentukan installer saat itu): Node 24, pnpm 12, TypeScript 7, Vite 8, Vitest 5, Hono 4, Drizzle 0.45, Postgres 17.
- **Auth admin:** cookie `session` (di production `__Host-session`, `Secure`), pembatas login di memori (5 gagal per email dan 20 per IP dalam 15 menit), pemeriksaan header `Origin` untuk request yang mengubah data.
- **Path admin di web:** `/admin` (beranda) dan `/admin/masuk` (login). `/` mengarah ke `/admin`.
- **Alat:** Biome (lint + format), CI GitHub Actions (belum pernah dijalankan di GitHub).

### Fase 2 (tamu, kelompok, acara, impor)

- **Tabel baru:** `events`, `message_templates`, `guest_groups`, `group_sessions`, `guests`, `guest_events`, urutan `guest_rev_seq`. Yang belum dibuat sampai fasenya: `devices`, `checkin_events`, `rsvps`, `guestbook`, vendor, dan amplop.
- **`guests.code`** bertipe `text` dengan constraint `length = 6` (bukan `char(6)`), agar tidak ada padding spasi. Boleh `NULL` untuk tamu walk-in sampai disinkronkan.
- **`guests.rev`** dinaikkan lewat `nextval` setiap tamu diubah, dihapus, atau dipulihkan (dilakukan di kode, bukan trigger).
- **Impor CSV:** kolom `nama_undangan` wajib; `hp` atau `instagram` salah satu harus ada; `acara` berisi slug dipisah `;` dan kosong berarti semua acara; kelompok yang belum ada dibuat otomatis. Duplikat dideteksi dari HP atau Instagram yang sama (terhadap tamu aktif dan antarbaris di berkas). Pemisah koma atau titik koma dikenali otomatis. Ekspor menambahkan kolom `kode` dan `link`, dan sel yang diawali `= + - @` diberi awalan `'` agar tidak dibaca sebagai rumus.
- **Template pesan:** variabel `{panggilan} {link} {acara} {tanggal} {jam_sesi}`. Baris yang hanya berisi variabel kosong dibuang (mis. "Waktu: " bila acara belum punya jam). Template kosong berarti memakai template bawaan.
- **Tautan pesan:** `https://wa.me/<hp>?text=…` untuk WhatsApp. Untuk Instagram dipakai `https://ig.me/m/<username>` (membuka DM) dan teks disalin ke clipboard. Format `ig.me` belum pernah saya uji pada akun sungguhan.
- **UI:** tanpa shadcn/ui. Komponen dasar ditulis sendiri sesuai `design.md` dan modal memakai elemen `<dialog>` bawaan browser. Alasannya: lebih ringan dan tidak ada komponen yang tidak dipakai.
- **Zona waktu admin:** input jam di formulir dianggap WIB (UTC+7) dan disimpan sebagai UTC.
- **Kelompok disederhanakan** (migrasi 0003): kolom `gate` dan `sort_order` dihapus karena tidak dipakai scanner; daftar kelompok diurutkan menurut nama. Jam sesi di formulir hanya jam (`<input type="time">`); tanggalnya diambil dari `events.starts_at` saat disimpan, jadi acara tanpa tanggal mulai belum bisa diberi jam sesi.
- **Kuota diganti rombongan** (migrasi 0005–0006): kolom `quota`, `full_name`, `note` dihapus dari `guests`, ditambah `is_rombongan`. Tamu lama dengan kuota > 1 otomatis menjadi rombongan. Snapshot/push berubah bentuk, jadi `SYNC_PROTOCOL_VERSION` dan `MIN_SUPPORTED` naik ke 2: perangkat dengan aplikasi lama menerima `426 APP_OUTDATED` dan harus memperbarui (antrean outbox-nya tidak hilang). Dexie tidak berubah (kolom yang dihapus tidak diindeks). Kolom CSV: `nama_lengkap`, `kuota`, `catatan` dihapus; `rombongan` (ya/tidak) ditambah. Dashboard tidak lagi menampilkan "orang / kuota".
- **Acara disederhanakan** (migrasi 0004): kolom `notes` dan `sort_order` dihapus. Acara diurutkan menurut `starts_at`, lalu nama; acara check-in aktif yang dipakai scanner adalah yang paling awal mulainya.

### Fase 3 (scanner, check-in offline, dashboard)

**Tabel baru:** `devices`, `checkin_events` (log yang hanya bertambah, id dibuat perangkat), `checkin_reviews`. Migrasi 0002.

**Alur penjaga** (keputusan baru, belum ada di rancangan awal):
- Scan **langsung mencatat** check-in 1 orang untuk tamu biasa. Untuk tamu rombongan, layar meminta jumlah orang dulu dan check-in baru dicatat setelah diisi. Penjaga mengubah jumlah atau membatalkan dalam 2 menit, dari layar hasil atau panel "Terakhir masuk". Setelah itu hanya admin.
- Hasil layar penuh: hijau (masuk), amber (sudah masuk, dengan jam dan perangkat), merah (tidak valid), acid dengan bingkai tebal untuk VIP. Menutup sendiri setelah 2,5 sampai 3,5 detik. Getar dan nada berbeda per hasil, bisa dimatikan.
- Laptop adalah perangkat terdaftar biasa (UI yang sama). Kolom cari difokuskan otomatis di perangkat dengan keyboard sehingga scanner USB (yang mengetik seperti keyboard) langsung bekerja.
- Pairing: admin membuat perangkat dan mendapat kode 8 karakter (berlaku 24 jam, sekali pakai, hanya tampil sekali). Token perangkat disimpan di IndexedDB, bukan cookie. Perangkat yang dicabut baru tahu setelah online.

**Protokol** (`SYNC_PROTOCOL_VERSION = 2`, `MIN_SUPPORTED = 2`; naik dari 1 saat kuota diganti rombongan, lihat di bawah): header `x-sync-version` wajib; versi terlalu lama dijawab `426 APP_OUTDATED`; perangkat dicabut dijawab `401 DEVICE_REVOKED`. Rute: `POST /device/pair`, `GET /sync/snapshot?sinceRev&sinceSeq`, `POST /sync/push`; admin: `/admin/devices`, `/admin/checkins/{dashboard,review,resolve,log,:id/undo,:id/pax}`. Snapshot tidak memuat HP atau Instagram.

**Hal yang ditemukan lewat pengujian dan dikoreksi dari rancangan awal** (semuanya punya tes):
1. **`seq` bisa tidak berurutan dengan urutan commit** bila beberapa HP menulis bersamaan, sehingga perangkat yang menarik `seq > terakhir` bisa melewatkan event selamanya. Semua penulisan log check-in sekarang diserialkan dengan advisory lock. Tes konkurensi terbukti gagal bila kunci dimatikan.
2. **Perangkat "lupa" check-in miliknya sendiri** bila `push` berhasil tetapi `pull` gagal: scan ulang tamu yang sama jadi duplikat. Event terkirim sekarang tetap di outbox (`sentAt`) sampai terlihat di data server.
3. **Dua event di milidetik yang sama** (mis. check-in lalu undo) bisa tertukar urutannya di outbox karena id acak, dan server menolak undo yang tiba sebelum targetnya. `createdAt` sekarang naik ketat.
4. **Pembaca QR gagal diam-diam** di peramban tanpa `BarcodeDetector` bawaan. Ponyfill `barcode-detector` gagal ("Failed to allocate ... bytes in WASM memory") di build produksi kita, padahal `zxing-wasm` dipakai langsung berfungsi. Ponyfill dibuang; `readBarcodes` dipanggil langsung. Mesin bawaan sekarang diuji dengan satu panggilan nyata dulu (ada tidak berarti berfungsi). Halaman **Uji Kesiapan** punya butir "Pembaca QR" yang membaca QR contoh tertanam, jadi masalah semacam ini ketahuan di H-1 pada tiap perangkat.

**Tambahan:** halaman Perangkat, dashboard Check-in (disegarkan tiap 5 detik, antrean duplikat dengan "abaikan" atau "gabungkan jumlah", koreksi admin tanpa batas waktu, riwayat lengkap), daftar tamu cetak (`/admin/tamu/cetak`) sebagai cadangan kertas, PWA (service worker, manifest, ikon, pembaruan hanya dengan konfirmasi penjaga).

**Pengujian:** 142 tes API (termasuk properti konvergensi pemecah status: 200 log acak × 25 urutan, idempotensi, konkurensi), 37 tes logika perangkat (IndexedDB tiruan), dan `pnpm e2e` (lihat `e2e/README.md`) yang menjalankan dua "HP" di Firefox headless, mematikan server, dan membuka aplikasi tanpa server sama sekali.

**Belum teruji** (butuh perangkat fisik): kamera sungguhan dan pembacaan QR dari layar HP tamu, Chrome Android (mesin QR bawaan, getar, suara, senter, kunci layar), iPhone, dua HP fisik di venue, beban 1000 tamu dengan 4 perangkat (k6), uji restore backup.

### Fase 4 (e-ticket, RSVP)

**Tabel baru:** `rsvps` (kunci `guest_id` + `event_id`, status `hadir | tidak_hadir | ragu`, `pax`) dan `guestbook` (`guest_id` menjadi NULL bila tamunya dihapus permanen). Migrasi 0007. Tidak ada tipe enum Postgres; status memakai `text` + `CHECK`, seperti tabel lain.

**Halaman tamu `/u/KODE`** (tanpa login): tiket QR yang digambar di perangkat (hanya bila ada acara `checkin_enabled` yang diundang), kartu per acara yang diundang (tanggal, jam sesi kelompok atau jam acara, tempat, peta), kartu RSVP untuk acara `has_rsvp`, Tiket terakhir disimpan di `localStorage` per kode, jadi QR tetap terbuka saat sinyal hilang. Gaya halaman memakai token desain admin; desain undangan menyusul di fase 5.

**RSVP:** jawaban boleh diubah kapan saja (upsert). Jumlah orang hanya ditanyakan untuk tamu **rombongan** yang menjawab hadir; tamu biasa selalu 1 dan "tidak hadir" selalu 0. Hanya tamu yang diundang ke acara itu yang bisa menjawab, dan hanya acara dengan `has_rsvp`.

**Ucapan dipindah ke fase 5** (keputusan: buku ucapan yang bisa dibaca tamu lain lebih cocok menjadi bagian undangan). Di fase 4 hanya **API dan tabelnya** yang ada; tampilan tamu dan menu admin dikerjakan sebagai slice pertama fase 5 (lihat di bawah). Aturan yang sudah dipasang: ucapan hanya bisa dikirim dari tautan pribadi (kode tamu wajib), nama bawaan = nama undangan (boleh diganti), daftar publik hanya memuat yang tidak disembunyikan dan terbaru dulu. Admin mempelai bisa **membalas** (balasan tampil di bawah ucapan), menyembunyikan, dan menghapus.

**API publik** (`/api/v1/public`, dua pembatas per IP, 15 menit): `GET /ticket/:code`, `POST /rsvp`, `GET /guestbook`, `POST /guestbook`. Tebakan kode salah dibatasi 30 kali (setelah itu semua permintaan IP itu ditolak 429, termasuk kode benar); kiriman RSVP dan ucapan dibatasi 20 kali. Respons tiket tidak memuat HP/Instagram dan memakai `Cache-Control: no-store`. Pembatas hidup di memori proses, seperti pembatas login.

**Admin:** menu RSVP (rekap hadir/tidak hadir/belum pasti/belum menjawab beserta jumlah orang, filter status dan nama) . Dashboard check-in menampilkan "orang hadir / N RSVP hadir" bila acara check-in memakai RSVP. Modal QR di daftar tamu punya tautan ke halaman undangan tamu.

**Pengujian:** 161 tes API (tiket, RSVP, API ucapan publik dan admin, pembatas, dashboard) dan 44 tes web (termasuk cache tiket). Tampilan halaman tamu diperiksa di Firefox headless dengan API palsu; belum diuji di HP sungguhan.

### Fase 5 (editor konten dan desain undangan): selesai

**Keputusan (21 Okt 2026):**
- **Bagian undangan tahap pertama:** profil mempelai + cerita, galeri foto, amplop digital (rekening bank dan e-wallet), FAQ + wishlist hadiah, ditambah buku ucapan.
- **Media:** foto dan musik diunggah admin lewat editor dan disimpan di server VPS (bukan file statis di repo, bukan tautan eksternal). Perlu pengecilan gambar dan penyimpanan yang ikut dibackup.
- **Gaya visual:** brutalis terang seperti admin (krem, bingkai hitam 2px, bayangan keras, aksen acid dan biru listrik); halaman tiket sekarang sudah memakainya.
- **Urutan kerja:** (1) buku ucapan + balasan admin, (2) rangka undangan berbagian di `/u/KODE`, (3) editor konten per bagian. Tabel konten dirinci saat tiap bagian dikerjakan (aturan tetap: tabel biasa, `sort_order`, tanpa `wedding_id`).

**Selesai (slice 1):** buku ucapan tampil di halaman tamu (tulis ucapan dengan nama bawaan nama undangan, daftar terbaru dulu dengan balasan mempelai, muat lebih banyak) dan menu **Ucapan** di admin (balas, ubah balasan, sembunyikan, hapus, filter tampil/disembunyikan). Navigasi admin sekarang menjadi hamburger di bawah 1280px karena sudah ada sembilan menu; header memakai lebar `max-w-7xl` dan nama pengguna disembunyikan di bawah 1536px.

**Selesai (slice 2): sistem media, profil mempelai, dan cerita.** Migrasi 0008 (`media`) dan 0009 (`couple_profiles`, `story_items`).
- **Media:** admin mengunggah JPEG/PNG/WebP (maks. 25 MB); server menyimpan dua berkas WebP per gambar di `MEDIA_DIR/<id>/` (`large.webp`, `thumb.webp`) dan satu baris di `media`. **Keputusan: foto tidak boleh dikompres sampai detailnya hilang.** `large` mempertahankan resolusi asli (dibatasi hanya bila sisinya lewat 8000 px) dengan WebP near-lossless; selisih piksel terhadap aslinya di bawah 1 dari 255. WebP berlossy biasa, bahkan kualitas 95, masih memberi selisih 2-5 (pengukuran di sesi ini), jadi tidak dipakai. Konsekuensinya berkas bisa 2-3x lebih besar dari JPEG asli; bila halaman tamu terasa lambat di sinyal lemah, tambahkan varian sedang untuk tampilan inline dan simpan `large` untuk perbesaran. `thumb` (480 px, berlossy) hanya untuk pratinjau admin. EXIF dibuang (termasuk lokasi GPS) dan orientasi diterapkan; batas piksel masukan 50 juta mencegah bom dekompresi.
- **Penyajian:** `GET /media/:id/(large|thumb).webp` tanpa login, di luar `/api`, dengan `Cache-Control: immutable` karena id tidak pernah berubah isinya. Caddy dan Vite meneruskan `/media`; service worker tidak boleh mengalihkannya ke `index.html`.
- **Kepemilikan:** satu gambar dimiliki satu tempat. Kolom foto baru wajib didaftarkan di `MEDIA_USERS` (`services/media.ts`) agar gambar yang masih dipakai tidak bisa dihapus (409), dan setiap penggantian atau penghapusan harus memanggil `discardMedia`. Gambar yang diunggah tetapi tidak pernah disimpan disapu server saat ada unggahan baru bila lebih tua dari satu jam.
- **Profil mempelai:** satu baris per peran (`groom`, `bride`): nama lengkap, panggilan, orang tua, perkenalan, Instagram, foto. **Cerita:** butir berurutan (`sort_order`) dengan label waktu bebas, judul, isi, dan foto; urutan diatur dengan tombol naik/turun lewat `PUT /story/order` yang harus memuat semua id.
- **Admin:** menu **Undangan** (`/admin/undangan`) berisi tab Mempelai, Cerita, Galeri, Amplop, FAQ, Wishlist, Susunan, dan Ucapan menjadi tab baru. **Tamu:** `/u/KODE` hanya tiket, info acara, dan RSVP; Mempelai, Cerita, Galeri, Amplop digital, Wishlist, Tanya jawab, dan buku ucapan ada di `/u/KODE/undangan`. `GET /public/invitation` (tanpa kode, cache 30 detik) mengisi bagian-bagian itu; foto ditampilkan tanpa dipotong dan dimuat malas.
- **Amplop digital:** tabel `gift_accounts` (jenis `bank` atau `ewallet`, penyedia, atas nama, nomor, gambar QR opsional seperti QRIS yang terdaftar di sistem media). Tamu menyalin nomor dengan satu ketukan. Nomor rekening ikut dikirim ke publik lewat `/public/invitation` karena memang untuk dibagikan.
- **Sampul dan susunan:** tabel `invitation_cover` (satu baris: foto dan kalimat pembuka) dan `invitation_sections` (kunci bagian, urutan, tampil/sembunyi; bagian tanpa baris memakai urutan bawaan dan tampil). Sampul di `/u/KODE/undangan` menampilkan foto, tanggal acara paling awal (otomatis dari tabel acara), dan kalimat pembuka; tanpa gerbang "Buka undangan" agar tamu langsung melihat isi. Bagian yang diizinkan tampil tetap dilewati bila belum ada isinya. Buku ucapan menjadi salah satu bagian yang bisa diurutkan.
- **FAQ dan wishlist:** tabel `faq_items` (pertanyaan, jawaban) dan `wishlist_items` (nama, keterangan, tautan http(s) opsional, foto opsional, `quantity` jumlah dibutuhkan; terpenuhi bila total pilihan tamu >= `quantity`). Tamu memilih hadiah dari halamannya (tabel `wishlist_claims`, satu baris per tamu per hadiah, jumlah 1+). Sisa = `quantity - total pilihan`; pemeriksaan dilakukan di dalam transaksi dengan baris hadiah dikunci (`for update`) agar dua tamu yang memilih bersamaan tidak sama-sama lolos untuk unit terakhir. Tidak ada isian manual "sudah diberikan": satu-satunya sumber terpenuhi adalah pilihan tamu (admin bisa melepas pilihan, atau menaikkan `quantity` bila perlu). Rute: `GET /public/claims/:code` (pilihan milik tamu itu saja) dan `POST /public/claims` (quantity 0 = melepas), keduanya memakai kode tamu dan pembatas kiriman. Admin melihat nama pemilih dan bisa melepas pilihan; respons publik tidak memuat nama. Tamu melihat FAQ sebagai daftar yang bisa dibuka-tutup.
- **Galeri:** tabel `gallery_items` (satu gambar hanya sekali, urutan lewat `sort_order`). Admin memilih banyak foto sekaligus; tiap foto diunggah ke sistem media lalu dipasang ke galeri. Tamu melihat kisi thumbnail dan membuka resolusi penuh (`large`) di pemutar layar penuh.
- **Deploy:** volume Docker `media` di `/data/media` (harus ikut backup), `sharp` dipasang di image API seperti argon2 (musl, sudah dicoba di Alpine), lihat `docs/deploy.md`.
- **Pengujian:** 183 tes API (22 baru untuk media dan undangan, termasuk perbandingan piksel dan EXIF) dan uji peramban terisolasi (API port 3101, database `wedding_e2e`): unggah foto 3200x2400 lewat form, simpan profil dan cerita, urutan, halaman tamu menampilkan gambar 3200x2400 penuh, hapus cerita menghapus foto.

### Fase 6 (vendor, amplop/hadiah): berjalan

- **Hadiah masuk** (`/admin/hadiah`, API `/api/v1/admin/received-gifts`): tabel `received_gifts`, bukan `gifts` seperti di sketsa skema, agar tidak tertukar dengan rekening amplop digital (`gift_accounts`) di undangan. Jenis `amplop` (tunai), `transfer`, dan `barang`; amplop dan transfer wajib bernominal bulat (rupiah, maksimal Rp 10 miliar), barang wajib bernama dan tidak bernominal (dijaga juga oleh batasan database). Pemberi boleh tamu terdaftar (`guest_id`, nama terisi otomatis dan boleh diubah) atau diketik bebas; nama disimpan sendiri sehingga catatan tetap utuh bila tamunya dihapus. Tanggal diterima bawaan hari ini (WIB). Penanda `thanked_at` untuk ucapan terima kasih, ringkasan (total amplop, transfer, jumlah barang, belum dibalas) dihitung dari seluruh catatan tanpa terpengaruh filter. Pencatat (`recorded_by`) diambil dari sesi admin. Belum ada ekspor CSV atau kaitan ke wishlist.

## 15. Belum diputuskan (tidak memblokir fase 1–4)

- Desain dan format undangan (ide game 2D; sebaiknya "mode jelajah" opsional yang dimuat belakangan agar sinyal lemah tetap lancar).
- Rincian fitur sisi tamu: wishlist dengan klaim, foto tamu, musik latar, live streaming.
- Pilihan bahasa kedua di masa depan (struktur teks dipisah dari komponen supaya bisa ditambah).
- Nama domain dan penyedia VPS.
