# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wedding system for Hasri & Ramli (event 21 May 2027): guest management, message links, and **offline-first QR check-in** for door staff. A ground-up rebuild on branch `rewrite`; the old Go + Next.js code lives only at tag `legacy-v1`. One wedding, no multi-tenancy, Indonesian UI only. Code comments, docs, error messages and commit messages are in Indonesian; match that.

`docs/rancangan.md` is the approved design (schema, API, offline sync, phases) and §14 records where the implementation deliberately diverged from it. Read it before changing sync, check-in or schema. `docs/design.md` + `docs/design-tokens.json` define the "light brutalist" admin look (cream + dot pattern, 2px black borders, hard shadows, radius 0, acid `#d8ff3e` / electric `#2b2be8`).

Phases 1–5 (foundation, guests, scanner/check-in/devices/dashboard, e-ticket/RSVP, invitation content) are done. Phase 5 delivered the guestbook, the media system (admin uploads, stored on the server) and the admin menu "Undangan" with tabs for couple profile, story, gallery, digital envelope, FAQ, wishlist (guests claim items), layout (cover, live-stream link, section order/visibility) and guestbook replies; guests see it on `/u/CODE/undangan` while `/u/CODE` is only ticket, events and RSVP. Same light-brutalist style as the admin. Decisions are in `docs/rancangan.md` §14 (Fase 5). Phase 6 is in progress: received gifts (`/admin/hadiah`: envelopes, transfers and items given, with a thanked flag) and vendors with their payments (`/admin/vendor`: categories, candidates, one selected per category, payment status from contract vs. payments) are done. Don't propose other stacks or dropped features (dynamic RBAC, Google OAuth, multi-tenant, seating plans).

## Commands

Needs Node 24 (`.nvmrc`), pnpm via `corepack enable`, and Docker (for Postgres).

```bash
pnpm dev:db                       # Postgres 17 on localhost:5433 (docker compose, deploy/compose.dev.yaml)
pnpm dev:api                      # :3000, runs migrations on start (tsx watch, reads ../../.env)
pnpm dev:web                      # :5173, proxies /api to :3000. Admin at /admin, scanner at /scan
pnpm --filter @wedding/api admin:create --email x@y.com --name "Nama"   # first admin account

pnpm lint                         # biome check . (format + lint + import order)
pnpm format                       # biome check --write .
pnpm typecheck                    # tsc in every package
pnpm test                         # vitest in api + web
pnpm build                        # api (esbuild bundle) + web (tsc + vite)
pnpm --filter @wedding/api db:generate   # drizzle migration from src/db/schema.ts changes
```

Single test:

```bash
pnpm --filter @wedding/api exec vitest run test/auth.test.ts
pnpm --filter @wedding/api exec vitest run -t "name fragment"
pnpm --filter @wedding/web exec vitest run src/lib/scan/scan.test.ts
```

- API tests hit a real Postgres database `wedding_test` (created by `test/global-setup.ts`; override with `TEST_DATABASE_URL`), so `pnpm dev:db` must be running. All API test files share that one database, so `fileParallelism` is off. `resetDb` in `test/helpers.ts` truncates tables; add new tables to it.
- Web tests run in jsdom with `fake-indexeddb` (Dexie).
- `pnpm e2e` / `pnpm e2e:qr` drive headless Firefox against a production web build (puppeteer-core), using a separate `wedding_e2e` database. Not run in CI; run manually after big scanner/sync changes. See `e2e/README.md`.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, build. It has never actually run on GitHub.

## Architecture

pnpm workspace: `apps/api`, `apps/web`, `packages/shared`.

**`packages/shared`** is the contract: Zod schemas and inferred types used by both API (validation, via `http/validate.ts`) and web. Exported as raw TypeScript (`exports: ./src/index.ts`, no build step). It also holds the pure check-in conflict logic (`resolveCheckins` in `src/checkin.ts`), the sync protocol constants (`SYNC_PROTOCOL_VERSION`, `MIN_SUPPORTED_SYNC_VERSION`) and phone/Instagram normalizers. API shapes change here first.

**`apps/api`** (Hono + Drizzle + postgres.js). `createApp(deps)` in `src/app.ts` mounts `/api/v1/{auth,admin,device,sync,public}` plus `/api/health`; `deps` = `{ db, config, logger }` is passed to every route factory, which is how tests build isolated apps. Layering: `routes/` (HTTP + validation) → `services/` (logic, Drizzle queries) → `db/schema.ts`. Migrations in `apps/api/drizzle/` are generated, committed, and applied automatically at startup (`db/migrate.ts`). There are three auth worlds:
- Admin: cookie session (`__Host-session` in production), `originCheck` on all mutating requests, in-memory login rate limiter. Everything under `/api/v1/admin/*`.
- Device (door staff): `Authorization: Bearer <device token>` plus a required `x-sync-version` header; only `/device/pair` and `/sync/*`. Staff have no accounts. Devices are registered with **single-use pairing codes** (never a static PIN) so each device can be revoked individually; revoked devices get `401 DEVICE_REVOKED`, too-old clients `426 APP_OUTDATED`.
- Images (`media` table + files under `MEDIA_DIR/<id>/{large,thumb}.webp`, processed by the native `sharp` module, which is external in the API bundle and installed in the Docker image): served without login at `/media/:id/:file` (outside `/api`, immutable cache). The `large` variant is deliberately full-resolution near-lossless: the owner does not want photos visibly compressed, so do not downscale or switch it to plain lossy WebP. One image has one owner; register every new photo column in `MEDIA_USERS` (`services/media.ts`) and call `discardMedia` when replacing or deleting.
- Guests (`/api/v1/public/*`): no login; the 6-char guest code in the request is the credential. Two per-IP in-memory limiters (wrong-code guesses, RSVP/guestbook/wishlist-claim submissions). Responses never include phone/Instagram. The guest pages are `/u/CODE` (e-ticket QR, events, RSVP) and `/u/CODE/undangan` (couple, story, gallery, envelope, wishlist claims, FAQ, guestbook) in the web app.

