# Panduan uji manual, langkah demi langkah

Panduan ini ditulis untuk orang yang bukan programmer. Ikuti dari atas ke bawah, karena bagian belakang
memakai data yang dibuat di bagian depan. Setiap langkah berisi:

- **Klik / buka**: apa yang ditekan.
- **Isi**: apa yang diketik (pakai contoh di bawah supaya mudah dicocokkan).
- **Harusnya**: apa yang muncul bila benar. Bila yang muncul berbeda, itu **masalah**: catat nomor
  langkahnya, ambil tangkapan layar, dan lanjutkan ke langkah berikutnya.

Centang kotak `[ ]` menjadi `[x]` setiap kali satu langkah lolos.

> Fokus uji saat ini (11 Nov 2026): **admin**, **HP penjaga pintu**, dan **photobooth**. Halaman
> undangan yang dilihat tamu masih statis (isi contoh), jadi Bagian 7 dilewati dan RSVP dicatat dari
> admin.

---

## Data contoh yang dipakai

Ketik persis seperti ini supaya hasilnya mudah dicek.

| Untuk | Isi |
|---|---|
| Email admin | `admin@contoh.com` |
| Kata sandi admin | `RahasiaNikah2027` (minimal 10 huruf) |
| Mempelai pria / wanita | `Mohamad Rizal Ramli` / `Hasri Wiji Aqsari` |
| Alamat situs | `https://hasriramli.com` |
| Acara 1 | Nama `Akad Nikah`, tanggal `21 Mei 2027`, tempat `Masjid Al-Ikhlas` |
| Acara 2 | Nama `Resepsi`, tanggal `21 Mei 2027`, tempat `Gedung Graha Bunga` |
| Acara & jam datang (di Kelompok) | Keluarga: Akad + Resepsi, Resepsi `11.00` sampai selesai; Teman Kantor: hanya Resepsi `12.00–13.00`; Teman Kuliah: hanya Resepsi, jam bebas |
| Kelompok | `Keluarga` (VIP), `Teman Kantor`, `Teman Kuliah` |
| Tamu A | `Bpk. Budi Santoso`, HP `0812 3456 7801`, kelompok Keluarga, diundang Akad + Resepsi |
| Tamu B | `Sari Lestari`, Instagram `sarilestari`, kelompok Teman Kuliah, diundang Resepsi |
| Tamu C (rombongan) | `Keluarga Bpk. Joko`, HP `0812 3456 7803`, kelompok Teman Kantor, centang Rombongan, diundang Resepsi |
| Tamu D | `Dewi Anggraini`, HP `0812 3456 7804`, kelompok Teman Kantor, diundang Resepsi |
| Nama HP penjaga | `HP Gerbang A`, `HP Gerbang B` |
| Nama laptop booth | `Laptop Booth` |

---

## Bagian 0. Menyalakan aplikasi di laptop

Bagian ini memakai **terminal** (jendela hitam untuk mengetik perintah). Buka terminal di folder
proyek `wedding-hasri-ramli`, lalu ketik perintah satu per satu dan tekan Enter.

- [ ] **0.1** Ketik `pnpm dev:db` lalu Enter.
  **Harusnya**: muncul tulisan seperti `Container ... Started`. Ini menyalakan database.
- [ ] **0.2** Buka terminal kedua (tab baru), ketik `pnpm dev:api`.
  **Harusnya**: ada tulisan `api berjalan` dan `port: 3000`. **Biarkan terminal ini terbuka.**
- [ ] **0.3** Buka terminal ketiga, ketik `pnpm dev:web`.
  **Harusnya**: ada tulisan `Local: http://localhost:5173/`. **Biarkan terbuka.**
- [ ] **0.4** Di terminal keempat, buat akun admin:
  `pnpm --filter @wedding/api admin:create --email admin@contoh.com --name "Ramli"`
  Saat diminta kata sandi, ketik `RahasiaNikah2027` (huruf tidak tampil di layar, itu normal), Enter,
  lalu ulangi sekali lagi.
  **Harusnya**: muncul pesan akun berhasil dibuat.
- [ ] **0.5** Supaya HP bisa membuka aplikasi (kamera HP butuh alamat `https`), ketik di terminal
  keempat: `cloudflared tunnel --url http://localhost:5173`.
  **Harusnya**: muncul alamat seperti `https://kata-kata-acak.trycloudflare.com`. Catat alamat itu;
  di panduan ini disebut **ALAMAT-HP**. Alamat ini berubah setiap kali perintah dijalankan ulang.
- [ ] **0.6** Bila ingin login admin dari HP juga: buka file `.env` di folder proyek, cari baris
  `ALLOWED_ORIGINS=`, tambahkan koma lalu ALAMAT-HP di belakangnya, simpan, lalu di terminal kedua
  tekan `Ctrl+C` dan jalankan lagi `pnpm dev:api`.

