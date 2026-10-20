import { randomUUID } from "node:crypto";
import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { resolveSession } from "../auth/session.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
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

export function clientIp(c: Context, trustProxy: boolean) {
  if (trustProxy) {
    const cloudflare = c.req.header("cf-connecting-ip");
    if (cloudflare) return cloudflare.trim();
    const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
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
