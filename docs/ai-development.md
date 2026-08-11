# AI-Assisted Development Guide (wedding-hasri-ramli)

Workflow, skills, dan prompt persis yang dikirim saat memulai task development baru atau membuka session
agent baru di repo ini.

## Saat membuka session BARU

Tempel block ini (edit deskripsi `<thing-to-build>`):

````markdown
Repositori wedding-hasri-ramli (Next.js 16 frontend + Go backend).

Sebelum mulai:
1. Baca AGENTS.md (aturan project, konvensi, RTK, graphify, agent skills), CONTRIBUTING.md (coding standards),
   dan skill `wedding-convention`.
2. Consult knowledge graph dulu untuk konteks arsitektur: `graphify query "<pertanyaan tentang modul/flow terkait>"`.
   Jangan baca-baca file satu per satu jika graph sudah bisa menjawab.
3. Semua perintah shell WAJIB pakai prefix `rtk` (mis. `rtk git status`), jangan `git status` polos.

Task: <deskripsi singkat fitur/perubahan, atau ticket>

Proses yang diharapkan:
- Jalankan `/new-task` dulu untuk klarifikasi requirement (scope frontend/backend, tabel, endpoint,
  halaman, UI) sebelum coding.
- `/grill-with-docs` untuk klarifikasi requirement + domain terms (buat/perbarui CONTEXT.md + ADR).
- Tulis `.scratch/<feature-slug>/spec.md` lalu pecah ke `.scratch/<feature-slug>/issues/NN-*.md`.
- Ikuti pola arsitektur di skill `wedding-convention`: backend `internal/<modul>/{dto,handler,service,repository}.go`
  + wiring `container/container.go` + routes `pkg/router/router.go` (+ JWT/role/permission) + migration up/down;
  frontend service → hook (query key factory) → komponen, UI ikut `frontend/desain.md`.
- Setelah selesai jalankan `/code-review` sebelum commit.
- Commit: `feat: <feature> <desc>` / `fix: <feature> <desc>`, branch per-ticket.
````

## Skills (mattpocock, in `.agents/skills/`)

User-invoked orchestration commands — agent memuatnya on demand:

| Skill | Kapan | Output |
|---|---|---|
| `/new-task` | **buka apa pun** — klarifikasi + dev process pola project | scope + langkah kerja |
| `/ask-matt` | ragu skill/flow mana yang pas | rekomendasi skill alur |
| `/grill-with-docs` | any new feature — **always first** | clarified requirements + ADRs + glossary in `docs/adr/`, `CONTEXT.md` |
| `/grill-me` | non-code plan/design | decision tree resolved |
| `/to-spec` | after grilling | `.scratch/<feature>/spec.md` |
| `/to-tickets` | after spec | `.scratch/<feature>/issues/NN-<slug>.md` (each with `Status:`, blocking edges) |
| `/implement` | build | code per ticket via `/tdd`-style slices |
| `/tdd` | test-first | red-green-refactor loop |
| `/code-review` | before commit | parallel Standards + Spec review of the diff |
| `/diagnosing-bugs` | hard bug / perf regression | reproduce→minimise→hypothesise→fix→regression-test |
| `/triage` | triage issues | issues moved through roles (per `docs/agents/triage-labels.md`) |
| `/wayfinder` | huge multi-session work | investigation-det ticket map on `.scratch/` |
| `/improve-codebase-architecture` | periodic architecture pass | HTML report of deepening opportunities + grilling |
| `/research` | external facts/docs | cited `.md` in repo |
| `/handoff` | continue in another session | handoff doc |

Model-invoked (agent mengambilnya saat task cocok): `grilling`, `domain-modeling`, `codebase-design`,
`prototype`, `resolving-merge-conflicts`, `writing-great-skills`, `teach`.

Project-specific skill (auto-loaded): **`wedding-convention`** in `.opencode/skills/` — enforces arsitektur
kedua stack (frontend Clean Architecture + backend Go module), RBAC `module.action`, migration up/down,
swagger, design system `frontend/desain.md`.

Config dibaca skills ini: `docs/agents/issue-tracker.md` (local `.scratch/` tracker),
`docs/agents/triage-labels.md`, `docs/agents/domain.md`.

## Knowledge graph (graphify)

Persistent, free, code-only graph dari `frontend/src` + `backend/`. Consult **before** reading files —
lebih murah dan cepat di session baru.

| Command | Use |
|---|---|
| `graphify query "<pertanyaan>"` | jawab pertanyaan codebase (fast path saat `graphify-out/graph.json` ada) |
| `graphify path A B` | shortest path antara dua konsep |
| `graphify explain <node>` | plain-language explain dari sebuah symbol |
| `graphify update .` | incremental re-extract setelah perubahan kode |

- Rules: cite `source_location`; percaya edge `EXTRACTED`, flag `INFERRED`/`AMBIGUOUS`. Jangan invent edge.
- Rebuild setelah perubahan kode agar jawaban session baru tetap akurat.

## Shell: RTK

`rtk` prefix untuk SETIAP perintah shell (`rtk ls`, `rtk git status`, `rtk npm run lint`, …).
Lihat `AGENTS.md` → "Shell: RTK is mandatory" dan `RTK.md`. Non-negotiable untuk hemat context.

## Setup artifacts map

| Path | What |
|---|---|
| `opencode.json` | project config: instructions + skill paths (`skills.paths`) + `default_agent` + permission |
| `AGENTS.md` | entrypoint agent: repo map, rtk mandatory, workflow, graphify rules |
| `CONTRIBUTING.md` | coding standards (dibaca `/code-review` & `/implement`) |
| `CONTEXT.md` | glossary domain, dikelola `/grill-with-docs` |
| `.opencode/skills/wedding-convention/` | project rules skill (frontend + backend) |
| `.agents/skills/` | mattpocock skills (editable; `npx skills update` untuk refresh) |
| `docs/agents/` | issue-tracker / triage-labels / domain config untuk skills |
| `docs/adr/` | ADRs, dibuat lazily oleh `/grill-with-docs`/`/domain-modeling` |
| `.scratch/` | local ticket workspace (gitignored) |
| `graphify-out/` | knowledge graph (gitignored, rebuildable) |
| `.graphifyignore` | apa yang dikecualikan graph (node_modules, .next, binari) |