Siapkan juga: 2 HP untuk penjaga pintu, laptop + kamera Fujifilm X-A7 + printer
Epson L3110 untuk photobooth.

---

## Bagian 1. Masuk ke admin

- [ ] **1.1** Di laptop, buka Chrome, ketik alamat `localhost:5173/admin`.
  **Harusnya**: otomatis pindah ke halaman masuk (`/admin/masuk`).
- [ ] **1.2** Isi email `admin@contoh.com` dan kata sandi `salahsalah123`, klik **Masuk**.
  **Harusnya**: muncul "Email atau kata sandi salah".
- [ ] **1.3** Ulangi sandi salah sampai total 5 kali.
  **Harusnya**: muncul "Terlalu banyak percobaan. Coba lagi nanti." (kunci 15 menit). Untuk lanjut
  segera, matikan dan nyalakan lagi terminal kedua (`Ctrl+C`, lalu `pnpm dev:api`).
- [ ] **1.4** Masuk dengan sandi benar `RahasiaNikah2027`.
  **Harusnya**: masuk ke **Beranda**, ada menu di kiri (Umum, Undangan, Hari-H, Keuangan, Lainnya).
- [ ] **1.5** Klik **Panduan** di menu kiri.
  **Harusnya**: halaman panduan memakai aplikasi terbuka.

## Bagian 2. Pengaturan pernikahan

- [ ] **2.1** Menu **Pengaturan → Pernikahan**. Isi **Mempelai pria** `Mohamad Rizal Ramli`,
  **Mempelai wanita** `Hasri Wiji Aqsari`, **Alamat situs** `javascript:alert(1)`, klik **Simpan**.
  **Harusnya**: ditolak, ada pesan "Alamat situs harus diawali http:// atau https://".
- [ ] **2.2** Ganti **Alamat situs** menjadi `https://hasriramli.com`, klik **Simpan**.
  **Harusnya**: muncul tanda kecil "Tersimpan".
- [ ] **2.2b** Di halaman yang sama isi **Hitung mundur ke (WIB)** `21 Mei 2027 11.00`, Simpan.
  (Dipakai hitung mundur di undangan; kosong = tanggal acara pertama.)
- [ ] **2.3** Menu **Pengaturan → Tampilan**: pilih **Gelap**, lalu muat ulang halaman (F5).
  **Harusnya**: tetap gelap. Kembalikan ke **Terang** atau **Sistem**.
- [ ] **2.4** Perkecil jendela Chrome selebar HP (atau buka admin dari HP lewat ALAMAT-HP).
  **Harusnya**: menu kiri berubah jadi tombol garis tiga; tabel tampil sebagai kartu; jendela isian
  muncul dari bawah layar.

## Bagian 3. Acara

- [ ] **3.1** Menu **Acara**.
  **Harusnya**: saat masih kosong hanya ada **satu** tombol, **Tambah acara pertama**.
- [ ] **3.2** Klik **Tambah acara pertama**. Isi **Nama acara** `Akad Nikah`, **Tanggal**
  `21 Mei 2027` (tanpa jam; jam datang diatur di Kelompok), **Nama tempat** `Masjid Al-Ikhlas`,
  **Alamat** `Jl. Mawar No. 1, Surabaya`. Untuk **Link Google Maps**: buka Google Maps di HP/laptop,
  cari tempatnya, tekan **Bagikan → Salin link**, lalu tempel di kolom ini.
  **Harusnya**: **RSVP** dan **Check-in QR** sudah menyala. Matikan keduanya (akad tidak memakainya),
  lalu **Simpan**.
- [ ] **3.3** Di kartu Akad Nikah, klik **peta**.
  **Harusnya**: Google Maps terbuka di lokasi yang Anda salin.
- [ ] **3.4** Klik **Tambah acara** (sekarang muncul di kanan atas). Isi `Resepsi`, tanggal
  `21 Mei 2027`, **Nama tempat** `Gedung Graha Bunga`, **Alamat**, dan **Link Google Maps**.
  **Harusnya**: RSVP dan Check-in QR menyala. Simpan.
- [ ] **3.5** Tambah acara ketiga `Ngunduh Mantu`.
  **Harusnya**: RSVP menyala, tetapi **Check-in QR mati** (sudah dipakai Resepsi; scanner hanya
  melayani satu acara). Batal / hapus acara ini setelahnya.
- [ ] **3.7** **Link Google Maps** diisi `javascript:alert(1)`.
  **Harusnya**: ditolak "Link peta harus diawali http:// atau https://".
