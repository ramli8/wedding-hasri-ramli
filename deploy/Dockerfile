# Build dari root repo:  docker build -f deploy/Dockerfile --target api .
#                        docker build -f deploy/Dockerfile --target web .

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @wedding/api build && pnpm --filter @wedding/web build

# --- API ---------------------------------------------------------------
FROM node:24-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
# Modul native tidak ikut dibundel; versinya harus sama dengan pnpm-lock.yaml.
RUN npm install --no-save --no-audit --no-fund @node-rs/argon2@2.2.2
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/drizzle ./drizzle
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]

# --- Web (file statis + proxy /api ke API) ------------------------------
FROM caddy:2-alpine AS web
COPY deploy/web.Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/web/dist /srv
EXPOSE 80
