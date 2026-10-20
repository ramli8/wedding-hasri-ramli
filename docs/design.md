# Desain — Brutalis Terang (admin dan scanner)

> Krem berpola titik, garis hitam 2px, bayangan keras tanpa blur, sudut siku, satu warna aksen neon.

**Sumber:** 9 tangkapan layar halaman situs programmerzamannow.com (lebar mobile 593px; foldernya sudah dihapus dari repo), tangkapan layar desktop 1440px halaman publiknya yang saya ambil kemudian, dan CSS situs itu sendiri. Token warna, font, bayangan, dan pola latar **diambil langsung dari CSS situs**, bukan ditebak dari gambar. Ini rujukan gaya; logo, ilustrasi, dan teks mereka tidak dipakai.

**Status:** **sudah diterapkan** ke `apps/web` (token di `src/styles.css`, komponen di `src/components/ui/`, layout `src/components/app-layout.tsx`). Penyimpangan dari referensi ada di bagian 11.

Asal tiap nilai ditandai: **[css]** dari CSS situs, **[ukur]** diukur dari piksel tangkapan layar, **[usul]** usulan saya untuk proyek ini.

---

## 1. Karakter

- Latar krem `#f1ede2` dengan **pola titik** 22px. Kartu putih di atasnya.
- **Semua kotak** punya border hitam 2px dan **sudut siku** (radius 0).
- **Bayangan keras**: hitam pekat, offset 3 sampai 9px, tanpa blur.
- Satu warna aksen neon (**acid** `#d8ff3e`) untuk penekanan, satu biru (**electric** `#2b2be8`) untuk aksi utama.
- Judul huruf kapital tebal dengan tracking rapat; label kecil huruf kapital monospace dengan tracking lebar.
- Interaksi terasa mekanis: hover mengangkat kotak, tekan menekannya ke bawah.

## 2. Warna

| Token | Hex | Utility | Peran |
|---|---|---|---|
| `bone` | `#f1ede2` | `bg-bone` | Latar halaman, tab nonaktif |
| `bone-2` | `#e6e1d3` | `bg-bone-2` | Kotak ikon, avatar, titik pola, hover lembut |
| `paper` | `#ffffff` | `bg-paper` | Kartu, input |
| `ink` | `#0c0c0c` | `text-ink`, `border-ink` | Teks utama, border, bayangan, bagian gelap |
| `ink-soft` | `#4a4842` | `text-ink-soft` | Teks pendukung (paragraf, keterangan) |
| `acid` | `#d8ff3e` | `bg-acid` | Aksen: tag, kartu sorot, tab aktif, ikon fitur |
| `electric` | `#2b2be8` | `bg-electric` | Tombol aksi utama, kata yang ditonjolkan |
| `alert` | `#c4271e` | `text-alert`, `bg-alert` | Error, hapus, terkunci |
| `ok` | `#077045` | `text-ok`, `bg-ok` | Sukses |
| `tone-1` | `#ffb84d` | `bg-tone-1` | Oranye/kuning pastel |
| `tone-2` | `#7de0a6` | `bg-tone-2` | Hijau pastel |
| `tone-3` | `#8fd8f0` | `bg-tone-3` | Biru muda pastel |
| `tone-4` | `#c4b5fd` | `bg-tone-4` | Ungu pastel |

[css] untuk semua nilai di atas. Warna `tone-*` ada di CSS situs tetapi **tidak terlihat dipakai di tangkapan layar**; peran pastinya tidak diketahui. Di proyek ini dipakai untuk warna kelompok tamu dan status [usul]. Satu-satunya abu-abu tambahan yang terlihat di gambar adalah `#72716c` (placeholder input), bukan token resmi.

### Kontras (dihitung WCAG)

| Pasangan | Rasio | Hasil |
|---|---|---|
| `ink` di atas `bone` / `paper` | 16,7 / 19,6 | AA, semua ukuran |
| `ink-soft` di atas `bone` / `paper` | 7,8 / 9,1 | AA |
| `paper` di atas `electric` | 8,0 | AA |
| `ink` di atas `acid` | 17,0 | AA |
| `alert` di atas `paper` / `bone` | 5,7 / 4,9 | AA |
| `ok` di atas `paper` / `bone` | 6,2 / 5,3 | AA |
| `ink` di atas `tone-1` sampai `tone-4` | 10,6 sampai 12,3 | AA |
| `#72716c` di atas `paper` | 4,9 | AA, **hanya di atas putih** |
| `#72716c` di atas `bone` | 4,2 | **Gagal** untuk teks kecil |

