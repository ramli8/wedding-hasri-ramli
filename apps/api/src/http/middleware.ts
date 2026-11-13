import { randomUUID } from "node:crypto";
import { getConnInfo } from "@hono/node-server/conninfo";
import { type DeviceKind, MIN_SUPPORTED_SYNC_VERSION, SYNC_VERSION_HEADER } from "@wedding/shared";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { resolveSession } from "../auth/session.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { authenticateDevice } from "../services/devices.js";
import type { AppDeps, AppEnv } from "./env.js";
import { AppError } from "./errors.js";

const SESSION_COOKIE = "session";

export function setSessionCookie(c: Context, config: Config, token: string, expires: Date) {
  const options = { httpOnly: true, sameSite: "Lax", path: "/", expires } as const;
  // Di production cookie memakai prefix __Host- (wajib Secure, Path=/, tanpa Domain).
  if (config.cookieSecure) {
    setCookie(c, SESSION_COOKIE, token, { ...options, secure: true, prefix: "host" });
  } else {
    setCookie(c, SESSION_COOKIE, token, { ...options, secure: false });
  }
}

export function clearSessionCookie(c: Context, config: Config) {
  if (config.cookieSecure) {
    deleteCookie(c, SESSION_COOKIE, { path: "/", secure: true, prefix: "host" });
  } else {
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
  }
}

function readSessionToken(c: Context, config: Config) {
  return config.cookieSecure ? getCookie(c, SESSION_COOKIE, "host") : getCookie(c, SESSION_COOKIE);
}

/**
 * IP pengunjung untuk pembatas percobaan. Di produksi (TRUST_PROXY) dibaca dari `X-Client-Ip` yang
 * selalu ditimpa edge Caddy (lihat deploy/edge.Caddyfile): di sana Cf-Connecting-Ip hanya dipercaya
 * dari jaringan Cloudflare. `Cf-Connecting-Ip`/`X-Forwarded-For` tidak dibaca langsung karena bisa
 * dikirim sendiri oleh siapa pun yang menembak IP VPS tanpa lewat Cloudflare.
 */
export function clientIp(c: Context, trustProxy: boolean) {
  if (trustProxy) {
    const ip = c.req.header("x-client-ip")?.trim();
    if (ip) return ip;
  }
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

export const requestLogger =
  (logger: Logger): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    c.set("requestId", requestId);
    c.header("x-request-id", requestId);
    await next();
    logger.info(
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ms: Math.round(performance.now() - startedAt),
      },
      "request",
    );
  };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Menolak request yang mengubah data bila header Origin tidak berasal dari situs kita. */
export const originCheck =
  (allowedOrigins: string[]): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (!SAFE_METHODS.has(c.req.method)) {
      const origin = c.req.header("origin");
      if (!origin || !allowedOrigins.includes(origin)) {
        throw new AppError(403, "FORBIDDEN", "Origin tidak diizinkan");
      }
    }
    await next();
  };

export const requireAdmin =
  ({ db, config }: Pick<AppDeps, "db" | "config">): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const token = readSessionToken(c, config);
    const session = token ? await resolveSession(db, token) : null;
    if (!token || !session) {
      clearSessionCookie(c, config);
      throw new AppError(401, "UNAUTHENTICATED", "Silakan masuk terlebih dahulu");
    }
    if (session.renewed) setSessionCookie(c, config, token, session.expiresAt);
    c.set("admin", session.admin);
    c.set("sessionId", session.sessionId);
    await next();
  };

/** Perangkat harus mengirim versi protokolnya; versi terlalu lama diminta memperbarui aplikasi. */
export const requireSyncVersion: MiddlewareHandler<AppEnv> = async (c, next) => {
  const version = Number(c.req.header(SYNC_VERSION_HEADER));
  if (!Number.isInteger(version) || version < MIN_SUPPORTED_SYNC_VERSION) {
    throw new AppError(
      426,
      "APP_OUTDATED",
      `Aplikasi perlu diperbarui (versi protokol minimal ${MIN_SUPPORTED_SYNC_VERSION}).`,
    );
  }
  c.set("syncVersion", version);
  await next();
};

/** Token perangkat di header `Authorization: Bearer ...`. */
const KIND_LABEL: Record<DeviceKind, string> = {
  scanner: "scanner",
  booth: "photobooth",
  buwuh: "meja buwuh",
};

/** Token perangkat; `kind` membatasi jenisnya (booth tidak boleh menarik data tamu, dan sebaliknya). */
export const requireDevice =
  ({ db }: Pick<AppDeps, "db">, kind: DeviceKind): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const header = c.req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) throw new AppError(401, "UNAUTHENTICATED", "Perangkat belum dipasangkan");
    const device = await authenticateDevice(db, token);
    if (device.kind !== kind) {
      throw new AppError(
        403,
        "FORBIDDEN",
        `Perangkat ini dipasangkan sebagai ${KIND_LABEL[device.kind as DeviceKind]}, bukan ${KIND_LABEL[kind]}. Pasangkan ulang dengan kode baru.`,
      );
    }
    c.set("device", device);
    await next();
  };
