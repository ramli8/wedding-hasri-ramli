# Agent Rules — Wedding Hasri & Ramli

## Working Directory
`/home/ramli/ramli-project/wedding-hasri-ramli`

## Repo map

- `frontend/` — Next.js 16.1.3 (App Router, RSC) + React 19 + TypeScript + Tailwind v4. Clean Architecture di
  `frontend/src/` (`domain/services`, `application/hooks`, `infrastructure/stores`, `presentation/components`),
  pages di `frontend/app/`, design system di `frontend/desain.md`.
- `backend/` — Go (Chi router, uber/dig DI, GORM, PostgreSQL, JWT, RBAC). Modul di `backend/internal/<modul>/`
  (`dto/handler/service/repository.go`), wiring DI di `container/container.go`, routes di `pkg/router/router.go`,
  migration di `backend/migrations/`.
- Sebelum baca-baca file, cek dulu knowledge graph: `graphify query "<pertanyaan>"`.

## Pattern enforcement

Saat menulis/mengubah kode di `frontend/` atau `backend/`, ikuti skill **`wedding-convention`**
(`.opencode/skills/wedding-convention/SKILL.md`) — aturan arsitektur kedua stack, wajib. Standar coding detail
di `CONTRIBUTING.md` (dibaca `/code-review` & `/implement`).

## Agent skills

### Issue tracker
Work items live as local markdown files under `.scratch/<feature>/`. Tracker config:
`docs/agents/issue-tracker.md`, label triage: `docs/agents/triage-labels.md`.

### Domain docs
Single-context: `CONTEXT.md` + `docs/adr/` at repo root.

## Matt Pocock Skills — Integration

### Available Skills (installed)
All skills from `mattpocock/skills` are installed in `.agents/skills/`. Each skill has a `SKILL.md` with detailed instructions.

### User-Invoked Commands
- `/new-task` — Start a new task; clarifying questions + dev process (pola project)
- `/grill-me` — Get grilled on plans before coding
- `/grill-with-docs` — Grilling + build CONTEXT.md + ADRs
- `/triage` — Move issues through triage state machine
- `/improve-codebase-architecture` — Scan + fix architecture
- `/to-spec` — Conversation → spec → issue tracker
- `/to-tickets` — Break plans into tickets
- `/implement` — Spec/tickets → TDD → code review
- `/wayfinder` — Plan large work across sessions
- `/tdd` — Red-green-refactor loop
- `/diagnosing-bugs` — Systematic bug diagnosis
- `/code-review` — Two-axis review (standards + spec)
- `/setup-matt-pocock-skills` — Run once per repo

### Model-Invoked Skills (auto-triggered)
- `prototype` — Throwaway prototypes
- `research` — Investigate questions, capture findings
- `domain-modeling` — Build/sharpened domain model
- `codebase-design` — Deep module design discipline
- `resolving-merge-conflicts` — Intent-based merge resolution

### Before Coding
1. Run `/grill-with-docs` or `/grill-me` to align on requirements
2. Run `/to-spec` to formalize the plan
3. Run `/to-tickets` to break into actionable tickets

### During Coding
- Use `/tdd` for red-green-refactor on every feature/bugfix
- Follow codebase style rules below
- Write code matching existing patterns

### After Coding
- Run `/code-review` before committing
- Run `/improve-codebase-architecture` every few days

### Git Workflow
- Only commit when explicitly asked
- Before commit: inspect `git status`, `git diff`, `git log --oneline -10`
- Never force push, never amend, never skip hooks
- Commit message: concise, matches repo style
- Before PR: inspect status, diff, remote tracking, recent commits, diff from base
- For GitHub: use `gh` CLI

## Shell: rtk MANDATORY

Semua perintah shell WAJIB prefix `rtk` (`rtk ls`, `rtk git status`, `rtk grep ...`, `rtk npm run lint`, ...),
bukan command polos — hemat token context 60-90%. Rincian: `RTK.md`. Non-negotiable dalam repo ini.

## Workflow task baru