Aturan: teks pendukung memakai `ink-soft`. Placeholder boleh abu-abu hanya di dalam input putih.

## 3. Tipografi

| Peran | Font | Asal |
|---|---|---|
| Judul dan tombol | **Space Grotesk** (variabel, bobot 300 sampai 700) | [css] |
| Label, angka statistik, kode | **IBM Plex Mono** (400, 500, 600) | [css] |
| Isi teks | Font sistem (`ui-sans-serif, system-ui, sans-serif`) | [css] |

Isi teks memakai font sistem, jadi tampilannya berbeda per perangkat (Roboto di Android, Segoe UI di Windows). Itu memang cara situs rujukan bekerja, dan keuntungannya tidak ada unduhan font untuk isi teks. Space Grotesk dan IBM Plex Mono di-bundle lewat `@fontsource-variable/space-grotesk` dan `@fontsource/ibm-plex-mono`, bukan dari CDN, supaya aplikasi tetap jalan offline [usul].

### Skala ukuran [css]

`sm` 14px, `base` 16px, `lg` 18px, `xl` 20px, `2xl` 24px, `3xl` 30px, `4xl` 36px, `5xl` 48px, `6xl` 60px, `8xl` 96px. Tinggi baris 1 untuk `5xl` ke atas, 1,11 untuk `4xl`, 1,2 untuk `3xl`, dan 1,33 sampai 1,56 untuk ukuran di bawahnya.

### Gaya teks

| Gaya | Spesifikasi | Asal |
|---|---|---|
| Judul halaman (H1) | Space Grotesk 700, **huruf kapital**, 36 sampai 48px, tracking -0,04em | [ukur], tracking [css] |
| Judul seksi (H2) | Space Grotesk 700, kapital, 24 sampai 30px, tracking -0,03em | [ukur] |
| Judul kartu (H3) | Space Grotesk 700, kapital, 15 sampai 18px, tracking -0,02em | [ukur] |
| Tombol | Space Grotesk 600 sampai 700, kapital, 13 sampai 14px, tracking 0,06em | [ukur] |
| **Tag / label** (`.tag`) | IBM Plex Mono 600, kapital, **12px, tracking 0,14em** | [css] |
| Angka statistik | IBM Plex Mono 700, 28 sampai 36px | [ukur] |
| Label seksi bernomor | IBM Plex Mono 400, 12px, `01 / Katalog` | [ukur] |
| Isi teks | Sistem 400, 14 sampai 16px, `ink-soft` | [ukur] |
| Teks bergaris luar | `color: transparent` + `-webkit-text-stroke: 2px ink`, untuk kata ke-3 di judul besar | [css] |

Tracking yang dipakai di CSS situs: -0,06 / -0,05 / -0,04 / -0,03 / -0,02 / -0,01 (judul), 0,04 / 0,06 / 0,08 / 0,12 / 0,14 / 0,18em (label). Jangan keluar dari rentang ini.

## 4. Bentuk

- **Border:** `2px solid ink` untuk semua kotak. Border 1px hanya untuk pil kecil (meta soal, menit, kategori). [css/ukur]
- **Radius:** 0. Satu-satunya bentuk bulat adalah logo. [ukur]
- **Bayangan keras** [css]: `--shadow-hard-sm` 3px, `--shadow-hard` 4px, `--shadow-hard-lg` 6px, `--shadow-hard-xl` 9px, semuanya `Npx Npx 0 ink`. Pemakaian [ukur]:
  - 3px: kotak statistik kecil, tombol menu
  - 4px: tombol, kartu di daftar
  - 6px: kartu utama (login, kartu kosong)
  - 9px: hanya untuk hover kartu besar
