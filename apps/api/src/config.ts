import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  COOKIE_SECURE: z.stringbool().default(false),
  TRUST_PROXY: z.stringbool().default(false),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  MIGRATIONS_DIR: z.string().default("drizzle"),
  APP_VERSION: z.string().default("dev"),
});

export function loadConfig(source: Record<string, string | undefined> = process.env) {
  const parsed = configSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Konfigurasi tidak valid:\n${z.prettifyError(parsed.error)}`);
  }
  const v = parsed.data;
  if (v.NODE_ENV === "production" && !v.COOKIE_SECURE) {
    throw new Error("COOKIE_SECURE harus true di production");
  }
  return {
    env: v.NODE_ENV,
    port: v.PORT,
    databaseUrl: v.DATABASE_URL,
    cookieSecure: v.COOKIE_SECURE,
    trustProxy: v.TRUST_PROXY,
    allowedOrigins: v.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    logLevel: v.LOG_LEVEL,
    migrationsDir: v.MIGRATIONS_DIR,
    version: v.APP_VERSION,
  };
}

export type Config = ReturnType<typeof loadConfig>;