1. `/new-task` (atau `/ask-matt` + baca `docs/ai-development.md`) — klarifikasi sebelum mulai.
2. `/grill-with-docs` dulu untuk klarifikasi requirement + domain terms (buat/perbarui `CONTEXT.md` + ADR).
3. Tulis `.scratch/<feature-slug>/spec.md` → pecah ke `.scratch/<feature-slug>/issues/NN-<slug>.md`
   (tiap issue punya `Status:` + blocking edges). Tracker: `docs/agents/issue-tracker.md`.
4. Implementasi ikuti `wedding-convention` (skill) + `CONTRIBUTING.md`. Commit: `feat: <feature> <desc>` /
   `fix: <feature> <desc>`, branch per-ticket. Sebelum commit jalankan `/code-review`.
5. Setelah perubahan kode, update graph: `graphify update .`.

## graphify

Project ini punya knowledge graph di `graphify-out/` (god nodes, community structure, cross-file relationships).

Saat user mengetik `/graphify`, gunakan skill/instruksi graphify terinstall sebelum hal lain.

Rules:
- Untuk pertanyaan codebase, jalankan dulu `graphify query "<question>"` selama `graphify-out/graph.json` ada.
  `graphify path "<A>" "<B>"` untuk relasi, `graphify explain "<concept>"` untuk konsep fokus. Hasilnya
  subgraph scoped, biasanya jauh lebih kecil dari GRAPH_REPORT.md atau output grep mentah.
- File graphify-out/ kotor adalah hal wajar pasca hook atau incremental update; graph kotor bukan alasan skip.
  Hanya skip graphify jika task tentang output graph basi/salah, atau user eksplisit bilang jangan.
- Jika `graphify-out/wiki/index.md` ada, pakai untuk navigasi luas, bukan browsing source mentah.
- Baca `graphify-out/GRAPH_REPORT.md` hanya untuk review arsitektur luas atau saat query/path/explain belum cukup.
- Setelah memodifikasi kode, jalankan `graphify update .` agar graph tetap segar (AST-only, tanpa biaya API).

---

# Codebase Style Guide

## Project Overview
- **Frontend**: Next.js 16.1.3 (App Router, RSC) + React 19
- **Backend**: Go (Chi router, uber/dig DI, JWT, RBAC, PostgreSQL, Redis)

## Architecture: Clean Architecture Layers
```
src/domain/services/       → API calls (Axios, plain objects with async methods)
src/application/hooks/     → React Query hooks wrapping services
src/infrastructure/stores/ → Zustand state management
src/presentation/components/ui/ → Reusable UI primitives (shadcn/ui)
src/presentation/components/layout/ → App shell (navbar, sidebar, bottom-nav)
src/presentation/components/pages/ → Page-level container components
src/presentation/components/forms/ → Form components
src/presentation/components/admin/ → Admin-specific components
src/lib/                   → Utilities, query client, demo mode
```

## Naming Conventions
- **Files**: kebab-case for pages (`guest-checkin/page.tsx`), camelCase for hooks/services/stores (`use-auth.ts`, `auth-store.ts`, `guest.service.ts`)
- **Components**: PascalCase, named exports (NOT default exports except pages)
- **Variables/functions**: camelCase
- **Types/Interfaces**: PascalCase, export `interface` (not `type` unless union)
- **Directories under `src/`**: camelCase (`domain/services`, `application/hooks`, `infrastructure/stores`, `presentation/components`)
- **App router directories**: kebab-case

## Imports
- **Absolute imports only** using `@/*` alias (mapped to project root: `@/src/...`)
- Use `type` keyword for type-only imports
- Pattern: `import { ... } from '@/src/domain/services/guest.service'`
- shadcn/ui paths: `@/src/presentation/components/ui/button`
- Hooks: `@/src/application/hooks/use-guest-query`
- Stores: `@/src/infrastructure/stores/auth-store`
- Utils: `@/src/lib/utils`
- API client: `@/src/domain/services/api-client`

## Component Patterns
- Functional components with explicit `interface` props
- `'use client'` directive for interactive components
- `React.forwardRef` + `displayName` for UI primitives
- Named exports (not default)
- `cn()` from `@/src/lib/utils` for class merging

