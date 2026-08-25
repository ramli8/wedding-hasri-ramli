# CONTEXT — Wedding Hasri & Ramli

Glossary domain (ubiquitous language) + peta konsep. Dikelola `/grill-with-docs` / `/domain-modeling`;
perbarui saat istilah baru disepakati. Jangan menciptakan sinonim untuk istilah di bawah.

## Sistem

Aplikasi undangan & manajemen pernikahan — backend Go (`backend/`) + frontend Next.js (`frontend/`).
Data inti: tamu (guest) + check-in QR, kategori tamu, kondangan (tamu undangan/hadiah), vendor
(kategori, atribut, pembayaran), dan RBAC (role/permission/module access).

## Istilah domain

- **Tamu (guest)** — individu yang diundang. Punya `qr_code` unik 6 karakter, relasi ke
  `guest_category`, status attending, dan riwayat check-in/check-out.
- **Kategori Tamu (guest category)** — kelompok tamu (mis. keluarga, teman, rekan kerja). Punya
  `start_time` / `end_time` (sesi undangan).
- **Check-in** — proses validasi kehadiran tamu via QR (`status_attending` → `going`, set `check_in_at`).
- **Status attending** — `pending` | `going` | `not_going` (default `pending`).
- **Status sent** — `pending` | `sent` (penanda pesan/undangan sudah dikirim via WA/IG).
- **Kondangan** — catatan tamu yang datang/mengirim hadiah: pasangan (`couple_name`), relasi
  (`kondangan_relations`), sisi (`side`), jenis hadiah (`gift_type`), nama hadiah (`gift_name`), nominal.
- **Vendor** — penyedia layanan pernikahan: kategori vendor, atribut (dinamis), dan pembayaran.
- **Role & Permission (RBAC)** — hak akses per role. Permission key `module.action`
  (mis. `guests.create`, `vendors.categories.update`). Ada konsep **module access** per role.
- **Super Admin / Admin** — role yang diizinkan akses modul admin (middleware `RequireRole`).

## Konten undangan dinamis (behavior kontrak)

- Seluruh konten halaman `/` bersumber dari backend (`GET /v1/invitation`) — **tidak ada nilai
  default implisit di frontend**. Field kosong/null di admin → elemen terkait **tidak dirender**
  (bukan diisi otomatis). Terverifikasi untuk section Pembuka; prinsipnya berlaku semua section.
- Section yang dirender = baris aktif di tabel `invitation_sections` (`section_key` + `order_index`);
  section tanpa baris tidak muncul walau datanya ada.
- Cover punya 3 slot gambar tetap per perangkat (`image_desktop/tablet/mobile`) dengan fallback
  antar-slot; slot kosong + fallback kosong → tanpa foto latar. Nama panggilan mempelai
  (`wedding_couples.nickname`) dipakai di cover, fallback nama lengkap.
- Upload media lewat `/api/upload` (folder whitelist); penghapusan file fisik via
  `DELETE /api/upload?url=` saat slot diganti/kosongkan agar storage tidak membengkak.

## Istilah arsitektur

- **Module backend** (`backend/internal/<modul>/`) — `dto.go`, `handler.go` (tipis), `service.go`
  (business logic), `repository.go` (GORM). Wiring DI di `container/container.go`.
- **`SetupRoutes`** (`pkg/router/router.go`) — satu-satunya tempat registrasi route; middleware
  JWT (`JWTAuthMiddleware`), role (`RequireRole`), permission (`RequirePermission`).
- **Clean Architecture frontend** — `domain/services` (API) → `application/hooks` (React Query) →
  `infrastructure/stores` (Zustand) → `presentation/components`.
- **Query key factory** — pola key bertingkat di hook (mis. `guestKeys.all`, `guestKeys.guestList(params)`).
- **Desain sistem** — lihat `frontend/desain.md` (bottom sheet, AlertDialog iOS, pill tabs, FAB, dll).

## Putusan arsitektur

- ADR di `docs/adr/` — dibuat oleh `/grill-with-docs` saat keputusan domain disepakati.
- Tidak ada istilah baru → jangan dipakai; minta klarifikasi dulu ke user.