- **Pola titik** [css]: `radial-gradient(bone-2 1px, transparent 1px)`, ukuran **22px**. Dipakai hanya di latar halaman.
- **Pemisah:** garis penuh 2 sampai 3px `ink` antara header dan isi, dan antar seksi.
- **Spacing:** skala Tailwind (basis 4px). Padding sisi halaman di mobile 18px. [ukur]
- **Lebar kontainer** [css]: 40, 48, 64, 80, 96rem.
- **Desktop (viewport 1440px)** [ukur]: tinggi header 66px + garis 3px; isi berada di kontainer sekitar **1128px** (dari x=150 sampai 1278); kartu statistik 3 kolom dan kartu katalog 4 kolom dengan jarak sekitar 20px; kartu login selebar 416px; hero dua kolom dipisah garis vertikal 3px.

## 5. Interaksi dan gerak [css]

| Keadaan | Efek |
|---|---|
| Hover tombol/kartu | Bergeser **-2px kiri dan atas** (kartu besar -3px), bayangan naik satu tingkat (4 ke 6px, 6 ke 9px) |
| Tekan (`active`) | Bergeser **+2px kanan dan bawah**, **bayangan hilang** (tombol seakan tertekan masuk) |
| Hover warna | Tombol putih jadi `acid` atau `ink` (teks berbalik); baris daftar jadi `bone` |
| Fokus | Latar `bone` dan cincin `ink` |
| Nonaktif | Opasitas 0,4 sampai 0,6 dan `cursor: not-allowed` |
| Durasi | 0,12 sampai 0,18 detik, easing `cubic-bezier(.4, 0, .2, 1)` |
| `prefers-reduced-motion` | Transisi dimatikan (0,001ms), seperti di situs rujukan |

Cincin fokus rujukan hanya `ring-ink`. Untuk keyboard, saya menambah `outline` 2px `ink` dengan offset 2px pada semua kontrol [usul].

## 6. Komponen

Semua komponen di bawah terlihat di tangkapan layar. Kolom "Dipakai di" adalah rencana saya.

| Komponen | Anatomi | Dipakai di |
|---|---|---|
| **Header** | Logo bulat + nama (Space Grotesk kapital 14px), garis bawah 3px. **Mobile:** tombol menu persegi (border + bayangan 3px). **Desktop:** tautan navigasi horizontal (kapital 13px, tracking 0,06em; item aktif berlatar `acid`) dan tombol biru di kanan | Bar atas admin |
| **Header halaman** | Tag acid, H1 kapital, paragraf `ink-soft`, garis 2px di bawah | Judul tiap halaman |
| **Tag** | Latar `acid`, border 2px, `.tag` mono 12px; bisa diawali titik `●` | Kategori halaman, status "SESI INI" |
| **Pil meta** | Putih, border 1px, mono 12px, ikon + teks (`20 soal`, `30 menit`) | Info kecil di kartu |
| **Tombol utama** | `electric`, teks putih, border 2px, bayangan 4px, ikon panah | Simpan, Tambah, Masuk |
| **Tombol sekunder** | Putih, border 2px, bayangan 4px | Batal, Ubah, Ekspor |
| **Tombol hapus** | Putih + ikon tempat sampah (terlihat di gambar). Hover `alert` ada di CSS situs tetapi belum terlihat di gambar | Hapus, Cabut |
| **Tombol di latar gelap** | `acid`, bayangan juga `acid` | Blok ajakan di latar `ink` |
| **Input** | Putih, border 2px, tinggi sekitar 52px, placeholder abu-abu, tanpa radius | Semua formulir |
| **Pilih (select)** | Seperti input, teks mono kapital (`URUTKAN: A → Z`) | Filter |
| **Tab segmen** | Dua sel bernomor (`01 / EMAIL`, `02 / KODE OTP`) dipisah garis 2px; aktif `acid`, nonaktif `bone-2` + mono pudar | Langkah, mode |
| **Chip kategori** | Mono kapital 12px; aktif = latar `ink` + teks putih + bayangan, nonaktif = putih + border; baris bisa digulir | Filter kelompok |
| **Kartu** | Putih, border 2px, bayangan 4 sampai 6px, padding 18 sampai 24px | Wadah utama |
| **Kartu terbelah** | Kartu dengan baris atas (ikon + judul) dan isi, dipisah garis 2px | Kartu perangkat, kartu daftar |
| **Kartu sorot** | Kartu berlatar `acid` | Statistik utama |
| **Kartu gelap** | Latar `ink`, judul `acid`, teks `bone`, daftar centang `acid` | Pemberitahuan penting |
| **Kotak statistik** | Kotak 2px + bayangan 3px; angka mono besar, label mono kapital 11px | Dashboard |
| **Baris statistik** | Angka mono di kiri, label mono kapital rata kanan, dipisah garis 2px | Ringkasan |
| **Kotak ikon** | Persegi 44 sampai 56px, border 2px, latar `bone-2` (netral), `acid` (fitur), atau `alert` (terkunci) | Awalan judul kartu |
| **Avatar inisial** | Persegi 40px, border 2px, latar `bone-2`, inisial mono tebal | Nama pengguna |
| **Pasangan kunci-nilai** | Label mono kapital di kiri, nilai di kanan; nilai teknis berupa pil `bone` bermono | Detail perangkat |
| **Keadaan kosong** | Kartu 6px, kotak ikon di tengah, judul kapital, penjelasan, tombol utama | Daftar kosong |
| **Keadaan terkunci/error** | Kotak ikon `alert`, label mono `alert` | Akses ditolak |
| **Daftar centang** | Kotak `acid` 20px dengan border + ikon centang | Daftar fitur |
| **Pita berjalan** | Garis penuh `acid` dengan teks mono kapital, di antara dua garis 2px | Dekoratif (tidak dipakai di admin) |
| **Label sudut** | Kotak `ink` kecil di pojok kartu, teks mono `acid` (`DISKON`, `GRATIS`) | Penanda VIP pada kartu |
| **Kutipan** | Kartu putih/`acid` bergantian, tanda kutip besar, inisial | Tidak dipakai di admin |
| **Tautan "lihat rincian"** | Mono kapital + panah | Tautan sekunder |
| **Footer** | Logo, kolom dengan judul mono kapital, garis, hak cipta mono | Tidak dipakai di admin |