**`apps/web`** (Vite + React 19 + TanStack Router/Query + Tailwind 4, own UI components in `components/ui`, no shadcn). One PWA serves the admin (`/admin/*`) and the scanner (`/scan`). `src/lib/scan/` is the offline engine, independent of React: Dexie store (`db.ts`), sync loop (`sync.ts`), check-in actions (`actions.ts`), QR decoding via `zxing-wasm` (`detector.ts`). `vite-plugin-pwa` is deliberately `registerType: "prompt"`: the app must never swap versions by itself during the event.

### Offline check-in model (the part that needs several files to understand)

- Guests have a 6-char code (32-letter alphabet without I/O/0/1); the QR is just that code. The device looks it up in Dexie, so scan results never wait on the network.
- Check-ins are an **append-only event log** (`checkin_events`: kinds `checkin`, `undo`, `set_pax`), with client-generated UUID ids so retries are idempotent. Devices queue events in the Dexie `outbox`, `POST /sync/push`, then `GET /sync/snapshot?sinceRev&sinceSeq` to pull guests (by `guests.rev`) and other devices' events (by `checkin_events.seq`). Sent events stay in the outbox until they show up in pulled server data.
- There is no quota. Guests are single-person by default (check-in records pax 1); guests flagged `isRombongan` make the scanner ask the door staff for the headcount before the `checkin` event is written (`checkIn` returns `need_pax`).
- Duplicate scans across devices are resolved by the pure `resolveCheckins`: earliest `scannedAt` wins, the rest go to an admin review queue (`checkin_reviews`). The result must not depend on arrival order (there is a property test). Door staff may undo/change pax only on their own last check-in within 2 minutes (checked on client and server); anything else is admin-only.
- `scannedAt` = device clock + last known server offset. Sessions (time windows per group) only flag `outsideSession` in the log; the guard UI never warns about it.
- All writes to the check-in log go through `lockCheckinLog` (a Postgres advisory lock) so `seq` order equals commit order. Without it, devices pulling `seq > last` can skip events permanently. Keep this when adding writers.
- Walk-ins are created on the device with a UUID and no code; the server assigns the code on push and the device receives it in the next snapshot. Snapshots never include phone/Instagram.
- Breaking changes to push/snapshot shapes or Dexie schema require bumping `SYNC_PROTOCOL_VERSION` and a Dexie `version(n).upgrade()` that preserves the outbox; additive changes don't bump. Old clients must never lose outbox data. Schema is to be frozen at H-30 before the event.

## Conventions and gotchas

- Admin navigation: `xl`+ a grouped left sidebar (edit `navGroups` in `components/app-layout.tsx` when adding a menu); below `xl` a fixed bottom tab bar (Beranda/Tamu/Check-in/Undangan + "Lainnya" sheet). Mobile app feel: below `md` `Dialog` is a bottom sheet (form button row sticks to the bottom) and tables with the `table-cards` class turn into cards using each cell's `data-label` (add `data-label` to new columns; only the print page keeps its wide table). Guest pages have a bottom bar Tiket | Undangan. Mind `env(safe-area-inset-*)`, 44px touch targets and 16px inputs (iOS zooms below that).
- Biome: 2-space indent, width 100, double quotes, organized imports. `docs/` and `apps/api/drizzle/` are excluded.
- TypeScript is strict with `noUncheckedIndexedAccess` and `verbatimModuleSyntax`; use `import type` and `.js` extensions on relative imports in `apps/api`.
- `guests.rev` is bumped in code via `nextval` (not a trigger) on every change/delete/restore; any new guest write path must do the same or devices won't sync it.
- Admin form times are interpreted as WIB (UTC+7) and stored as UTC.
- Config is validated with Zod in `apps/api/src/config.ts`; `COOKIE_SECURE=true` is mandatory when `NODE_ENV=production`.
- Deployment (`docs/deploy.md`, `deploy/`): Docker Compose with a Caddy "edge" project plus `prod`/`staging` stacks behind Cloudflare. Never exercised on a real VPS yet; backups to R2 are not set up. Real-device behaviour (camera, Chrome Android, two physical phones) is also untested; the in-app "Uji Kesiapan" page exists for that.
