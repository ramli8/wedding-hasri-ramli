import { changePasswordRequestSchema, loginRequestSchema, type MeResponse } from "@wedding/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { FailureLimiter } from "../auth/rate-limit.js";
import { createSession, deleteOtherSessions, deleteSession } from "../auth/session.js";
import { admins } from "../db/schema.js";
import type { AppDeps, AppEnv } from "../http/env.js";
import { AppError } from "../http/errors.js";
import {
  clearSessionCookie,
  clientIp,
  originCheck,
  requireAdmin,
  setSessionCookie,
} from "../http/middleware.js";
import { validate } from "../http/validate.js";

const WINDOW_MS = 15 * 60 * 1000;

export function authRoutes(deps: AppDeps) {
  const { db, config } = deps;
  const ipLimiter = new FailureLimiter({ max: 20, windowMs: WINDOW_MS });
  const emailLimiter = new FailureLimiter({ max: 5, windowMs: WINDOW_MS });

  return new Hono<AppEnv>()
    .use("*", originCheck(config.allowedOrigins))

    .post("/login", validate("json", loginRequestSchema), async (c) => {
      const { email, password } = c.req.valid("json");
      const ip = clientIp(c, config.trustProxy);

      if (ipLimiter.isBlocked(ip) || emailLimiter.isBlocked(email)) {
        throw new AppError(429, "RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.");
      }

      const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
      const valid = await verifyPassword(admin?.passwordHash ?? null, password);
      if (!admin || !valid) {
        ipLimiter.recordFailure(ip);
        emailLimiter.recordFailure(email);
        throw new AppError(401, "INVALID_CREDENTIALS", "Email atau kata sandi salah");
      }

      emailLimiter.reset(email);
      const session = await createSession(db, {
        adminId: admin.id,
        userAgent: c.req.header("user-agent"),
        ip,
      });
      setSessionCookie(c, config, session.token, session.expiresAt);
      return c.json({
        admin: { id: admin.id, email: admin.email, name: admin.name },
      } satisfies MeResponse);
    })

    .post("/logout", requireAdmin(deps), async (c) => {
      await deleteSession(db, c.get("sessionId"));
      clearSessionCookie(c, config);
      return c.json({ ok: true });
    })

    .get("/me", requireAdmin(deps), (c) => {
      return c.json({ admin: c.get("admin") } satisfies MeResponse);
    })

    .post(
      "/change-password",
      requireAdmin(deps),
      validate("json", changePasswordRequestSchema),
      async (c) => {
        const { currentPassword, newPassword } = c.req.valid("json");
        const { id } = c.get("admin");

        const [admin] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
        if (!admin || !(await verifyPassword(admin.passwordHash, currentPassword))) {
          throw new AppError(400, "VALIDATION_ERROR", "Kata sandi saat ini salah");
        }

        await db
          .update(admins)
          .set({ passwordHash: await hashPassword(newPassword) })
          .where(eq(admins.id, id));
        await deleteOtherSessions(db, id, c.get("sessionId"));
        return c.json({ ok: true });
      },
    );
}