**Ikon:** garis tipis berukuran 20 sampai 24px yang tampak bergaya Lucide (box, monitor, trash, lock, search, arrow-right, check). Set ikonnya tidak bisa dipastikan dari gambar. Saya usulkan `lucide-react` (bisa di-tree-shake) [usul].

## 7. Penerapan di admin [usul]

Referensi hanya berisi halaman publik situs edukasi, jadi bagian ini adalah keputusan saya tentang cara gaya itu dipakai untuk aplikasi data. Boleh diubah.

| Kebutuhan admin | Perlakuan |
|---|---|
| **Latar halaman** | `bone` + pola titik. Pola **tidak** muncul di balik tabel; tabel selalu di dalam kartu putih. |
| **Tabel tamu** | Satu kartu putih berborder 2px dan bayangan 4px. Judul kolom mono kapital 12px. Baris dipisah garis 1px `bone-2` (bukan 2px hitam, supaya tidak berat). Tanpa bayangan per baris. |
| **Nama tamu** | Tetap huruf biasa (sans, tidak kapital). Kapital hanya untuk judul, tombol, dan label. |
| **Aksi utama per halaman** | Satu tombol `electric` di pojok kanan atas header halaman. |
| **Aksi di baris** | Tombol sekunder kecil; hapus memakai teks `alert`. |
| **Status terkirim** | Pil: terkirim = latar `acid`, belum = putih berborder. |
| **Kelompok tamu** | Chip dengan titik warna dari `tone-1` sampai `tone-4` atau `acid`. Warna lain boleh dipilih admin. |
| **Dialog (modal)** | Kartu 6px di atas latar `ink` 60%, judul kapital, tombol utama di kanan bawah. Tidak ada contoh di referensi. |
| **Pesan error** | Teks `alert` dengan ikon, di dalam kotak berborder `alert`. |
| **Navigasi desktop** | **Bar atas horizontal**, mengikuti desktop referensi (bukan sidebar): logo di kiri, tautan di tengah, nama pengguna dan tombol Keluar di kanan. Item aktif berlatar `acid` dengan border 2px. |
| **Navigasi mobile** | Header seperti rujukan; tombol menu persegi membuka panel putih berisi daftar tautan, yang menutup setelah memilih. |

## 8. Scanner (penyesuaian)

Palet ini sudah punya warna fungsional, jadi scanner tidak perlu keluar dari desain:

