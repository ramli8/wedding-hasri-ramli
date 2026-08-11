# ADR 0002 — Framer Motion untuk Photo Stack Cover

- **Status:** Accepted
- **Date:** 2026-08-11
- **Decision makers:** Hasri & Ramli (via diskusi)

## Context

Cover undangan awalnya memakai satu foto berbingkai (art plate) yang terasa "kurang hidup":
banyak ruang kosong, dan user meminta cover lebih interaktif. Referensi dari 21st.dev
(Image Stack, id 8018) menawarkan pola **drag-to-cycle fan-out card** yang mengisi ruang
dan memberi kesan "canggih". Komponen tersebut dibangun di atas Framer Motion.

Konvensi `wedding-convention` menetapkan animasi/motion memakai **Lenis + CSS** dan tidak
mengizinkan library animation lain. User secara eksplisit meminta pola drag dari 21st.dev.

## Keputusan

1. Install **`framer-motion`** (v13) sebagai satu-satunya pengecualian di modul undangan
   untuk cover photo stack.
2. Adaptasi Image Stack 21st.dev ke bahasa visual monochrome editorial:
   sudut kotak (bukan rounded), border hairline, tanpa shadow, foto grayscale,
   placeholder kartu kosong bertanda inisial `H · R`.
3. Stack hanya ada di **cover**; section lain tetap memakai Lenis + CSS.
4. `prefers-reduced-motion` → drag dinonaktifkan, kartu statis.

## Konsekuensi

- **Positif:** cover interaktif & mengisi ruang; dependency terisolasi di satu komponen.
- **Negatif:** satu dependency animation tambahan di bundle (hanya dimuat via `motion`,
  lazily oleh Framer Motion). Berat bundle bertambah ~30-50 KB gzip.
- **Batasan:** gambar yang sudah ada baru 1 (`cover.jpg`) — kartu lain memakai placeholder
  `H · R` sampai foto tambahan disediakan. Prop `images: (string | null)[]` siap menerima
  path foto baru tanpa ubah komponen.
- **Risiko:** react 19 + framer-motion 13 sudah kompatibel; jika upgrade Next mayor ke depan
  mengubah interop motion, migrasikan ke paket `motion` (rebrand) cukup ganti import.
