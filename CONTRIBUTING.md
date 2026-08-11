# CONTRIBUTING — Wedding Hasri & Ramli

Coding standards untuk repo ini. `/code-review` (Standards axis) dan `/implement` memakai dokumen ini.
Standar repo menimpa smell baseline; sesuatu yang sudah dipaksa tooling di-skip.
Rules di `AGENTS.md`, `docs/ai-development.md`, dan skill `wedding-convention` adalah bagian dari standar ini.

## Layout

- `frontend/` = Next.js 16.1.3 (App Router, RSC) + React 19 + TypeScript + Tailwind CSS v4.
- `backend/` = Go (Chi router, uber/dig DI, GORM, PostgreSQL, JWT, RBAC).
- Struktur + contoh: skill `wedding-convention`.

---

## Backend (Go)

### Modul

Setiap domain fitur adalah modul di `backend/internal/<modul>/` dengan empat file wajib:

```
internal/<modul>/
├── dto.go          # Request/Response structs + validate tags
├── handler.go      # thin HTTP layer + swagger annotations
├── service.go      # business logic + Service interface
└── repository.go   # data access (GORM) + Repository interface
```

- `internal/shared/models/` = model GORM yang dipakai bersama (Guest, User, Vendor, Kondangan, Rbac, …).
- Contoh modul yang sudah ada: `auth`, `guest`, `kondangan`, `rbac`, `vendor`.

### Aturan wajib

- **Handler tipis**: decode request → panggil service → `response.ResponseJSON` / `response.ResponseError`.
  Tidak ada logika bisnis, tidak ada akses DB, tidak ada SQL di handler.
- **Service = business logic**: validasi (`validator.ValidateStruct`), aturan domain, orchestrate repository.
  Return signature `(res T, statusCode int, err error)`.
- **Repository = data access**: pakai `r.db.GetDB().WithContext(ctx)` (GORM, parameterized). Jangan concatenate
  string untuk filter/order. `ErrXxx` package-level vars untuk not-found/duplikat.
- **DI**: daftarkan ketiganya di `container/container.go` urut `NewRepository` → `NewService` → `NewHandler`
  (provider function style `func NewXxx(...) Xxx`).
- **Routing terpusat** di `pkg/router/router.go` (`SetupRoutes`). Pola:
  - Grup root `/v1`, middleware global chi (`Logger`, `Recoverer`, `RealIP`, `NoCache`, `GetHead`, `Compress`, `secure`).
  - Endpoint login/register/refresh publik. Semua lainnya pakai `middleware.JWTAuthMiddleware`.
  - Admin-only: `middleware.RequireRole("Super Admin", "Admin")`.
  - Aksi per-permission: `r.With(middleware.RequirePermission(rbacRepo, "<module>.<action>")).Post(...)`.
  - URL resource jamak (kebab/nama jamak), method REST, `/{id}` untuk detail/update/delete.
- **RBAC**: permission key mengikuti `module.action` (mis. `guests.create`, `vendors.categories.update`).
  Permission baru → seeder `migrations/seeders/rbac_seeder.sql` (`ON CONFLICT DO NOTHING`).
- **Swagger**: tiap method handler diberi anotasi godoc (`@Summary`, `@Param`, `@Success`, `@Failure`, `@Router`).
  Regenerate dengan `make swagger`.
- **Error handling**: `ErrXxx` dari repository → peta di service ke status code HTTP yang tepat
  (404 not found, 400 validation, 409 conflict/duplicate, 500 internal).
- **Response JSON**: pakai `pkg/response` (`ResponseJSON`, `ResponseError`). Jangan menulis raw JSON sendiri.

### Migrasi

- `migrations/NNN_<nama>.up.sql` + `NNN_<nama>.down.sql` berpasangan (`make create-migration name=<nama>`).
- Seeder di `migrations/seeders/*.sql`, idempotent (`ON CONFLICT DO NOTHING`).
- Kolom audit: `created_at` / `updated_at` / `deleted_at` (soft delete) bila entity butuh soft delete.

### Verifikasi

- `go build ./...`
- `make swagger` setelah menambah/mengubah endpoint.

---

## Frontend (Next.js)

### Arsitektur lapisan (Clean Architecture)

```
src/
├── domain/services/            # API calls — plain object, method async, pakai apiClient
├── application/hooks/          # React Query hooks membungkus services
├── infrastructure/stores/      # Zustand state management
├── presentation/components/    # ui | layout | pages | forms | admin
└── lib/                        # utils, query client, demo mode
app/                            # App Router pages (kebab-case), layouts, providers
```

Alur data: **page/component** → hook React Query → service → `apiClient` (Axios) → backend.

### Aturan wajib

- **Service** (`src/domain/services/<domain>.service.ts`): interface tipe + plain object berisi method async.
  Pakai `apiClient` (`@/src/domain/services/api-client`) — jangan panggil `fetch`/axios langsung.
- **Hook** (`src/application/hooks/use-<domain>-query.ts`): bungkus service dengan `useQuery`/`useMutation`.
  - Query key factory bertingkat (mis. `guestKeys = { all, categories, categoryList, guestList, … }`).
  - `staleTime: 30000` untuk query umum.
  - Pagination: `placeholderData: (prev) => prev` (keepPreviousData).
  - Mutation `onSuccess`: invalidate key terkait, bukan update cache manual.
- **Store** (`src/infrastructure/stores/`): Zustand, `skipHydration: true` + manual `hasHydrated`,
  `partialize` membatasi field yang dipersist.
- **Komponen**: named export + `interface` props (bukan `type` kecuali union). `React.forwardRef` + `displayName`
  untuk UI primitives. `'use client'` untuk komponen interaktif.
- **Naming**: halaman kebab-case (`app/admin/guest-checkin/page.tsx`); hooks/services/stores camelCase;
  komponen PascalCase. Path absolute `@/` + keyword `type` untuk type-only imports.
- **UI**: ikuti `frontend/desain.md` — bottom sheet untuk form/filter/detail, AlertDialog iOS-style untuk
  destruktif, `active:scale-95 transition-all`, pill tabs, FAB, empty state `Inbox` opacity-20,
  loading `Loader2` animate-spin, toast pakai `react-toastify`.
- **Guard**: `ProtectedRoute` (auth), `ProtectedModule` (`requiredRole`), `ProtectedFeature` (`permission`).
- **i18n**: `next-intl`, locale default `'id'`, file `locales/id.json` (hanya `id` yang dipakai).
- **Demo mode**: fitur baru juga harus punya padanan di `/demo` bila mengubah alur nyata
  (`src/lib/demo/mock-services.ts`).

### Verifikasi

- `npm run lint` (wajib nol error baru).
- `npx tsc --noEmit` bila mengubah tipe/layout global.

---

## Komit & branch

- Branch per-ticket, nama deskriptif: `guest-checkin`, `vendor-payments`.
- Commit message: `feat: <feature> <desc>` / `fix: <feature> <desc>`. Sebut ticket bila ada.
  Jangan commit tanpa `/code-review`.
- Setelah mengubah kode, refresh knowledge graph: `graphify update .`.
