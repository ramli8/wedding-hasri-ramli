# Panduan Sistem Desain (Design System) & UI/UX

Dokumen ini adalah referensi utama untuk memastikan konsistensi desain UI/UX di seluruh aplikasi. Desain ini diadaptasi dari halaman referensi: `/auth/login`, `/admin`, `/admin/kondangan`, `/admin/tamu`, `/admin/guests`, dan `/settings/profile`.

## 1. Filosofi Utama
- **Mobile-First & App-Like Feel**: Tampilan harus terasa seperti aplikasi native mobile (iOS/Android) meskipun diakses lewat web.
- **Clean & Modern**: Penggunaan ruang kosong (*whitespace*), *rounded corners* besar, dan warna yang *subtle*.
- **Interaktif**: Selalu gunakan efek transisi seperti `active:scale-95`, `hover:bg-...`, dan animasi masuk (*slide-in*).

---

## 2. Tipografi (Typography)
Aplikasi ini menggunakan sistem font sans-serif dengan penyesuaian ukuran (*text-size*) dan jarak huruf (*tracking*) yang spesifik:

- **Judul Halaman / Modal Header**: `text-[17px] font-bold tracking-tight` (Kesan rapi dan padat).
- **Label Kecil / Kategori**: `text-[10px]` atau `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` (Mudah dibaca namun tidak mendominasi).
- **Teks Reguler (Body / Konten Input)**: `text-[13px]` atau `text-[14px] font-medium`.
- **Teks Tombol / Aksi**: `text-[13px] font-bold`.

---

## 3. Komponen Modal (Dialogs / Bottom Sheets)
*Penting: Hindari penggunaan pop-up standar di tengah layar (kecuali untuk konfirmasi hapus). Gunakan gaya Bottom Sheet untuk formulir, filter, dan detail.*

**Struktur Bottom Sheet Utama:**
```tsx
<div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
  {/* Overlay */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={...}></div>
  
  {/* Content Wrapper */}
  <div className="relative bg-background rounded-[2rem] w-full max-w-[600px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
    
    {/* Header */}
    <div className="flex items-center justify-between mb-5 shrink-0 relative">
      <h2 className="text-[17px] font-bold w-full text-center tracking-tight">Judul Modal</h2>
      <button className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors active:scale-95">
        <X className="w-4 h-4" />
      </button>
    </div>
    
    {/* Body / Scrollable Content */}
    <div className="flex flex-col gap-4 py-1 flex-1 overflow-y-auto no-scrollbar">...</div>
    
    {/* Footer / Action */}
    <div className="pt-3 shrink-0 mt-3 flex border-t border-border/40">...</div>
  </div>
</div>
```

---

## 4. Modal Konfirmasi (AlertDialog - iOS Style)
Untuk aksi kritis (seperti menghapus data), gunakan gaya pop-up tengah layar dengan tata letak tombol *stack* vertikal seperti iOS.

**Struktur AlertDialog:**
- **Container**: `w-[80vw] max-w-[300px] p-0 rounded-2xl overflow-hidden gap-0 bg-background/90 backdrop-blur-xl border border-border/50 shadow-2xl`
- **Header**: Padding `p-5 pb-4 text-center`.
- **Title**: `text-[17px] font-semibold text-center tracking-tight`.
- **Deskripsi**: `text-[13px] text-muted-foreground leading-snug`.
- **Container Tombol**: `flex flex-col border-t border-border/50`.
- **Tombol Aksi (Hapus/Merah)**: `w-full h-[46px] bg-transparent hover:bg-destructive/10 text-destructive font-semibold rounded-none border-b border-border/50`.
- **Tombol Batal**: `w-full h-[46px] bg-transparent hover:bg-muted/50 text-foreground font-medium rounded-none border-0 m-0`.

---

## 5. Formulir (Forms) & Input
Formulir di dalam *bottom sheet* didesain agar ramah sentuhan (*touch-friendly*).

- **Label Field**: `text-[12px] font-semibold text-muted-foreground ml-1 mb-1.5`.
- **Input / Select / Textarea**:
  - Base class: `bg-muted/50 border-transparent rounded-xl px-4 focus-visible:ring-primary focus-visible:bg-background transition-colors`.
  - Tinggi Input/Select: `h-12 text-[14px]`.
  - Tinggi Textarea: `min-h-[100px] py-3`.
- **Placeholder vs Default**: Jika opsi pertama dari `Select` dapat dipilih otomatis, jadikan sebagai *default value* (tidak perlu memakai *placeholder* usang seperti "Pilih Relasi").

---

## 6. Tombol (Buttons)
Setiap tombol aksi wajib menyertakan kelas animasi `active:scale-95 transition-all` agar terasa responsif saat ditekan.

