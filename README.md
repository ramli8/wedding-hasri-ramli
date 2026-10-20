<h1 align="center">Bantu doa ya agar cepat selesai project nya 😁</h1>

Undangan, manajemen tamu, dan check-in QR offline-first untuk pernikahan 21 Mei 2027.
Rancangan lengkap: [docs/rancangan.md](docs/rancangan.md). Desain admin: [docs/design.md](docs/design.md).
Kode versi lama ada di tag `legacy-v1`.

## Struktur

```
apps/api         Hono + Drizzle + PostgreSQL (Node 24)
apps/web         Vite + React: admin, scanner (PWA), e-ticket, undangan
packages/shared  skema Zod dan tipe yang dipakai api dan web
deploy/          Dockerfile, compose (stack + edge), Caddy
docs/            rancangan dan panduan deploy
```

## Pengembangan lokal

Butuh Node 24 (`.nvmrc`), pnpm (`corepack enable`), dan Docker.

```bash
pnpm install
cp .env.example .env
pnpm dev:db                                   # Postgres di localhost:5433
pnpm --filter @wedding/api admin:create --email kamu@contoh.com --name "Nama"
pnpm dev:api                                  # http://localhost:3000 (migrasi jalan otomatis)
pnpm dev:web                                  # http://localhost:5173/admin
```

| Perintah | Fungsi |
|---|---|
| `pnpm lint` / `pnpm format` | Biome (periksa / perbaiki) |
| `pnpm typecheck` | `tsc` di semua paket |
| `pnpm test` | Vitest (API memakai database `wedding_test` di Postgres dev, dibuat otomatis) |
| `pnpm build` | Build api (esbuild) dan web (Vite) |
| `pnpm --filter @wedding/api db:generate` | Buat migrasi Drizzle dari perubahan `src/db/schema.ts` |

Deploy ke VPS: [docs/deploy.md](docs/deploy.md).