- [ ] **3.8** Di kartu Resepsi klik **Pesan** (atau **Pengaturan → Pesan undangan**).
  **Harusnya**: halaman Pesan undangan dengan tombol pilihan acara (Akad Nikah, Resepsi). Isi pesan
  sudah terisi lengkap (salam, nama tamu tebal, acara, 🗓 tanggal, 🕙 jam datang sesuai kelompok
  tamu, 📍 tempat, link,
  penutup, nama mempelai). Di bawahnya pratinjau tab **WhatsApp** (kartu link + teks tebal) dan
  **Instagram** (tanda `*` tampil apa adanya).
- [ ] **3.9** Ubah satu kalimat, **Simpan**, pindah ke Akad Nikah lalu kembali ke Resepsi.
  **Harusnya**: perubahan tersimpan; Akad Nikah tetap memakai pesan bawaan. **Kembalikan ke contoh
  bawaan** mengembalikan isi semula.
- [ ] **3.10** Hapus acara Akad Nikah (menu titik tiga → Hapus).
  **Harusnya**: Akad Nikah juga hilang dari pilihan di Pengaturan → Pesan undangan.

## Bagian 4. Kelompok

- [ ] **4.1** Menu **Kelompok**.
  **Harusnya**: saat kosong hanya ada **satu** tombol, **Tambah kelompok pertama**.
- [ ] **4.2** Tambah `Keluarga`, pilih **Warna**, nyalakan **VIP**. Di **Acara & jam datang**
  semua acara awalnya **Tidak diundang**. Klik **Simpan** tanpa mencentang.
  **Harusnya**: ditolak "Centang minimal satu acara". Centang **Akad Nikah** dan **Resepsi**.
  Pada Resepsi pilih **Jam tertentu**.
  **Harusnya**: jam langsung terisi `09.00`–`11.00` (bukan jam sekarang). Ubah **Mulai** ke `11.00`,
  centang **Sampai selesai**. Akad Nikah biarkan **Jam bebas**. Klik **Simpan**.
- [ ] **4.3** Tambah `Teman Kantor`: centang hanya **Resepsi**, pilih **Jam tertentu**
  `12.00`–`13.00`. Lalu `Teman Kuliah`: centang hanya **Resepsi**, biarkan **Jam bebas**.
  **Harusnya**: tiap kelompok tampil sebagai kartu berwarna. Kartu Keluarga: Akad Nikah "Jam
  bebas" dan Resepsi "11.00 – sampai selesai"; Teman Kantor hanya Resepsi "12.00–13.00";
  Teman Kuliah hanya Resepsi "Jam bebas".
- [ ] **4.4** Coba **Jam tertentu** tanpa mengisi jam, atau jam selesai sebelum jam mulai.
  **Harusnya**: ditolak dengan pesan jelas.
- [ ] **4.5** Ubah tanggal Resepsi di menu Acara menjadi 22 Mei, lalu buka lagi Keluarga.
  **Harusnya**: jam datangnya tetap 11.00 (ikut pindah ke tanggal baru).
- [ ] **4.6** (Setelah Bagian 5) Hapus kelompok yang masih dipakai tamu.
  **Harusnya**: diminta memilih kelompok tujuan untuk tamunya; tidak ada pilihan "Tanpa kelompok".
  Batalkan.
- [ ] **4.7** (Setelah Bagian 5) Buka `Teman Kuliah`, centang **Akad Nikah**.
  **Harusnya**: muncul keterangan "1 tamu kelompok ini ikut diundang ke Akad Nikah". Simpan, lalu
  cek Sari di menu Tamu: kini diundang Akad + Resepsi. Kembalikan (lepas centang Akad, Simpan).

## Bagian 5. Tamu

- [ ] **5.1** Menu **Tamu**. **Harusnya**: saat kosong hanya ada **satu** tombol, **Tambah tamu
  pertama** (plus tautan kecil impor). Bila belum ada kelompok, yang tampil justru ajakan **Buat
  kelompok** (tamu wajib berkelompok). Klik **Tambah tamu pertama**. Isi hanya **Nama undangan** `Bpk. Budi Santoso`, klik
  **Simpan**.
  **Harusnya**: ditolak "Isi nomor HP atau Instagram".
- [ ] **5.2** Lengkapi tamu A: **Nomor HP / WhatsApp** `0812 3456 7801`. Klik **Simpan** tanpa
  memilih kelompok. **Harusnya**: ditolak "Pilih kelompok". Pilih **Kelompok** `Keluarga`.
  **Harusnya**: di bawahnya tertulis "Diundang ke Akad Nikah, Resepsi (mengikuti kelompok)"; tidak
  ada pilihan "Tanpa kelompok" dan tidak ada centang acara. Klik **Simpan**. **Harusnya**: tersimpan dan jendela tertutup. Klik **Tambah** lagi.
