# Desain — Admin dan Aplikasi Internal

> *clinical blueprint on frosted paper* — tema terang, monokrom, kartu berradius besar di atas garis tipis.

Berlaku untuk **admin** dan layar internal lain (kecuali scanner, lihat bagian "Pengecualian"). Desain undangan untuk tamu belum ditentukan dan **tidak** memakai dokumen ini.

Token diimplementasikan di `apps/web/src/styles.css` (blok `@theme`). Komponen dasar ada di `apps/web/src/components/ui/`.

## Warna

| Nama | Nilai | Utility Tailwind | Peran |
|---|---|---|---|
| Canvas | `#f5f5f5` | `bg-canvas` | Latar halaman, isi input, tombol sekunder |
| Paper | `#ffffff` | `bg-paper` | Permukaan kartu, popover |
| Surface Alt | `#fafafa` | `bg-surface-alt` | Sidebar, teks di atas tombol utama |
| Ink | `#0a0a0a` | `text-ink`, `bg-ink` | Teks utama, tombol utama |
| Ink Soft | `#171717` | `bg-ink-soft` | Hover tombol utama, badge solid |
| Mid Gray | `#737373` | `text-mid-gray` | Teks pendukung, placeholder |
| Hairline | `#e5e5e5` | `border-hairline` | Border, garis kartu |
| Ember | `#e7000b` | `text-ember` | Merah: hanya untuk aksi destruktif dan error |

## Tipografi

Font **Geist** (variabel, di-bundle lewat `@fontsource-variable/geist`, bukan CDN, supaya tetap tampil saat offline). Fitur OpenType `ss01` dan `cv11` aktif. Bobot 400/500/600.

| Utility | Ukuran | Tinggi baris | Tracking |
|---|---|---|---|
| `text-caption` | 12px | 1.33 | 0.6px (huruf kapital) |
| `text-body` | 14px | 1.43 | — |
| `text-body-lg` | 16px | 1.5 | — |
| `text-subheading` | 18px | 1.56 | — |
| `text-heading-sm` | 24px | 1.33 | -0.6px |
| `text-heading` | 30px | 1.2 | -0.75px |
| `text-heading-lg` | 36px | 1.11 | -0.9px |
| `text-display` | 48px | 1.1 | -2.4px |

## Bentuk

- Dasar spacing 4px (skala bawaan Tailwind: `p-4` = 16px). Padding kartu 20px (`p-5`). Lebar halaman maksimum 1280px.
- Radius: **18px** (`rounded-2xl`) untuk tombol, input, dan badge. **24px** (`rounded-3xl`) hanya untuk kartu. Panel bersarang 10px (`rounded-lg`).
- Bayangan kartu `shadow-subtle`: garis 1px samar + dua lapis elevasi tipis. Kartu **selalu** punya border hairline.
- Tinggi kontrol 36px (`h-9`).

## Komponen

| Komponen | Spesifikasi |
|---|---|
| Tombol utama | `bg-ink`, teks `surface-alt`, pil 18px, 14px/500 |
| Tombol sekunder | `bg-canvas`, teks `ink`, tanpa border |
| Tombol outline | transparan, border 1px hairline |
| Tombol destruktif | teks `ember`, tanpa isi |
| Kartu | `bg-paper`, border hairline, radius 24px, padding 20px |
| Input | `bg-canvas`, tanpa border saat diam, radius 18px, tinggi 36px |
| Badge | pil 18px, 12px/500; varian solid (`ink-soft`), soft (`canvas`), outline |
| Sidebar | `bg-surface-alt`, tanpa garis pemisah |
| Stat | label 12–14px kapital `mid-gray`, angka 30–48px/600 `ink`, tanpa kartu |

## Aturan

**Lakukan**
- Tombol utama selalu gelap (`ink`) di atas terang; itu satu-satunya penekanan utama.
- Radius hanya 18px (interaktif) atau 24px (wadah). Tanpa sudut siku.
- Merah (`ember`) hanya untuk keadaan destruktif atau error.
- Tumpukan permukaan: canvas → sidebar → kartu, tanpa border tambahan.

**Jangan**
- Tidak ada warna merek selain `ember`, tidak ada gradasi, tidak ada bayangan berwarna.
- Teks isi tidak lebih kecil dari 14px dan tidak lebih terang dari `mid-gray`.
- Tracking tidak keluar dari rentang -0.05em sampai 0.05em.
- Jangan campur tombol terisi dan outline berukuran sama dalam satu baris tanpa tombol sekunder di antaranya.

## Penyesuaian dari spec asli

Spec asli diekstrak dari situs shadcn/ui. Beberapa hal diubah agar cocok dengan proyek ini:

1. **Token spacing dibuang.** `--spacing-4: 4px` dan seterusnya akan menimpa skala Tailwind (`p-4` jadi 4px, bukan 16px). Tailwind v4 sudah berbasis 4px.
2. **Tinggi baris dan tracking** ditulis dalam format Tailwind v4 (`--text-body--line-height`), karena `--leading-body` tidak dikenali.
3. **Cincin fokus input** memakai `ring-2 ring-ink/30`. Border hairline (`#e5e5e5`) di atas `#f5f5f5` hampir tidak terlihat sehingga fokus keyboard tidak jelas. Tetap monokrom.
4. **Hanya mode terang.** Spec tidak mendefinisikan mode gelap, jadi varian `dark:` dibuang.
5. **Font di-bundle**, bukan dimuat dari CDN, karena aplikasi harus berjalan offline. Saat PWA dibuat (fase 3), subset bahasa yang tidak dipakai (Cyrillic, Vietnam) dikeluarkan dari precache.
6. **Kontras `mid-gray`:** `#737373` di atas `#f5f5f5` sekitar 4,3:1, sedikit di bawah 4,5:1 (WCAG AA untuk teks kecil). Di atas putih sekitar 4,7:1. Untuk teks penting pakai `ink`; `mid-gray` hanya untuk keterangan.
7. **Ember dua peran.** Tabel token menyebutnya aksen dekoratif, tetapi aturan "Lakukan" menyatakan hanya untuk destruktif/error. Proyek ini mengikuti aturan yang lebih ketat: hanya destruktif dan error.

## Pengecualian: layar scanner

Scanner dipakai satu tangan, berdiri, sering di tempat gelap, sehingga tidak bisa monokrom murni:

- Hasil scan memakai **hijau** (berhasil), **kuning** (sudah masuk), **merah** (tidak valid), dan tampilan khusus untuk **VIP**, dengan warna penuh layar dan kontras tinggi.
- Tombol besar (tinggi minimal 56px), teks besar, dan area ketuk lebar.
- Bahasa visual lain (kartu, tipografi Geist, radius) tetap mengikuti dokumen ini.

Palet dan rinciannya dirancang saat fase 3.