- **Primary Button (Aksi Utama)**: `h-12 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold`.
- **Secondary Button (Batal / Aksi Sekunder)**: `h-12 bg-muted text-foreground rounded-xl text-[13px] font-bold`.
- **Ghost/Tertiary Button**: `bg-primary/10 text-primary font-bold`.
- **Floating Action Button (FAB) untuk aksi "Tambah"**:
  ```tsx
  <button className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg flex items-center justify-center hover:bg-primary/90 hover:-translate-y-1 transition-all active:scale-95">
    <Plus className="w-6 h-6" />
  </button>
  ```

---

## 7. Sistem Sorting & Filtering
Sorting dan Filtering diletakkan pada Modal Bottom Sheet terpisah, bukan dalam *dropdown menu* biasa.

- **Item Pilihan Aktif**: Diberi penanda `Check` di sisi kanan dan mengubah warna/teks (misal: tombol filter aktif menjadi `bg-primary text-primary-foreground`).
- **Urutan (Sorting) Default**: Selalu posisikan data "Terbaru" sebagai kondisi awal/default (berikan *highlight* atau warna primer pada state/ikon).

---

## 8. Toast Notification (Notifikasi)
Semua pesan sukses, gagal, atau info harus menggunakan **`react-hot-toast`**. Hindari penggunaan Sonner atau modul lain agar konsisten.
- Sukses: `toast.success("Data berhasil disimpan")`
- Gagal: `toast.error("Gagal menghapus data")`

---

## 9. Elemen List & Kartu (Cards)
Saat menampilkan baris data pada tabel/daftar:
- Gunakan kontainer bergaya kartu: `bg-muted/30 p-4 rounded-2xl border border-border/50`.
- Jika baris diklik atau di-*hover*, tambahkan `hover:bg-muted/50 transition-colors`.
- Untuk tag status (Badge), gunakan proporsional warna (misal, `bg-emerald-500/10 text-emerald-600` untuk *Valid* / *Hadir*, dan `bg-destructive/10 text-destructive` untuk *Error* / *Batal*).

---

## 10. Header, Navigasi & Tabs
Bagian atas halaman (*Header*) harus bergaya *sticky* dengan efek transparan kabur (*backdrop blur*).
- **Header Utama**: `sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 py-4`.
- **Tombol Kembali (Back)**: Berbentuk bulat (`w-10 h-10 rounded-full bg-muted/50`).
- **Tab Layout (Pill-style)**: Gunakan desain "pill" (kapsul) alih-alih tab konvensional bergaris.
  ```tsx
  <div className="flex bg-muted/50 p-1.5 rounded-2xl">
    <button className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
      Tab Aktif
    </button>
  </div>
  ```

---

## 11. Empty State (Data Kosong) & Loading
Pastikan selalu ada umpan balik visual ketika data sedang dimuat atau tidak ada data.
- **Empty State**: Tampilkan sebuah ikon besar (contoh: `Inbox` dari lucide-react) dengan `opacity-20` atau `text-muted-foreground/30` beserta teks penjelas.
  ```tsx
  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <Inbox className="w-12 h-12 mb-3 opacity-20" />
    <p className="text-[13px] font-medium">Belum ada data tersedia.</p>
  </div>
  ```
- **Loading State**: Gunakan ikon `Loader2` dari lucide-react dengan tambahan class `animate-spin` alih-alih teks "Loading...".

---

## 12. Pagination (Pemuatan Data Berlanjut)
Untuk menjaga kesan aplikasi mobile yang natural dan mencegah layar berkedip/meloncat ke atas, jangan gunakan penomoran halaman statis (1, 2, 3) pada list data utama.
- Gunakan logika penambahan batas jumlah (*page_size* increment).
- Gunakan tombol **"Tampilkan Lebih Banyak"**.
- Di area *TanStack Query*, pastikan menggunakan parameter `placeholderData: keepPreviousData` (atau sejenisnya, sesuai versi) untuk mencegah state loading menimpa data lama yang sedang tampil.

---

## 13. Ikonografi (Iconography)
- Gunakan ikon dari pustaka **`lucide-react`**.
- Ukuran ikon standar:
  - Di dalam tombol reguler: `w-4 h-4` (disertai `gap-1.5` ke teks).
  - Di tombol Header/FAB: `w-5 h-5` atau `w-6 h-6`.
  - Di informasi/list *dense*: `w-3.5 h-3.5`.
- Jika memakai SVG kustom (seperti logo WA), gunakan struktur props yang sama dengan lucide agar warna dan ukurannya mudah diubah via class `w-... h-... text-...`.

---

Dengan mengikuti pedoman ini, pembuatan fitur baru maupun perbaikan desain ke depannya dapat langsung berbaur sempurna dengan ekosistem antarmuka yang ada.