- [ ] **5.3** Tamu B: **Nama undangan** `Sari Lestari`, **Instagram** `sarilestari` (tanpa @),
  kelompok `Teman Kuliah`. **Harusnya**: tertulis "Diundang ke Resepsi". **Simpan**, lalu
  **Tambah** lagi.
- [ ] **5.4** Tamu C: `Keluarga Bpk. Joko`, HP `0812 3456 7803`, kelompok `Teman Kantor`, nyalakan
  **Rombongan**, **Catatan untuk penjaga** `Bawa kursi roda`. **Simpan**, lalu **Tambah** lagi.
- [ ] **5.5** Tamu D: `Dewi Anggraini`, HP `0812 3456 7801` (sengaja sama dengan Budi).
  **Harusnya**: muncul peringatan nomor ini sudah dipakai tamu lain. Ganti jadi `0812 3456 7804`,
  kelompok `Teman Kantor`, klik **Simpan**.
- [ ] **5.6** **Harusnya**: daftar berisi 4 tamu, masing-masing punya **kode 6 huruf/angka**. Catat
  kode keempatnya (disebut KODE-A, KODE-B, KODE-C, KODE-D).
- [ ] **5.7** Ketik `sari` di kotak cari. **Harusnya**: hanya Sari yang tampil. Coba juga filter
  kelompok dan acara.
- [ ] **5.8** Pada tamu A klik tombol **QR** (di HP: **⋯** → **QR tiket**). Klik **Unduh PNG**. Ulangi untuk tamu B dan C.
  **Harusnya**: tiga gambar QR tersimpan di laptop. Gambar ini dipindai HP penjaga di Bagian 9
  (buka di layar laptop, atau cetak).
- [ ] **5.9** Klik **Kirim** pada tamu A.
  **Harusnya**: WhatsApp Web/aplikasi terbuka dengan pesan berisi link `.../u/KODE-A`. Kembali ke
  admin dan tandai terkirim; status tamu berubah "Sudah dikirim". Coba juga **Salin tautan** dan
  **Salin pesan**.
- [ ] **5.9b** Centang tamu B dan D, klik **Pindah kelompok** → `Keluarga` → **Pindahkan**.
  **Harusnya**: keduanya kini diundang Akad + Resepsi. Kembalikan: B ke `Teman Kuliah`, D ke
  `Teman Kantor`.
- [ ] **5.10** Hapus tamu D. **Harusnya**: hilang dari daftar. Buka filter **Tempat sampah**, klik
  **Pulihkan**: tamu D kembali.
- [ ] **5.11** Klik **⋯** di kanan atas → **Cetak kartu QR**. **Harusnya**: tampilan daftar tamu siap cetak (tekan Ctrl+P untuk
  melihat pratinjau cetak).

### Impor dan ekspor Excel

- [ ] **5.12** **Tamu** → **⋯** di kanan atas → **Impor dari spreadsheet** → **Unduh template
  Excel**. Buka `template-tamu.xlsx` di Excel atau Google Sheets.
  **Harusnya**: judul kolom tebal dan tetap terlihat saat digulir; kolom **kelompok** berupa
  dropdown berisi kelompok yang ada (Keluarga, Teman Kantor, Teman Kuliah), kolom **rombongan**
  dropdown ya/tidak. Baris 2–6 berisi 5 contoh dengan kelompok Anda. Coba ketik
  `Teman Arisan` di kolom kelompok: **Harusnya** ditolak.
- [ ] **5.13** Biarkan 5 baris contoh, lalu di bawahnya isi 4 baris (kelompok dan rombongan dipilih
  dari dropdown):

  | nama_undangan | hp | instagram | kelompok | rombongan | catatan_penjaga |
  |---|---|---|---|---|---|
  | Andi Wijaya | 081234567811 | | Teman Kantor | tidak | |
  | Rina Kusuma | | rinakusuma | Teman Kuliah | tidak | |
  | Budi Santoso | 081234567801 | | Keluarga | tidak | |
  | Tanpa Kontak | | | | tidak | |

  **Harusnya**: nomor `081234567811` tetap diawali 0 (tidak berubah jadi angka). Simpan (tetap
  .xlsx). Tidak ada kolom acara: acara yang diundang mengikuti kelompok.
- [ ] **5.14** Di halaman impor klik **Pilih berkas Excel** → pilih berkas itu.
  **Harusnya**: 5 baris contoh tidak muncul (dilewati); pratinjau menandai Andi dan Rina **baik**,
  Budi **duplikat** (nomor sama dengan tamu A), dan "Tanpa Kontak" **bermasalah** (tanpa kontak dan
  tanpa kelompok). Klik **Impor**.
  **Harusnya**: 2 tamu masuk (duplikat dilewati). Andi diundang hanya Resepsi (acara Teman Kantor).