| Hasil scan | Latar | Teks | Catatan |
|---|---|---|---|
| Berhasil | `ok` `#077045` | putih | Nama besar, kuota, tombol jumlah orang |
| Sudah masuk | `tone-1` `#ffb84d` | `ink` | Jam dan perangkat yang sudah menerima |
| Tidak valid | `alert` `#c4271e` | putih | Pesan singkat |
| **VIP** | `acid` dengan bingkai `ink` tebal 8px dan label sudut `VIP` | `ink` | Berbeda jelas dari tiga hasil lain |

Aturan scanner: tombol minimal 56px, bayangan keras tetap dipakai, tanpa animasi hover (perangkat sentuh), getar dan suara untuk umpan balik. Rincian layar dirancang di fase 3.

## 9. Lakukan dan jangan

**Lakukan**
- Border 2px hitam di semua kotak, radius 0.
- Bayangan keras `ink` dan tingkatan 3, 4, 6, 9px.
- Satu aksen (`acid`) dan satu biru aksi (`electric`) per layar; sisanya `ink`, putih, dan krem.
- Judul kapital Space Grotesk; label kapital IBM Plex Mono.
- Hover mengangkat, tekan menenggelamkan.

**Jangan**
- Jangan memakai radius, blur, gradasi, atau bayangan berwarna (kecuali bayangan `acid` di atas latar `ink`).
- Jangan memakai pola titik di balik data padat.
- Jangan memakai `#72716c` di atas krem.
- Jangan mengkapitalkan nama tamu atau data pengguna.
- Jangan menumpuk lebih dari satu kartu sorot `acid` dalam satu layar.
- Jangan menaruh `acid` untuk teks di atas putih (hampir tak terlihat); `acid` hanya sebagai latar dengan teks `ink`.

## 10. Yang tidak ada di referensi (asumsi)

Referensi tidak memuat hal-hal berikut. Semuanya perlu keputusan atau sekadar saya rancang mengikuti gaya yang ada:

- **Layout desktop halaman terkunci.** Desktop halaman publik sudah diamati (bar atas, kontainer 1128px). Halaman yang memerlukan login (riwayat pesanan, sesi perangkat) hanya ada versi mobile; lebar tabel data di desktop tetap usulan saya.
- **Tabel, dialog, toast, checkbox, textarea, input tanggal/jam, tab data.**
- **Mode gelap.** Hanya ada satu bagian gelap (blok ajakan), tidak ada tema gelap penuh.
- **Keadaan error formulir dan validasi inline.** Hanya `alert` untuk keadaan terkunci yang terlihat.
- **Font isi teks yang pasti**, karena memakai font sistem.

## 11. Penerapan di kode dan penyimpangan dari referensi

**Terpasang:** token warna, font, bayangan, dan pola titik di `styles.css`; utilitas `tag`, `bg-raster`, `lift`, dan `check-box`; komponen `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Badge`, `Card`, `Alert`, `Field`, `Dialog`, `PageHeader`; layout bar atas; halaman login dan semua halaman admin. Font di-bundle (`@fontsource-variable/space-grotesk`, `@fontsource/ibm-plex-mono` subset latin) dan ikon memakai `lucide-react`.

Penyimpangan yang disengaja:

| Hal | Referensi | Di admin | Alasan |
|---|---|---|---|
| Tombol di baris tabel (`size="sm"`) | Bayangan 4px selalu tampil | Tanpa bayangan saat diam; bayangan 3px dan angkat 2px baru muncul saat hover | Satu baris punya 3 tombol; bayangan di semua baris terlalu berat |
| Fokus keyboard | Hanya `bg-bone` + cincin `ink` | Ditambah `outline` 2px `ink` offset 2px di semua kontrol | Fokus harus terlihat jelas di perangkat tanpa mouse |
| Badge | Satu gaya `.tag` | Empat varian: `tag` (acid), `solid` (ink + acid), `pill` (putih 1px), `pillAcid` | Nama kelompok dan acara adalah data, bukan label; kapital mono lebar terlalu panjang |
| Isi dialog | Tidak ada di referensi | Fokus awal ke isi dialog, bukan tombol tutup | `showModal()` memfokuskan kontrol pertama |
| Tinggi kontrol | 52px (login) | 44px (`h-11`) | Layar admin lebih padat |
| Mode gelap | Tidak ada | Tidak ada (`color-scheme: light`) | Sesuai referensi |

Yang belum ada: desain layar scanner (fase 3), dan halaman publik undangan.
