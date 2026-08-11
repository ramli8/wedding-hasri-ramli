# Issue Tracker: Local Markdown

Issues dan specs untuk repo ini hidup sebagai file markdown di `.scratch/`.

## Konvensi

- Satu fitur per direktori: `.scratch/<feature-slug>/`
- Spec: `.scratch/<feature-slug>/spec.md`
- Implementation issues: satu file per ticket di `.scratch/<feature-slug>/issues/<NN>-<slug>.md`,
  dinomori dari `01` — jangan pernah satu file gabungan.
- State triage dicatat sebagai baris `Status:` di dekat bagian atas tiap file issue
  (lihat `triage-labels.md` untuk string label yang valid).
- Komentar & riwayat percakapan di-append ke bawah file di bawah heading `## Comments`.

## Workflow

1. `/grill-with-docs` atau `/grill-me` — klarifikasi requirement.
2. `/to-spec` — tulis `.scratch/<feature-slug>/spec.md`.
3. `/to-tickets` — pecah ke `.scratch/<feature-slug>/issues/NN-<slug>.md`.
4. `/implement` — kerjakan per ticket mengikuti skill `wedding-convention`.

## Ketika skill bilang "publish to the issue tracker"

Buat file baru di bawah `.scratch/<feature-slug>/` (buat direktori bila perlu).

## Ketika skill bilang "fetch the relevant ticket"

Baca file pada path yang dirujuk. User biasanya memberi path atau nomor issue langsung.