## Styling
- **Tailwind CSS v4** with `@import "tailwindcss"` (no tailwind.config.js)
- CSS custom properties for design tokens in `app/globals.css`
- `@theme` directive for typography/spacing
- `@utility` for reusable typography classes (`text-display-xl`, `text-caption`, etc.)
- Use `cn()` utility for conditional classes
- **Design system reference**: `frontend/desain.md`
  - Mobile-first, app-like feel
  - Bottom sheet modals for forms/filters/detail (not centered dialogs)
  - iOS-style AlertDialog for destructive actions (stacked vertical buttons)
  - `active:scale-95 transition-all` on all interactive elements
  - Pill-style tabs (not underline tabs)
  - Fixed FAB for "add" actions
  - Empty state: `Inbox` icon from lucide-react with `opacity-20`
  - Loading: `Loader2` from lucide-react with `animate-spin`

## UI Components (shadcn/ui)
- Style: **new-york**; Base color: **zinc**
- Path: `src/presentation/components/ui/`
- Button variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `soft`, `soft-accent`
- Button sizes: `default` (h-12), `sm`, `lg`, `icon` (rounded-full), `action` (rounded-full)

## Data Fetching Pattern
- **Service layer** (`src/domain/services/`): plain objects with async methods, uses `apiClient` (Axios)
- **Query hooks** (`src/application/hooks/`): React Query hooks
- **Query key factories**: structured keys (e.g., `guestKeys = { all, categories, categoryLists, guestList, ... }`)
- `placeholderData: (prev) => prev` for pagination (keepPreviousData)
- `staleTime: 30000` (30s) for most queries
- `onSuccess` in mutations: invalidate related query keys, NOT individual cache updates

## State Management (Zustand v5)
- Persisted stores in `src/infrastructure/stores/`
- `skipHydration: true` + manual `hasHydrated` tracking
- `partialize` to limit persisted fields
- Store actions directly in the create function (no separate action files)

## API Client (`src/domain/services/api-client.ts`)
- Axios instance with Bearer token interceptor
- 401 → shared refresh token promise (deduplicated) → retry
- Refresh failure → logout + redirect to `/auth/login`

## Internationalization
- `next-intl` v3, locale from cookie, default: `'id'`
- Translation files: `locales/id.json`, `locales/en.json`
- Only `'id'` locale is currently in use

## Theme
- `next-themes` with `dark` default
- Light: warm cream canvas (#faf9f5), coral primary (#cc785c)
- Dark: dark surface (#181715), same coral accent

## Toast
- **`react-toastify`** (NOT sonner, NOT react-hot-toast)
- `<ToastifyWrapper />` component with custom theme
- Usage: `toast.success()`, `toast.error()`, `toast.info()`

## Pagination
- "Show More" button pattern (increment page_size, NOT numbered pages)
- `placeholderData: (prev) => prev` in TanStack Query

## RBAC
- `ProtectedRoute`: auth guard with redirect
- `ProtectedModule`: role-based page guard (`requiredRole`)
- `ProtectedFeature`: permission-based UI element guard (`permission` prop)
- Permissions follow `module.action` convention (`users.create`, `guests.read`)

## Linting
- ESLint v9 with `eslint-config-next`
- Rules: `@typescript-eslint/no-explicit-any: off`, `react-hooks/exhaustive-deps: off`
- Run: `npm run lint`

## Demo Mode
- Route prefix `/demo` mirrors real routes
- `DemoProvider` + mock services with in-memory CRUD
- `NEXT_PUBLIC_DEMO_MODE=true` enables demo proxy

## Key Dependencies
- **UI**: @radix-ui/*, lucide-react, vaul, cmdk
- **Form**: react-hook-form, zod, @hookform/resolvers
- **Data**: @tanstack/react-query, axios
- **State**: zustand
- **Toast**: react-toastify
- **Theme**: next-themes
- **Charts**: recharts
- **Date**: date-fns
- **QR**: html5-qrcode, qrcode.react
- **CSS**: tailwind-merge, clsx, class-variance-authority, tw-animate-css

## Design System Colors (from globals.css)
- Background: `hsl(var(--background))` — light: #f5f0e8, dark: #181715
- Foreground: `hsl(var(--foreground))` — light: #141413, dark: #faf9f5
- Primary: `hsl(var(--primary))` — coral #cc785c
- Muted: `hsl(var(--muted))`
- Border: `hsl(var(--border))` — light: #e6dfd8
- Destructive: `hsl(var(--destructive))` — red #c64545
