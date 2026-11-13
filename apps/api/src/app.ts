import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { RequestCounter } from "./auth/rate-limit.js";
import type { AppDeps, AppEnv } from "./http/env.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";
import { clientIp, requestLogger } from "./http/middleware.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { boothRoutes } from "./routes/booth.js";
import { buwuhRoutes } from "./routes/buwuh.js";
import { deviceRoutes, syncRoutes } from "./routes/device.js";
import { healthRoutes } from "./routes/health.js";
import { manifestRoutes } from "./routes/manifest.js";
import { mediaPublicRoutes } from "./routes/media.js";
import { publicRoutes } from "./routes/public.js";
import { photoShareRoutes, shareRoutes } from "./routes/share.js";
import { siteIconRoutes } from "./routes/site-icon.js";
import { createInvitationCache } from "./services/layout.js";

/** Rute unggahan berkas (multipart) yang memasang bodyLimit-nya sendiri. */
const UPLOAD_PATHS = new Set(["/api/v1/admin/media", "/api/v1/booth/photos"]);

/** CSV impor tamu maksimal 2 MB (dikirim sebagai string JSON), push sinkron jauh di bawahnya. */
const jsonLimit = bodyLimit({
  maxSize: 4 * 1024 * 1024,
  onError: (c) =>
    c.json({ error: { code: "VALIDATION_ERROR", message: "Permintaan terlalu besar" } }, 413),
});

/**
 * Rute tanpa login (tamu, login, pairing, pratinjau tautan) dibatasi jumlah permintaannya per IP.
 * Ini lapisan terakhir setelah Cloudflare: menahan satu sumber yang membanjiri API sampai database
 * kewalahan. Batasnya longgar karena tamu di gedung bisa berbagi satu IP (Wi-Fi, CGNAT).
 */
// Diuji dengan `pnpm e2e:load`: 300/menit memblokir 100 tamu yang berbagi satu IP saat undangan
// baru disebar (±8 permintaan per tamu). 1200/menit (20/detik terus-menerus) tetap menahan banjir
// dari satu mesin; pembatasan yang lebih halus dilakukan aturan rate limiting Cloudflare.
export const PUBLIC_REQUESTS_PER_MINUTE = 1200;
const LIMITED_PREFIXES = ["/api/v1/public/", "/api/v1/auth/", "/api/v1/device/", "/u/", "/foto/"];

/**
 * Rute tamu (`/api/v1/public/`, `/u/`) boleh memakai paling banyak sekian koneksi database
 * sekaligus (pool = 10). Sisanya selalu tersedia untuk HP pintu, laptop booth, dan admin, jadi
 * check-in tetap sinkron walau ribuan orang membuka undangan bersamaan. Kelebihan permintaan tamu
 * mengantre; bila antrean terlalu panjang dijawab 503 agar memori tidak habis.
 */
const GUEST_CONCURRENCY = 6;
const GUEST_QUEUE_MAX = 5_000;
const GUEST_PREFIXES = ["/api/v1/public/", "/u/", "/foto/"];

function concurrencyGate(max: number, queueMax: number) {
  let running = 0;
  const waiting: (() => void)[] = [];
  return async (task: () => Promise<void>): Promise<boolean> => {
    if (running >= max) {
      if (waiting.length >= queueMax) return false;
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
    running += 1;
    try {
      await task();
    } finally {
      running -= 1;
      waiting.shift()?.();
    }
    return true;
  };
}

export function createApp(deps: AppDeps) {
  const guestGate = concurrencyGate(GUEST_CONCURRENCY, GUEST_QUEUE_MAX);
  const counter = new RequestCounter({ max: PUBLIC_REQUESTS_PER_MINUTE, windowMs: 60_000 });
  const invitation = createInvitationCache(deps.db);
  const v1 = new Hono<AppEnv>()
    .route("/auth", authRoutes(deps))
    .route("/admin", adminRoutes(deps, invitation.invalidate))
    .route("/public", publicRoutes(deps, invitation))
    .route("/device", deviceRoutes(deps))
    .route("/sync", syncRoutes(deps))
    .route("/booth", boothRoutes(deps))
    .route("/buwuh", buwuhRoutes(deps));

  const api = new Hono<AppEnv>().route("/", healthRoutes(deps)).route("/v1", v1);

  return (
    new Hono<AppEnv>()
      .use("*", requestLogger(deps.logger))
      .use("*", async (c, next) => {
        if (!LIMITED_PREFIXES.some((prefix) => c.req.path.startsWith(prefix))) return next();
        if (counter.hit(clientIp(c, deps.config.trustProxy))) return next();
        c.header("retry-after", "60");
        return c.json(
          {
            error: {
              code: "RATE_LIMITED",
              message: "Terlalu banyak permintaan. Coba lagi sebentar.",
            },
          },
          429,
        );
      })
      .use("*", async (c, next) => {
        if (!GUEST_PREFIXES.some((prefix) => c.req.path.startsWith(prefix))) return next();
        // Isi undangan dilayani dari cache (lihat createInvitationCache), tidak perlu mengantre.
        if (c.req.path === "/api/v1/public/invitation") return next();
        if (await guestGate(next)) return;
        c.header("retry-after", "10");
        return c.json(
          { error: { code: "RATE_LIMITED", message: "Server sedang ramai. Coba lagi sebentar." } },
          503,
        );
      })
      // Tanpa batas ini, satu permintaan JSON raksasa ke endpoint publik (tanpa login) dibaca utuh ke
      // memori dan bisa menjatuhkan API. Unggahan gambar punya batas sendiri yang lebih besar.
      .use("/api/*", async (c, next) => {
        if (UPLOAD_PATHS.has(c.req.path)) return next();
        return jsonLimit(c, next);
      })
      .route("/api", api)
      .route("/media", mediaPublicRoutes(deps))
      .route("/site-icon", siteIconRoutes(deps))
      .route("/manifest.webmanifest", manifestRoutes(deps))
      .route("/u", shareRoutes(deps))
      .route("/foto", photoShareRoutes(deps))
      .onError(errorHandler(deps.logger))
      .notFound(notFoundHandler)
  );
}

export type App = ReturnType<typeof createApp>;