- [ ] **5.15** **⋯** → **Ekspor Excel**, buka berkasnya.
  **Harusnya**: semua tamu ada, beserta kode, acara, dan link; HP tidak berubah jadi angka; kolom
  kelompok juga berupa dropdown, jadi berkas ini bisa diperbaiki lalu diimpor lagi.

## Bagian 6. Isi undangan

Menu **Isi undangan** punya beberapa tab. Untuk foto, siapkan 3–5 foto dari HP/kamera (JPG).

- [ ] **6.1** **Mempelai**: untuk pria dan wanita isi **Nama lengkap**, **Nama panggilan**
  (`Ramli`, `Hasri`), **Orang tua** (`Putra Bpk. Ngatmari & Ibu ...`), **Instagram**, **Perkenalan
  singkat**, dan unggah **Foto**. Simpan.
  **Harusnya**: foto tampil tajam, tidak buram.
- [ ] **6.2** Coba unggah file yang bukan gambar (mis. PDF) sebagai foto.
  **Harusnya**: ditolak dengan pesan yang jelas.
- [ ] **6.3** **Cerita**: tambah 2 cerita (**Waktu** `2019`, **Judul** `Pertama bertemu`, **Cerita**
  2–3 kalimat, **Foto**). Ubah urutannya dengan tombol naik/turun.
- [ ] **6.4** **Galeri**: unggah 3 foto, isi **Keterangan**, geser urutannya.
- [ ] **6.5** **Amplop**: tambah rekening (jenis bank, nomor `1234567890`, **Atas nama**
  `Hasri Wiji Aqsari`), opsional **Gambar QR (QRIS)**.
- [ ] **6.6** **FAQ**: **Pertanyaan** `Apakah ada dress code?`, **Jawaban** `Batik atau pakaian
  rapi.` Tambah satu lagi, ubah urutan, hapus satu.
- [ ] **6.7** **Wishlist**: **Nama hadiah** `Rice cooker`, **Jumlah dibutuhkan** `2`, **Tautan toko**
  `javascript:alert(1)`.
  **Harusnya**: tautan ditolak. Ganti dengan `https://tokopedia.com/...`, simpan.
- [ ] **6.8** **Susunan**: unggah **Foto sampul**, isi **Kalimat pembuka**, **Tautan siaran**
  `https://youtube.com/live/contoh`. Coba sembunyikan satu bagian dan ubah urutan.
- [ ] **6.9** **Ucapan**: (masih kosong karena halaman tamu belum tersambung). Lewati dulu.

## Bagian 7. Halaman tamu: dilewati dulu

Halaman `/u/KODE/undangan` masih statis (isi contoh), jadi belum diuji. Fokus uji sekarang pada admin,
HP penjaga, dan photobooth. Bagian ini akan diisi setelah halaman tamu tersambung ke data.

## Bagian 8. RSVP (dicatat dari admin)

- [ ] **8.1** Menu **RSVP**, pilih acara **Resepsi**.
  **Harusnya**: semua tamu Resepsi tampil "Belum menjawab".
- [ ] **8.2** Pada Budi klik **Catat jawaban** → **Hadir**. Pada Keluarga Bpk. Joko → **Hadir**,
  **Jumlah orang yang hadir** `4`. Pada Sari → **Tidak hadir**. Pada Dewi → **Belum pasti**.
  **Harusnya**: ringkasan di atas: Hadir 2 (5 orang), Tidak hadir 1, Belum pasti 1.
- [ ] **8.3** Pada tamu yang belum menjawab, klik **Kirim pengingat**.
  **Harusnya**: WhatsApp terbuka dengan pesan pengingat; tamu bisa ditandai sudah diingatkan, dan
  pilihan **Sembunyikan yang sudah diingatkan** menyembunyikannya.

## Bagian 9. HP penjaga pintu (scanner)

Pakai **HP A** dan **HP B**. Semua dibuka lewat ALAMAT-HP.

### Memasangkan HP

- [ ] **9.1** Di laptop: menu **Perangkat** → **Tambah perangkat**, **Nama perangkat**
  `HP Gerbang A`, Simpan.
  **Harusnya**: muncul **kode pairing 8 karakter** (mis. `K7M2-9QXA`) dan status **Belum dipasang**.
- [ ] **9.2** Di HP A buka `ALAMAT-HP/scan/pasang`, ketik kode itu di **Kode pairing**, tekan
  **Pasangkan**.
  **Harusnya**: masuk ke layar scanner; di laptop status HP Gerbang A menjadi **Aktif**.
- [ ] **9.3** Di HP B, buka `/scan/pasang` dan ketik **kode yang sama**.
  **Harusnya**: ditolak (kode hanya sekali pakai). Di laptop buat perangkat `HP Gerbang B`, pakai kode
  barunya di HP B: berhasil.
