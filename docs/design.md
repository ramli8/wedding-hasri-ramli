# Desain admin dan scanner (shadcn-admin)

Acuan: https://shadcn-admin.netlify.app/ (repo satnaing/shadcn-admin). Panel admin (`/admin/*`) dan scanner (`/scan`) memakai kode komponen shadcn-admin yang disalin apa adanya; halaman tamu (`/u/KODE`) punya gaya majalah sendiri di `src/guest.css` dan `src/components/guest-ui/` dan tidak boleh memakai komponen di bawah.

**Aturan utama: jangan menebak kelas dari tangkapan layar.** Buka berkas yang sama di repo acuan (`git clone --depth 1 https://github.com/satnaing/shadcn-admin`) dan salin. Tanpa `@` alias `@/` ke `apps/web/src`.

## Lapisan

| Lapisan | Lokasi | Isi |
| --- | --- | --- |
| Token | `src/styles.css` | variabel oklch dari `theme.css` acuan (terang dan gelap) + `--success`, `--warning` untuk hasil scan; Inter; `tw-animate-css` |
| Komponen asli | `src/components/ui/*` | salinan shadcn-admin (Radix): alert, alert-dialog, avatar, badge, button, card, checkbox, collapsible, command, dialog, dropdown-menu, input, label, popover, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, switch, table, tabs, textarea, tooltip. Dikecualikan dari Biome; jangan diedit selain bila acuannya berubah |
| Layout | `src/components/layout/*`, `app-layout.tsx` | AppSidebar, NavGroup (menu bercabang), NavUser, Header, Main; `sidebar-data.ts` berisi menu |
| Tabel data | `src/components/data-table/*` | salinan acuan (toolbar, faceted-filter, pagination, column-header, view-options, bulk-actions) + `data-table.tsx` (tabel umum), `row-actions.tsx` (menu …), `select-column.tsx` (kotak centang) |
| Adaptor | `src/components/kit/*` | pembungkus tipis agar API lama pemanggil tetap: `Button` (type="button" bawaan), `Select` (Radix, anak `<option>`), `Dialog`, `Checkbox`, `Alert`, `Field`, `Pagination`/`Paged`, `FilterChip`, `FormSection`/`SwitchRow`/`CheckCard` (bagian formulir, baris Switch, kartu centang), `ReorderButtons` |
| Konteks | `src/context/*` | theme, layout (varian sidebar), direction (LTR/RTL), search (⌘K) |

## Layout

Persis `AuthenticatedLayout`: `SidebarProvider` → `AppSidebar` (varian inset, ikon bila diciutkan) + `SidebarInset` berisi `Header` (tombol sidebar, pemisah, `Search`, `ThemeSwitch`, `ConfigDrawer`, `ProfileDropdown`) dan `Main` (`px-4 py-6`). Di bawah 768px sidebar menjadi laci (Sheet). ⌘K membuka `CommandMenu`; ⌘B menciutkan sidebar. Pengaturan Tampilan (tema, gaya sidebar, tata letak, arah) ada di ikon gerigi.

Menu: ubah `navGroups` di `components/layout/sidebar-data.ts` (item biasa atau bercabang). Menu "Isi undangan" dan "Pengaturan" bercabang.

## Pola halaman

