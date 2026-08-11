---
description: Start a new development task on wedding-hasri-ramli. Arg = ticket/feature description.
agent: build
---

# New task on wedding-hasri-ramli

Tugas: `$ARGUMENTS`

Sebelum mulai, ikuti urutan ini:

1. Baca `AGENTS.md`, `CONTRIBUTING.md`, dan `docs/ai-development.md`.
2. Kalau ragu skill/flow mana, jalankan `/ask-matt`.
3. Consult knowledge graph: `graphify query "<tentang modul/flow terkait>"`.
4. Semua perintah shell WAJIB `rtk` prefix.

## Klarifikasi (tanya user dulu — jangan mulai coding)

Sebelum kerja, tanya user pertanyaan-pertanyaan ini satu per satu. Tunggu jawaban tiap nomor sebelum lanjut.

1. **Scope?** Frontend saja, backend saja, atau kedua-duanya (full-stack)?

2. **Fitur/modul apa?** nama modul backend (`internal/<modul>/`) dan/atau route frontend (`app/<path>/`).
   Contoh: `guest-checkin`, `vendor-payments`.

3. **Backend — tabel DB?** Ada tabel baru? Kalau ya, sebutkan kolom-kolomnya + relasi. Perlu migration
   (`.up.sql`/`.down.sql`) dan/atau seeder baru? Sebutkan apakah pakai soft delete (`deleted_at`).

4. **Backend — endpoint apa saja?** daftar method + URL. Untuk tiap endpoint:
   a. Perlu auth? role apa (admin/super admin/public)?
   b. Perlu permission key baru? kalau ya, sebutkan `<module>.<action>` (mis. `guests.update`).
   c. Request fields + validasi, Response fields?

5. **Backend — aturan bisnis?** logika utama di service (mis. generate QR unik 6 karakter, minimal
   isi phone ATAU instagram, check-in idempotent, dst). Read-only (query) atau ada write (mutation)?

6. **Frontend — halaman?** URL route + layout yang dipakai (`app/admin/`, `app/settings/`, dsb).
   Referensi tampilan — sebutkan halaman existing yang mirip.

7. **Frontend — list/tabel?** kolom apa saja + urutan? kolom action per baris (edit/hapus/detail/QR/WA/IG)?
   Filter + sort apa saja? Perlu "Show More" pagination?

8. **Frontend — form/modal?** field apa saja, validasi, dropdown dari mana? Bottom sheet atau AlertDialog?
   Ada aksi di luar list (FAB tambah, export/import)?

9. **Frontend — state & data?** perlu store Zustand baru? query key factory baru? endpoint service baru?
   Perlu mirror `/demo`?

10. **Fitur baru atau perbaikan?** kalau perbaikan — apa yang salah sekarang? (bug/perf/UI)

11. **Toast/feedback?** pesan sukses/gagal apa yang diharapkan? (pakai `react-toastify`)

## Proses pengembangan

1. `/grill-with-docs` — klarifikasi requirement + domain terms (buat/perbarui `CONTEXT.md` + ADR).
   Jika kecil/eksplisit, `/grill-me` cukup.
2. Tulis `.scratch/<slug>/spec.md` → `.scratch/<slug>/issues/NN-<slug>.md`
   (masing-masing `Status:` + blocking edges).
3. Implementasi ikuti pola di `CONTRIBUTING.md` dan skill `wedding-convention`:
   - Backend: `internal/<modul>/{dto,handler,service,repository}.go`, wiring di `container/container.go`,
     routes di `pkg/router/router.go` (+ JWT/role/permission), swagger, migration up/down + seeder.
   - Frontend: service → hook (query key factory) → komponen; UI ikut `frontend/desain.md`;
     guards `ProtectedRoute`/`ProtectedModule`/`ProtectedFeature`; demo mirror.
4. `/code-review` sebelum commit.
5. Commit: `feat: <feature> <desc>` / `fix: <feature> <desc>`. Branch per-ticket.
6. Update graph: `graphify update .`.
