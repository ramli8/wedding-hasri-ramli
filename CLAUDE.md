# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wedding system for Hasri & Ramli (event 21 May 2027): guest management, message links, and **offline-first QR check-in** for door staff. A ground-up rebuild on branch `rewrite`; the old Go + Next.js code lives only at tag `legacy-v1`. One wedding, no multi-tenancy, Indonesian UI only. Code comments, docs, error messages and commit messages are in Indonesian; match that.

`docs/rancangan.md` is the approved design (schema, API, offline sync, phases) and §14 records where the implementation deliberately diverged from it. Read it before changing sync, check-in or schema. The admin and scanner use real shadcn-admin components (Radix, TanStack Table, recharts) copied from satnaing/shadcn-admin; see `docs/design.md` for the layers, layout and page patterns. Guest-page styling is isolated in `guest.css` and `components/guest-ui/`.

Phases 1–5 (foundation, guests, scanner/check-in/devices/dashboard, e-ticket/RSVP, invitation content) are done. Phase 5 delivered the guestbook, the media system (admin uploads, stored on the server) and the admin menu "Undangan" with tabs for couple profile, story, gallery, digital envelope, FAQ, wishlist (guests claim items), layout (cover, live-stream link, section order/visibility) and guestbook replies; guests get everything on ONE full-width page, `/u/CODE/undangan` (`/u/CODE` redirects to it; no navbar, the poster links to the ticket). It is laid out as a film premiere (`.film` on top of `.mag`; Bebas Neue poster type, Cormorant Garamond text, Courier Prime for script/ticket/credits; dark `.reel` and light `.sand` sections alternate so the page is not gloomy) under `pages/ticket/issue/`: full-screen black-and-white movie poster with billing block, synopsis, screening schedule + countdown, cinema ticket (real QR) + RSVP, cast, story as screenplay scenes with letterbox photos and subtitles, film-strip gallery, gifts + wishlist, audience info (FAQ), guestbook, end credits. The owner rejected a magazine look and a dark minimalist look before choosing this. Sample photos come from the gitignored `src/assets/contoh/` (another couple's photos used only as style reference; never commit them), with SVG placeholders when absent. For now it renders static sample content from `issue/content.ts` and does NOT read the database (the old API-wired `ticket-page.tsx`, `invitation-sections.tsx`, `wishlist-section.tsx`, `guestbook-card.tsx`, `rsvp-card.tsx`, `event-card.tsx` are unused until data is wired back; new DB columns are allowed). Admin and `/scan` use the shadcn-admin look. Decisions are in `docs/rancangan.md` §14 (Fase 5). Phase 6 is in progress: received gifts (`/admin/hadiah`: envelopes, transfers and items given, with a thanked flag) and vendors with their payments (`/admin/vendor`: categories, candidates, one selected per category, payment status from contract vs. payments) are done. Don't propose other stacks or dropped features (dynamic RBAC, Google OAuth, multi-tenant, seating plans).

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
- `pnpm e2e:load` is a load test (no browser): production API pinned to 2 cores, 500 guests + 300 curious visitors in 10 s plus door devices; checks p95 and data integrity. Results and knobs in `e2e/README.md`.
- `pnpm e2e` / `pnpm e2e:qr` drive headless Firefox against a production web build (puppeteer-core), using a separate `wedding_e2e` database. Not run in CI; run manually after big scanner/sync changes. See `e2e/README.md`.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, build. It has never actually run on GitHub.

## Architecture

pnpm workspace: `apps/api`, `apps/web`, `packages/shared`.

**`packages/shared`** is the contract: Zod schemas and inferred types used by both API (validation, via `http/validate.ts`) and web. Exported as raw TypeScript (`exports: ./src/index.ts`, no build step). It also holds the pure check-in conflict logic (`resolveCheckins` in `src/checkin.ts`), the sync protocol constants (`SYNC_PROTOCOL_VERSION`, `MIN_SUPPORTED_SYNC_VERSION`) and phone/Instagram normalizers. API shapes change here first.

**`apps/api`** (Hono + Drizzle + postgres.js). `createApp(deps)` in `src/app.ts` mounts `/api/v1/{auth,admin,device,sync,public}` plus `/api/health`; `deps` = `{ db, config, logger }` is passed to every route factory, which is how tests build isolated apps. Layering: `routes/` (HTTP + validation) → `services/` (logic, Drizzle queries) → `db/schema.ts`. Migrations in `apps/api/drizzle/` are generated, committed, and applied automatically at startup (`db/migrate.ts`). There are three auth worlds:
- Admin: cookie session (`__Host-session` in production), `originCheck` on all mutating requests, in-memory login rate limiter. Everything under `/api/v1/admin/*`.
- Device (door staff and photobooth): `Authorization: Bearer <device token>`; `/device/pair`, `/sync/*` (also needs the `x-sync-version` header) and `/booth/*`. `devices.kind` is set at pairing (`scanner` default, `booth` from `/booth/pasang`) and `requireDevice(deps, kind)` returns `403 FORBIDDEN` for the wrong kind, so a booth laptop in a public spot cannot pull the guest list. Staff have no accounts. Devices are registered with **single-use pairing codes** (never a static PIN) so each device can be revoked individually; revoked devices get `401 DEVICE_REVOKED`, too-old clients `426 APP_OUTDATED`.
- Images (`media` table + files under `MEDIA_DIR/<id>/{large,thumb}.webp`, processed by the native `sharp` module, which is external in the API bundle and installed in the Docker image): served without login at `/media/:id/:file` (outside `/api`, immutable cache). The `large` variant is deliberately full-resolution near-lossless: the owner does not want photos visibly compressed, so do not downscale or switch it to plain lossy WebP. One image has one owner; register every new photo column in `MEDIA_USERS` (`services/media.ts`) and call `discardMedia` when replacing or deleting.
- Link previews: `/u/KODE` and `/u/KODE/undangan` are served by the API (`routes/share.ts`), which fetches the web `index.html` (`WEB_INDEX_URL`, cached 30 s) and injects per-guest Open Graph tags (title/description templates with `{panggilan}`/`{mempelai}`, image = the `thumb` variant, absolute URL from `settings.publicBaseUrl`). Settings live in `settings.seo_*` columns and admin page `/admin/pengaturan/pratinjau`; in production Caddy must route `/u/*` to the API (`deploy/web.Caddyfile`). Without `WEB_INDEX_URL` (dev) the route answers 503 and Vite serves the SPA directly.
- Guests (`/api/v1/public/*`): no login; the 6-char guest code in the request is the credential. Two in-memory limiters: wrong-code guesses per IP (also on `/u/KODE` link previews), and RSVP/guestbook/wishlist-claim submissions per guest code (not per IP: CGNAT and venue Wi-Fi share IPs). The IP comes from `X-Client-Ip`, set by the edge Caddy (`clientIp` in `http/middleware.ts`); never read `Cf-Connecting-Ip`/`X-Forwarded-For` directly. Responses never include phone/Instagram. The guest pages are `/u/CODE` (e-ticket QR, events, RSVP) and `/u/CODE/undangan` (couple, story, gallery, envelope, wishlist claims, FAQ, guestbook) in the web app.

**`apps/web`** (Vite + React 19 + TanStack Router/Query + Tailwind 4, own UI components in `components/ui`, no shadcn). One PWA serves the admin (`/admin/*`) and the scanner (`/scan`). `src/lib/scan/` is the offline engine, independent of React: Dexie store (`db.ts`), sync loop (`sync.ts`), check-in actions (`actions.ts`), QR decoding via `zxing-wasm` (`detector.ts`). `vite-plugin-pwa` is deliberately `registerType: "prompt"`: the app must never swap versions by itself during the event.

### Offline check-in model (the part that needs several files to understand)

- Guests have a 6-char code (32-letter alphabet without I/O/0/1); the QR is just that code. The device looks it up in Dexie, so scan results never wait on the network.
- Check-ins are an **append-only event log** (`checkin_events`: kinds `checkin`, `undo`, `set_pax`), with client-generated UUID ids so retries are idempotent. Devices queue events in the Dexie `outbox`, `POST /sync/push`, then `GET /sync/snapshot?sinceRev&sinceSeq` to pull guests (by `guests.rev`) and other devices' events (by `checkin_events.seq`). Sent events stay in the outbox until they show up in pulled server data.
- There is no quota. Guests are single-person by default (check-in records pax 1); guests flagged `isRombongan` make the scanner ask the door staff for the headcount before the `checkin` event is written (`checkIn` returns `need_pax`).
- Duplicate scans across devices are resolved by the pure `resolveCheckins`: earliest `scannedAt` wins, the rest go to an admin review queue (`checkin_reviews`). The result must not depend on arrival order (there is a property test). Door staff may undo/change pax only on their own last check-in within 2 minutes (checked on client and server); anything else is admin-only.
- `scannedAt` = device clock + last known server offset. Sessions (time windows per group) only flag `outsideSession` in the log; the guard UI never warns about it.
- All writes to the check-in log go through `lockCheckinLog` (a Postgres advisory lock) so `seq` order equals commit order. Without it, devices pulling `seq > last` can skip events permanently. Keep this when adding writers.
- Re-pairing a device (`repairDevice`, scanner; `pairBooth`, booth) keeps unsent outbox/walk-ins/photos and re-downloads everything else; releasing (`releaseDevice`/`releaseBooth`) refuses inside the same transaction while anything is unsent. Never wipe unsent device data on pairing.
- Walk-ins are created on the device with a UUID and no code; the server assigns the code on push and the device receives it in the next snapshot. Snapshots never include phone/Instagram.
- Breaking changes to push/snapshot shapes or Dexie schema require bumping `SYNC_PROTOCOL_VERSION` and a Dexie `version(n).upgrade()` that preserves the outbox; additive changes don't bump. Old clients must never lose outbox data. Schema is to be frozen at H-30 before the event.

## Conventions and gotchas

- Admin navigation: shadcn-admin `SidebarProvider` layout in `components/app-layout.tsx`; menu lives in `components/layout/sidebar-data.ts` (`navGroups`); below `md` the sidebar is a left drawer. Mobile app feel: below `md` `Dialog` is a bottom sheet (form button row sticks to the bottom) and `DataTable` tables turn into cards (`table-cards` CSS; each cell's `data-label` is filled automatically from the column header, roles via `meta.card`; only the print page keeps its wide table). Successful mutations show a "Tersimpan" toast (`meta.toast` to override), dialogs ask before discarding typed input, and forms use `FormFooter`/`isAgain` for "Simpan & tambah lagi", `Field required`, `MoneyInput` for rupiah. Mind `env(safe-area-inset-*)`, 44px touch targets and 16px inputs (iOS zooms below that).
- Biome: 2-space indent, width 100, double quotes, organized imports. `docs/` and `apps/api/drizzle/` are excluded.
- TypeScript is strict with `noUncheckedIndexedAccess` and `verbatimModuleSyntax`; use `import type` and `.js` extensions on relative imports in `apps/api`.
- `guests.rev` is bumped in code via `nextval` (not a trigger) on every change/delete/restore; any new guest write path must do the same, inside a transaction that first calls `lockGuestRev` (so rev order equals commit order, like `lockCheckinLog` for `seq`), or devices won't sync it. Snapshots read the max rev/seq before the rows and cap rows at it.
- Admin form times are interpreted as WIB (UTC+7) and stored as UTC.
- Production sends a strict CSP (`deploy/web.Caddyfile`, mirrored in `vite.config.ts` `preview.headers` so `pnpm e2e` tests it): everything from the own origin, no CDNs, no inline scripts, no eval (Zod runs `jitless`, see `lib/zod-config.ts`). Links built from data go through `safeHref` (http/https only); URL schemas use `z.url({ protocol: /^https?$/ })`, never bare `z.url()`.
- Hardening (details in `docs/deploy.md` §7): the edge Caddy drops any request not coming from Cloudflare IPs (`EXTRA_ALLOWED_IPS` to bypass), sets connection timeouts, and is the only service with published ports. In the API, `/api/*` bodies are capped at 4 MB in `app.ts` (uploads have their own `bodyLimit`), routes without login (`/api/v1/{public,auth,device}/`, `/u/`) allow 1200 requests/min per IP, guest routes (`/api/v1/public/`, `/u/`) hold at most 6 DB connections at once so door devices and admin always get the rest of the pool of 10, `GET /public/invitation` is served from `createInvitationCache` (pre-serialized JSON, invalidated by any admin mutation and by wishlist claims), Argon2 runs at most 4 at a time (`auth/password.ts`), Postgres has `statement_timeout` 30 s, and containers have `mem_limit`/`cpus`/`pids_limit`.
- Config is validated with Zod in `apps/api/src/config.ts`; `COOKIE_SECURE=true` is mandatory when `NODE_ENV=production`.
- Deployment (`docs/deploy.md`, `deploy/`): Docker Compose with a Caddy "edge" project plus `prod`/`staging` stacks behind Cloudflare. Never exercised on a real VPS yet; backups to R2 are set up (`deploy/backup/`, `docs/backup.md`: pg_dump + media copy via rclone, tested locally and restored into a fresh DB, but never run against real R2). Real-device behaviour (camera, Chrome Android, two physical phones) is also untested; the in-app "Uji Kesiapan" page exists for that.
