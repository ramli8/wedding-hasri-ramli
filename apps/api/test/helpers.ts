import { sql } from "drizzle-orm";
import { createApp } from "../src/app.js";
import { hashPassword } from "../src/auth/password.js";
import { loadConfig } from "../src/config.js";
import { createDb } from "../src/db/client.js";
import { admins } from "../src/db/schema.js";
import { createLogger } from "../src/logger.js";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://wedding:wedding@localhost:5433/wedding_test";

export const ORIGIN = "http://localhost:5173";
export const PASSWORD = "kata-sandi-panjang-1";

export function createTestContext(overrides: Record<string, string> = {}) {
  const config = loadConfig({
    NODE_ENV: "test",
    DATABASE_URL: TEST_DATABASE_URL,
    ALLOWED_ORIGINS: ORIGIN,
    ...overrides,
  });
  const { db, close } = createDb(config.databaseUrl);
  const logger = createLogger(config);
  // Pembatas login hidup di dalam app, jadi tiap tes sebaiknya memakai app baru.
  const makeApp = () => createApp({ db, config, logger });
  return { makeApp, db, config, close };
}

export async function resetDb(db: ReturnType<typeof createDb>["db"]) {
  await db.execute(sql`truncate table admins cascade`);
}

export async function insertAdmin(
  db: ReturnType<typeof createDb>["db"],
  input: { email?: string; name?: string; password?: string } = {},
) {
  const [admin] = await db
    .insert(admins)
    .values({
      email: input.email ?? "ramli@example.com",
      name: input.name ?? "Ramli",
      passwordHash: await hashPassword(input.password ?? PASSWORD),
    })
    .returning();
  if (!admin) throw new Error("gagal membuat admin tes");
  return admin;
}

type App = ReturnType<ReturnType<typeof createTestContext>["makeApp"]>;

export function post(app: App, path: string, body: unknown, headers: Record<string, string> = {}) {
  return app.request(path, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

/** Mengambil pasangan nama=nilai dari header Set-Cookie untuk dikirim kembali. */
export function cookieFrom(res: Response) {
  const raw = res.headers.get("set-cookie");
  if (!raw) throw new Error("tidak ada Set-Cookie");
  return raw.split(";")[0] as string;
}

export async function login(app: App, email = "ramli@example.com", password = PASSWORD) {
  const res = await post(app, "/api/v1/auth/login", { email, password });
  return { res, cookie: res.ok ? cookieFrom(res) : "" };
}