- [ ] **9.4** Di kedua HP, buka **Uji kesiapan** (ikon di layar scanner, atau `/scan/siap`), izinkan
  kamera.
  **Harusnya**: daftar pemeriksaan (Kamera, Pembaca QR, Penyimpanan permanen, Jam perangkat, Server
  terjangkau, Daftar tamu di perangkat, Aplikasi tersimpan untuk offline) sebagian besar hijau.
  "Aplikasi tersimpan untuk offline" baru hijau di Bagian 10.

### Check-in

- [ ] **9.5** Di HP A arahkan kamera ke **QR tamu A** (gambar PNG dari langkah 5.8, dibuka di layar
  laptop atau dicetak).
  **Harusnya**: layar hijau, nama **Bpk. Budi Santoso**, kelompok **Keluarga (VIP)**, 1 orang. Tekan
  **Lanjut scan**.
- [ ] **9.6** Pindai QR yang sama lagi (di HP A atau HP B setelah sinkron beberapa detik).
  **Harusnya**: peringatan **sudah masuk**, dengan jam dan nama perangkat yang mencatat pertama.
- [ ] **9.7** Pindai **tamu C (rombongan)**.
  **Harusnya**: diminta **jumlah orang** dulu. Tekan + sampai `5`, simpan. Catatan penjaga "Bawa kursi
  roda" tampil.
- [ ] **9.8** Di kotak **Nama tamu atau kode**, ketik `dewi`, pilih Dewi, **Catat masuk**.
  **Harusnya**: tercatat. Coba juga ketik KODE-B langsung.
- [ ] **9.9** Segera (kurang dari 2 menit) pada Dewi tekan **Batalkan check-in**.
  **Harusnya**: batal; Dewi bisa dicatat lagi. Catat lagi Dewi.
- [ ] **9.10** Tunggu lebih dari 2 menit, lalu coba batalkan check-in Budi.
  **Harusnya**: ditolak "Batas waktu koreksi (2 menit) sudah lewat. Minta admin."
- [ ] **9.11** Tekan **Tamu baru (tidak di daftar)**: **Nama** `Pak Tetangga`, **Jumlah orang** `2`,
  **Nomor HP (opsional)** kosong, Simpan.
  **Harusnya**: langsung tercatat masuk. Beberapa detik kemudian di laptop menu **Tamu** ada
  `Pak Tetangga` dengan kode baru.
- [ ] **9.12** Arahkan kamera ke QR sembarang (mis. QR di bungkus makanan).
  **Harusnya**: "Kode tidak dikenal".
- [ ] **9.13** Laptop: menu **Check-in**.
  **Harusnya**: angka tamu masuk dan orang hadir sesuai (Budi 1, Joko 5, Dewi 1, Pak Tetangga 2 =
  4 tamu, 9 orang), dan log berisi semua catatan.

## Bagian 10. Uji tanpa internet (paling penting untuk hari-H)

Mode tanpa internet hanya jalan di versi siap-pakai. Di laptop, terminal ketiga: tekan `Ctrl+C`, lalu
ketik `pnpm build` dan setelah selesai `pnpm --filter @wedding/web exec vite preview`. Jalankan ulang
`cloudflared tunnel --url http://localhost:4173` (perhatikan **4173**), dapatkan ALAMAT-HP baru, lalu
pasangkan ulang kedua HP (Bagian 9.1–9.2) lewat alamat baru.

- [ ] **10.1** Buka scanner di kedua HP sekali saat online, tunggu 10 detik. Buka **Uji kesiapan**.
  **Harusnya**: "Aplikasi tersimpan untuk offline" hijau.
- [ ] **10.2** Nyalakan **mode pesawat** di HP A. Pindai Sari (KODE-B) dan satu tamu impor (Andi).
  **Harusnya**: tetap hijau dan cepat. Ringkasan menunjukkan **Antrean kirim 2**.
- [ ] **10.3** Tutup aplikasi di HP A sepenuhnya, buka lagi (masih mode pesawat).
  **Harusnya**: scanner tetap terbuka dan antrean masih 2.
- [ ] **10.4** Matikan mode pesawat.
  **Harusnya**: dalam beberapa detik antrean jadi 0; di laptop menu Check-in angkanya bertambah.
- [ ] **10.5** **Tamu dobel**: nyalakan mode pesawat di **kedua** HP. Pindai **Rina** di HP A, lalu
  Rina juga di HP B. Matikan mode pesawat di keduanya.
  **Harusnya**: laptop → **Check-in** menampilkan Rina di antrean **perlu diperiksa** (dobel).
  Selesaikan (pilih salah satu); antrean kosong.