- **Judul**: `PageHeader` (h1 `text-2xl font-bold tracking-tight`, deskripsi muted, aksi di kanan; urutan tombol: sekunder dulu, utama terakhir dengan ikon di kanan teks).
- **Dasbor**: `Tabs` (Ringkasan, Perlu dikerjakan, Vendor), kartu statistik (`CardHeader` judul + ikon, `CardContent` angka `text-2xl font-bold`), grafik batang recharts (`BarsChart`) di `lg:col-span-4`, daftar bergaya "Recent Sales" di `lg:col-span-3`.
- **Daftar data**: `DataTable` (kolom kotak centang, header dengan menu urut/sembunyikan, filter faset dengan popover + hitungan, tombol Tampilan, paginasi, bilah aksi massal melayang saat ada baris terpilih, menu `…` per baris). Mode server (daftar tamu, riwayat check-in): lewat `options` (`manualPagination`, `pageCount`, `state`) dan `renderToolbar` + `FacetedFilter` untuk filter di server.
- **Pengaturan**: `SettingsLayout` (judul, garis, `SidebarNav` kiri berupa tombol ghost atau Select di HP) dan `ContentSection` (judul, garis, isi `lg:max-w-xl`). Tiap bagian punya rute: `/admin/pengaturan`, `/sandi`, `/cadangan`, `/tampilan`.
- **Formulir (dialog)**: dibagi `FormSection` (judul + deskripsi), isian dua kolom `sm:grid-cols-2`, opsi hidup-mati lewat `SwitchRow`, pilihan banyak lewat `CheckCard`, tombol `Batal`/`Simpan` di kanan bawah (bertumpuk di HP).
- **Panduan**: `pages/guide-page.tsx` + `lib/guide.ts` (`useGuideSteps`): urutan kerja, apa yang diisi, dan status selesai dihitung dari data; ringkasnya juga muncul di dasbor. Tambahkan langkah baru di `lib/guide.ts`.
- **Isi undangan**: `InvitationLayout` memberi judul, deskripsi, dan keterangan "tampil di bagian mana" untuk tiap sub-halaman (`SECTIONS`).
- **Pratinjau tautan**: `pages/settings/seo-settings.tsx` (kartu pratinjau langsung, penghitung karakter, variabel `{panggilan}` dan `{mempelai}`, gambar via `ImageField`).
- **Scanner (`/scan`)**: tanpa sidebar, tetapi bilah atas sepola Header (logo H&R, nama acara + perangkat, `SyncPill`, suara, `ThemeSwitch`, Uji Kesiapan) dan tema terang/gelap sama dengan admin. Judul "Pintu masuk" (sembunyi di HP dan layar pendek), tiga kartu statistik (`doorSummary` di `lib/scan/actions.ts`: tamu masuk, orang hadir, antrean kirim). HP: tab bawah Pindai/Cari, kamera persegi. Tablet: dua kolom. Laptop (`lg`): kamera 4:3 di kiri setinggi layar, statistik + cari + "Baru masuk" di kanan. Hasil scan (`result-overlay.tsx`): gaya kartu admin di atas latar bertint lembut sesuai hasil (`bg-success/10`, `bg-warning/15`, `bg-destructive/10`; dipertebal di mode gelap); warna utamanya di lingkaran ikon besar dan label status. Di bawah nama: lencana kelompok/rombongan, lalu `Card` untuk catatan penjaga, jumlah orang (−/+), rincian "sudah masuk", atau kode tidak dikenal; tombol `outline` + `default` di dasar layar ("Batalkan check-in" + "Lanjut scan", atau "Cari nama" + "Tutup"). VIP berhasil: latar biru langit (`bg-sky-500/15`, bukan hijau), lingkaran navy dengan kilau emas (dibalik di mode gelap), lencana "TAMU VIP" + lencana hijau "Silakan masuk", tutup otomatis 6 detik dan bunyi do-mi-sol. Prompt rombongan bergaya sama tanpa tint. Satu kolom di HP tegak, dua kolom (identitas kiri, rincian + tombol kanan) mulai `md` dan di layar pendek (varian `short:`, tinggi ≤ 500px, mis. HP mendatar) dengan ukuran ringkas; sisa waktu tutup otomatis tampil sebagai garis yang menyusut di tombol utama.
- **Auth** (`pages/login.tsx`): tanpa sidebar, satu kartu formulir di tengah (`grid min-h-svh place-items-center`, `max-w-sm`), logo + nama di atasnya, tema mengikuti pilihan admin (`ThemeProvider`), kolom sandi dengan tombol mata 44px, dan di bawah kartu tombol outline "Masuk ke scanner pintu" ke `/scan` untuk penjaga pintu.
- **Pasang scanner** (`pages/scan/pair-page.tsx`): pola yang sama dengan Auth (kartu di tengah). Belum terpasang: kolom kode pairing besar `XXXX-XXXX`, tombol Pasangkan, tiga langkah singkat. Sudah terpasang: nama perangkat, Buka scanner, dan "Lepas perangkat ini" dengan konfirmasi dua langkah. Di bawah kartu tombol "Masuk sebagai admin".
- **Galat**: `pages/error-page.tsx` (404, 500; rute `/401`, `/403`, `/404`, `/500`, `/503`).

## Aturan pemakaian

- Pakai token semantik (`bg-card`, `text-muted-foreground`, `border`, `bg-destructive`); hasil scan memakai `bg-success`, `bg-warning`, `bg-destructive`.
- Tombol: `variant` `default`, `outline`, `ghost`, `destructive`, `link`; ukuran `default`, `sm`, `icon`. Satu tombol default per area.
- Tabel baru: buat `ColumnDef`, pakai `DataTable`; jangan menulis `<table>` sendiri.
- Di HP `DataTable` otomatis menjadi kartu (kelas `table-cards` di `styles.css`): label tiap sel diambil dari teks judul kolom, kolom berjudul pertama jadi judul kartu, kotak centang dan kolom aksi terakhir di baris atas. Ubah perannya lewat `meta.card` (`title`, `field`, `actions`, `select`, `hidden`).
- Formulir dalam `Dialog` (kit): baris tombol terakhir yang berisi tombol submit menempel di dasar lembar HP (CSS, tanpa kode per halaman). Menutup dialog lewat ketuk luar/Esc/X saat isian sudah berubah menanyakan "Buang perubahan?".
- Setiap `useMutation` yang berhasil menampilkan "Tersimpan" (Toaster di AppLayout, `MutationCache` di `main.tsx`); ganti dengan `meta: { toast: "Terhapus" }` atau matikan dengan `meta: { toast: false }`.
- Tombol dan isian minimal 44px di HP lewat CSS global (`[data-slot=button]`, `input`, `select-trigger`, `textarea`).
- Formulir: `FormFooter` (Batal + Simpan saja; "Simpan & tambah lagi" ditolak pemilik). Semua baris tombol dialog memakai `DialogActions` (kit/dialog.tsx): satu baris juga di HP (aksi utama melebar di kanan), menempel di dasar lembar, dan diberi bayangan + isian memudar selama masih ada isian di bawahnya (`data-more`). Setelah Simpan, galat pertama yang muncul (`data-form-error` dari `Field error`/`Alert tone="error"`) digulir ke tengah dan kolomnya difokuskan; jangan membuat baris tombol dialog sendiri. `Field required` untuk kolom wajib dan `error` untuk pesan di bawah kolom; `MoneyInput` untuk rupiah (pemisah ribuan saat mengetik, papan angka).
- Chip variabel templat pesan: `components/kit/variable-chips.tsx` (`useCaretInsert` + `VariableChips`) menyisipkan di posisi kursor.
- Pairing perangkat: dialog kode menampilkan QR tautan `/scan/pasang?kode=XXXX-XXXX`; halaman pasang mengisi kodenya dari tautan.
- Teks UI berbahasa Indonesia; kelas tinggi sentuh 44px di HP (`max-md:h-11`) ditambahkan di adaptor, bukan di berkas `ui/`.
- Tipe rute TanStack bersifat ketat: untuk tautan dari data gunakan `to={url as "/admin"}`.
