# ADR 0001 — Ucapan sebagai Thread Dua Arah (Guest ↔ Admin)

- **Status:** Accepted
- **Date:** 2026-08-11
- **Decision makers:** Hasri & Ramli (via grill/diskusi)

## Context

Guest book undangan digital awalnya direncanakan sebagai kumpulan pesan satu arah dari tamu.
User menginginkan keluarga bisa membalas ucapan tamu, tapi **tamu lain tidak boleh ikut menulis
di kartu milik tamu lain**. Keluarga adalah satu-satunya entitas yang boleh membalas di kartu
mana pun. Hubungan berjalan 13 tahun sehingga percakapan dua arah dianggap bernilai.

## Keputusan

1. Setiap **Ucapan (wish)** adalah **kartu thread milik satu tamu** — bukan entri satu arah.
2. Peserta thread hanya dua: **pemilik kartu** (guest) dan **admin/keluarga** (Hasri & Ramli).
   Tamu lain TIDAK BISA menulis di kartu orang lain — enforce di struktur data (author check),
   bukan sekadar menyembunyikan tombol.
3. Tanda tangan semua balasan admin tetap: **"— Hasri & Ramli"**.
4. Seluruh thread **publik** untuk semua pengunjung undangan.
5. Tamu pemilik kartu boleh membalas admin (percakapan dua arah di kartunya sendiri).

## Model

```
Wish { id, guestName, createdAt, messages: Message[] }
Message { id, wishId, authorType: 'guest' | 'admin', body, createdAt }
```

## Konsekuensi

- **Positif:** anti-keramaian/komentar silang antar tamu; kesan keluarga responsif; layout
  editorial tetap bersih.
- **V2 (backend):** perlu tabel `wishes` + `wish_messages`, endpoint balasan, permission key
  `wishes.reply` (role admin), halaman kelola thread di admin panel, dan verifikasi identitas
  pemilik via link `?guest=CODE`.
- **MVP (frontend):** state mock lokal + contoh percakapan statis; tombol balas hanya muncul
  di kartu milik user (dikenali lewat `?guest=`).
- **Non-goal:** tidak ada mention/reply antar tamu, tidak ada like per pesan, tidak ada edit/hapus
  pesan oleh tamu lain.