- [ ] **10.6** **Perangkat dicabut**: nyalakan mode pesawat di HP B, pindai satu tamu yang belum masuk
  (mis. tamu impor lain atau buat tamu baru dulu). Di laptop, **Perangkat → HP Gerbang B → Cabut**.
  Matikan mode pesawat di HP B.
  **Harusnya**: HP B menampilkan bahwa perangkat dicabut; tamu yang dipindai belum sampai server.
- [ ] **10.7** Di laptop **Buat kode baru** untuk HP Gerbang B (atau tambah perangkat baru), pasangkan
  lagi HP B dengan kode itu.
  **Harusnya**: check-in dari langkah 10.6 **tetap terkirim** (tidak hilang), terlihat di menu
  Check-in.
- [ ] **10.8** Di HP A nyalakan mode pesawat, pindai satu tamu, lalu buka `/scan/pasang` dan tekan
  **Lepas perangkat ini**.
  **Harusnya**: ditolak "Masih ada 1 check-in yang belum terkirim...". Matikan mode pesawat, tunggu
  antrean 0, baru boleh dilepas.

## Bagian 11. Photobooth (laptop + kamera + printer)

### Menyiapkan alat

- [ ] **11.1** Kamera X-A7: **cabut kabel USB dulu**. Tekan **MENU/OK** → tab **SET UP** (ikon kunci)
  → **CONNECTION SETTING** → **USB MODE** → **USB WEBCAM**. Colok kabel ke laptop.
  **Harusnya**: layar kamera tetap menampilkan gambar (tidak berubah jadi tulisan "USB"). Di terminal
  `v4l2-ctl --list-devices` menampilkan "FUJIFILM X-A7".
- [ ] **11.2** Printer L3110: pasang kertas foto 4R glossy. Di pengaturan printer laptop jadikan
  bawaan: ukuran **4R / 4x6 tanpa tepi (borderless)**, jenis kertas **glossy/photo**.
- [ ] **11.3** Tutup Chrome sepenuhnya, lalu jalankan dari terminal:
  `google-chrome --kiosk --kiosk-printing http://localhost:4173/booth/pasang`
  (versi siap-pakai dari Bagian 10; untuk keluar dari layar penuh tekan `Alt+F4`).

### Memasangkan booth

- [ ] **11.4** Laptop (di jendela Chrome biasa): **Perangkat → Tambah perangkat**, nama
  `Laptop Booth`. Ketik kodenya di layar booth **Pasang photobooth**, tekan **Pasangkan**.
  **Harusnya**: layar booth "JADILAH PEMERAN MALAM INI" dengan pratinjau kamera di dalam bingkai.
  Izinkan kamera bila ditanya.
- [ ] **11.5** Klik tulisan kecil **PETUGAS** di pojok kanan bawah.
  **Harusnya**: **KAMERA** memilih FUJIFILM X-A7, "Resolusi kamera: 1280×720". Tutup dengan **Esc**.

### Memotret dan mencetak

- [ ] **11.6** Di admin (jendela lain): **Photobooth** → matikan bingkai **Film strip**.
  **Harusnya**: dalam ±15 detik pilihan bingkai di booth tinggal Poster film dan Tiket bioskop.
- [ ] **11.7** Pilih bingkai **Tiket bioskop**, tekan **AMBIL FOTO** (atau Spasi).
  **Harusnya**: hitung mundur 3-2-1, kilat putih, bunyi rana, lalu layar "CETAK FOTO INI?".
- [ ] **11.8** Tekan **ULANGI**.
  **Harusnya**: kembali ke layar awal, foto dibuang.
- [ ] **11.9** Foto lagi, lalu jangan sentuh apa pun selama 20 detik.
  **Harusnya**: kembali ke layar awal sendiri, foto tidak dicetak (tetap tersimpan di laptop).
- [ ] **11.10** Foto lagi, tekan **CETAK** dua kali cepat-cepat.
  **Harusnya**: layar "SEDANG DICETAK", printer mengeluarkan **hanya satu** lembar 4R **tanpa tepi
  putih** dan tanpa lembar kosong tambahan; nomor foto di tiket tercetak.
- [ ] **11.11** Cabut kabel USB kamera.
  **Harusnya**: muncul pesan "Kamera terputus...", tombol foto tidak bisa ditekan. Colok lagi:
  pratinjau kembali sendiri dalam beberapa detik.
- [ ] **11.12** Matikan Wi-Fi laptop, ambil 2 foto.
  **Harusnya**: pojok kiri atas "● OFFLINE · 2 FOTO MENUNGGU UNGGAH". Nyalakan Wi-Fi: berubah jadi
  "SEMUA TERUNGGAH".
- [ ] **11.13** Admin → **Photobooth**.
  **Harusnya**: foto-foto muncul di **Foto masuk**. **Unduh semua (ZIP)** menghasilkan file berisi
  semua foto.
