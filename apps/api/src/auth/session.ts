import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { and, eq, lt, ne } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { adminSessions, admins } from "../db/schema.js";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Sesi bergeser: diperpanjang hanya bila sisa masa berlakunya kurang dari setengah TTL.
const RENEW_BELOW_MS = SESSION_TTL_MS / 2;

export const generateToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(
  db: Db,
  input: { adminId: string; userAgent?: string | null; ip?: string | null },
  now = new Date(),
) {
  const token = generateToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const [row] = await db
    .insert(adminSessions)
    .values({
      adminId: input.adminId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: input.userAgent ?? null,
      // kolom inet menolak nilai bukan IP (mis. "unknown")
      ip: input.ip && isIP(input.ip) ? input.ip : null,
    })
    .returning({ id: adminSessions.id });
  if (!row) throw new Error("Gagal membuat sesi");
  return { token, sessionId: row.id, expiresAt };
}

export async function resolveSession(db: Db, token: string, now = new Date()) {
  const [row] = await db
    .select({ session: adminSessions, admin: admins })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .where(eq(adminSessions.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return null;

  if (row.session.expiresAt <= now) {
    await db.delete(adminSessions).where(eq(adminSessions.id, row.session.id));
    return null;
  }

  let expiresAt = row.session.expiresAt;
  let renewed = false;
  if (expiresAt.getTime() - now.getTime() < RENEW_BELOW_MS) {
    expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    renewed = true;
    await db.update(adminSessions).set({ expiresAt }).where(eq(adminSessions.id, row.session.id));
  }

  return {
    sessionId: row.session.id,
    admin: { id: row.admin.id, email: row.admin.email, name: row.admin.name },
    expiresAt,
    renewed,
  };
}

export async function deleteSession(db: Db, sessionId: string) {
  await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
}

export async function deleteOtherSessions(db: Db, adminId: string, keepSessionId: string) {
  await db
    .delete(adminSessions)
    .where(and(eq(adminSessions.adminId, adminId), ne(adminSessions.id, keepSessionId)));
}

export async function deleteExpiredSessions(db: Db, now = new Date()) {
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
}
