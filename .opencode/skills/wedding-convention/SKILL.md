---
name: wedding-convention
description: Enforce the Wedding Hasri & Ramli codebase conventions when writing or modifying code in frontend/ (Next.js) or backend/ (Go). Use when creating a new feature module (frontend page/hook/service or backend internal/<module>), adding CRUD, writing migration/RBAC, adding endpoints, or writing frontend components. Gates on frontend/src/, frontend/app/, backend/internal/, backend/migrations, backend/pkg/router.
---

# Wedding Convention (wedding-hasri-ramli)

Rules for any code added under `frontend/` (Next.js 16, React 19, TS, Tailwind v4) or `backend/` (Go, Chi, dig, GORM, PostgreSQL). If unsure how a sibling feature is built, consult the knowledge graph first: `graphify query "how does <existing feature> work"`.

## Backend tree

```
backend/
├── cmd/api/main.go                 # entry; migration + seeder + start
├── container/container.go          # dig DI: Provide(NewRepository→NewService→NewHandler) per module
├── internal/<modul>/
│   ├── dto.go                      # Request/Response structs + validate tags
│   ├── handler.go                  # thin; decode → service → response helpers + swagger annotations
│   ├── service.go                  # business logic; (res T, statusCode int, err error)
│   └── repository.go               # GORM via pkg/database.Database; ErrXxx sentinels
├── internal/shared/models/         # shared GORM models (Guest, User, Vendor, Kondangan, Rbac, …)
├── migrations/NNN_<nama>.up/down.sql + seeders/rbac_seeder.sql
├── pkg/response|middleware|router|database|validator|token|config|constants|utils|server|cache
└── Makefile                        # run/build/migrate*/swagger/create-migration
```

Existing modules: `auth`, `guest`, `kondangan`, `rbac`, `vendor`. Mirror the closest one.

## Backend rules

- **One module = one directory** `internal/<modul>/` with `dto.go`, `handler.go`, `service.go`, `repository.go`.
- **Handler is thin.** Decode request → call service → `response.ResponseJSON(w, statusCode, res)` /
  `response.ResponseError(w, statusCode, err.Error())`. No business logic, no DB access, no SQL in handlers.
- **Service owns business logic.** Validate via `validator.ValidateStruct(req)`; return `(res, statusCode, err)`.
  Map `ErrXxx` sentinels to correct HTTP codes (404 not found, 400 validation, 409 duplicate, 500 internal).
- **Repository owns data access.** Use `r.db.GetDB().WithContext(ctx)` (GORM). Parameterized only — never
  concatenate user input into query strings. Declare package-level `ErrXxx` errors for not-found/duplicate.
- **DI is centralized** in `container/container.go`: `container.Provide(<modul>.NewRepository)` →
  `NewService` → `NewHandler`, in that order.
- **Routes are centralized** in `pkg/router/router.go` (`SetupRoutes`). Pattern:
  - Public: `/auth/login`, `/auth/register`, `/auth/oauth/google`, `/auth/refresh`.
  - Everything else: `r.Use(middleware.JWTAuthMiddleware)`.
  - Admin-only: `r.Use(middleware.RequireRole("Super Admin", "Admin"))`.
  - Per-action: `r.With(middleware.RequirePermission(rbacRepo, "<module>.<action>")).<Method>(...)`.
  - Plural resource URLs, `/{id}` sub-routes, REST verbs. Static paths before `/{id}`.
- **RBAC permissions** follow `<module>.<action>` (e.g. `guests.create`, `guest_categories.update`). New
  permissions go in `migrations/seeders/rbac_seeder.sql` with `ON CONFLICT DO NOTHING`.
- **Swagger** annotations on every handler method (`@Summary`, `@Param`, `@Success`, `@Failure`, `@Router`).
  Regenerate via `make swagger`.
- **Migrations** come in paired `.up.sql` / `.down.sql`, numbered (`make create-migration name=<name>`).
  Audit columns `created_at`/`updated_at`/`deleted_at` for soft-deletable entities.
- **Verify**: `go build ./...` compiles; `make swagger` refreshed.

## Frontend tree

```
frontend/
├── app/<kebab-case>/page.tsx       # App Router pages; (admin/, auth/, settings/, demo/)
├── src/domain/services/<name>.service.ts   # interfaces + plain object, uses apiClient
├── src/application/hooks/use-<name>-query.ts # React Query + query key factory
├── src/infrastructure/stores/<name>-store.ts # Zustand
├── src/presentation/components/ui|layout|pages|forms|admin/
└── src/lib/ (utils, query-client, demo/)
```

Data flow: **page/component** → React Query hook → service → `apiClient` (Axios) → backend.

## Frontend rules

- **Services**: define `interface` types for DTOs + params + responses; export a plain object with async
  methods that call `apiClient` (`@/src/domain/services/api-client`). Never call `fetch`/axios directly.
- **Hooks**: wrap services with `useQuery`/`useMutation`. Use a hierarchical query key factory
  (e.g. `guestKeys = { all, categories, categoryList, guestList, guestDetail, … }`).
  - `staleTime: 30000` on list queries; `placeholderData: (prev) => prev` for paginated lists.
  - Mutations invalidate related keys in `onSuccess`; never hand-update cache.
- **Stores** (Zustand v5): `skipHydration: true` + manual `hasHydrated`; `partialize` to limit persisted fields.
- **Components**: named exports, `interface` props (not `type` unless union), `'use client'` for interactive,
  `React.forwardRef` + `displayName` for UI primitives, `cn()` from `@/src/lib/utils` for class merging.
- **Naming**: pages kebab-case (`app/admin/guest-checkin/page.tsx`); hooks/services/stores camelCase
  (`use-guest-query.ts`, `guest.service.ts`, `auth-store.ts`); components PascalCase.
- **Imports**: absolute `@/*`, `type` keyword for type-only imports, shadcn paths `@/src/presentation/components/ui/...`.
- **UI**: follow `frontend/desain.md` — bottom sheets (vaul) for forms/filters/detail, iOS-style AlertDialog for
  destructive actions, `active:scale-95 transition-all` on interactive elements, pill-style tabs, FAB for add,
  `Inbox` icon + `opacity-20` empty state, `Loader2` + `animate-spin` loading, `react-toastify` for toasts.
- **Guards**: `ProtectedRoute` (auth), `ProtectedModule` (role), `ProtectedFeature` (permission key).
- **Demo mode**: mirror real routes under `/demo` when a flow changes; keep mock services in `src/lib/demo/`.
- **Verify**: `npm run lint` clean, `npx tsc --noEmit` passes.

## Checklist when done

- [ ] Backend: all 4 files (`dto/handler/service/repository`) created; handlers thin; no SQL in handler/service
- [ ] Backend: `NewRepository`/`NewService`/`NewHandler` wired in `container/container.go`
- [ ] Backend: routes registered in `pkg/router/router.go` with JWT + role/permission middleware
- [ ] Backend: swagger annotations present + `make swagger` regenerated
- [ ] Backend: migration up/down paired; seeders idempotent (`ON CONFLICT DO NOTHING`)
- [ ] Frontend: service → hook (query key factory) → component flow; no direct fetch
- [ ] Frontend: UI follows `desain.md` (bottom sheet, toasts, loading/empty states)
- [ ] Frontend: guards applied (`ProtectedRoute`/`ProtectedModule`/`ProtectedFeature`); demo mirror if needed
- [ ] `npm run lint` clean; `go build ./...` compiles