- [ ] **11.14** PETUGAS → **Cetak ulang** salah satu foto: tercetak lagi, "dicetak 2×".
- [ ] **11.15** Matikan Wi-Fi, ambil 1 foto, PETUGAS → **Lepas perangkat ini** → **Ya, lepas**.
  **Harusnya**: ditolak karena masih ada foto yang belum terunggah. Nyalakan Wi-Fi lagi.
- [ ] **11.16** Biarkan booth menyala 2 jam dengan kamera memakai dummy battery/adaptor listrik.
  **Harusnya**: kamera tidak mati, layar laptop tidak tidur.

## Bagian 12. Keuangan

- [ ] **12.1** Menu **Hadiah** → **Catat hadiah**: pilih jenis amplop, **Cari tamu undangan** ketik
  `budi`, pilih Budi, **Nominal** `500.000`, **Tanggal diterima** hari ini. Simpan.
- [ ] **12.2** Catat **barang**: **Nama barang** `Set piring`, pemberi orang yang tidak di daftar tamu
  (isi nama dan **Nomor HP pemberi**).
  **Harusnya**: **Total uang** Rp500.000 dan **Total catatan** 2.
- [ ] **12.3** **Kirim terima kasih** pada Budi (WhatsApp terbuka), lalu **Tandai dibalas**.
  **Harusnya**: hilang dari filter **Belum dibalas**.
- [ ] **12.4** **Ekspor Excel** dan buka berkasnya: rapi, kolom nominal berupa angka (bisa dijumlah dengan SUM).
- [ ] **12.5** Menu **Vendor** → **Tambah kategori umum**.
  **Harusnya**: kategori seperti Katering, Dekorasi, dll. otomatis dibuat.
- [ ] **12.6** Di **Katering**: **Tambah vendor** dua kandidat (`Katering Sedap`, **Harga acuan**
  `45.000.000`; `Katering Nikmat`, `50.000.000`). Pilih `Katering Sedap` sebagai **Vendor terpilih**,
  isi **Nilai kontrak** `45.000.000`.
- [ ] **12.7** Tambah **Pembayaran** DP `15.000.000`, isi **Jatuh tempo berikutnya** 2 minggu lagi dan
  **Nominal jatuh tempo** `15.000.000`.
  **Harusnya**: **Sudah dibayar** 15 jt, **Sisa pembayaran** 30 jt. Memilih `Katering Nikmat`
  melepas pilihan `Katering Sedap` (hanya satu terpilih per kategori).

## Bagian 13. Pengaturan lain

- [ ] **13.1** **Pengaturan → Pratinjau tautan**: judul `Undangan {mempelai}`, deskripsi
  `Untuk {panggilan}, kami mengundang Anda`, unggah gambar. Simpan.
  (Pratinjau di WhatsApp baru bisa dicek setelah dipasang di server/staging.)
- [ ] **13.2** **Ganti sandi**: buka admin di dua browser (mis. Chrome dan Firefox), keduanya login.
  Di Chrome: **Pengaturan → Kata sandi**, isi **Kata sandi saat ini** `RahasiaNikah2027`, **Kata
  sandi baru** dan **Ulangi** `RahasiaNikah2028`. Simpan. Di Firefox klik menu lain.
  **Harusnya**: Firefox otomatis kembali ke halaman masuk.
- [ ] **13.3** **Pengaturan → Cadangan**: unduh **data** (JSON) dan **foto** (ZIP).
  **Harusnya**: kedua file terunduh dan bisa dibuka.

## Bagian 14. Gladi bersih hari-H (H-7, di gedung)

- [ ] **14.1** Di pintu masuk, cek sinyal/Wi-Fi. Jalankan **Uji kesiapan** di semua HP: hijau.
- [ ] **14.2** Ajak 10–20 orang berpura-pura jadi tamu (QR di HP dan QR cetak), termasuk rombongan dan
  satu tamu baru (walk-in).
- [ ] **14.3** Di tengah gladi, matikan internet 10 menit. Check-in tetap jalan; setelah internet
  kembali, semua terkirim.
- [ ] **14.4** Cek baterai HP, powerbank, kecerahan layar, dan posisi HP agar QR mudah dipindai.
- [ ] **14.5** Photobooth: cahaya cukup, jarak orang ke kamera, kertas foto dan tinta cadangan.
- [ ] **14.6** Setelah selesai: angka di menu **Check-in** sama dengan hitungan manual, dan semua foto
  booth sudah terunggah.

---

## Bila menemukan masalah

Tulis seperti ini supaya mudah diperbaiki:

```
Langkah: 10.5
Yang saya lakukan: mode pesawat di dua HP, pindai Rina di keduanya, lalu online
Harusnya: Rina muncul di antrean perlu diperiksa
Yang terjadi: tidak muncul apa-apa
HP: Samsung A54, Chrome
Tangkapan layar: (lampirkan)
```
