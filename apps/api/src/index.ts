import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { deleteExpiredSessions } from "./auth/session.js";
import { loadConfig } from "./config.js";
import { createDb } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";
import { createLogger } from "./logger.js";

const config = loadConfig();
const logger = createLogger(config);
const { db, close } = createDb(config.databaseUrl);

await runMigrations(db, config.migrationsDir);
logger.info("migrasi selesai");

const app = createApp({ db, config, logger });
const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  logger.info({ port: info.port, version: config.version }, "api berjalan");
});
// Koneksi yang mengirim header/body sangat lambat (slowloris) tidak boleh menahan slot selamanya.
// Unggahan foto lewat sinyal seluler diberi waktu sampai 2 menit, sama dengan edge Caddy.
if ("headersTimeout" in server) {
  server.headersTimeout = 15_000;
  server.requestTimeout = 120_000;
  // Lebih lama dari idle Caddy di depannya, agar Caddy yang menutup koneksi lebih dulu.
  server.keepAliveTimeout = 130_000;
}

const cleanup = setInterval(
  () => {
    deleteExpiredSessions(db).catch((err) => logger.error({ err }, "gagal membersihkan sesi"));
  },
  60 * 60 * 1000,
);
cleanup.unref();

function shutdown(signal: string) {
  logger.info({ signal }, "mematikan api");
  clearInterval(cleanup);
  server.close(() => {
    close().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
