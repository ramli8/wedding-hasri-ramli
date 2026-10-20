import postgres from "postgres";
import { createDb } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrate.js";
import { TEST_DATABASE_URL } from "./helpers.js";

// Membuat database tes bila belum ada, lalu menjalankan migrasi.
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.slice(1);
  url.pathname = "/postgres";

  const admin = postgres(url.toString(), { max: 1 });
  const exists = await admin`select 1 from pg_database where datname = ${dbName}`;
  if (exists.length === 0) await admin.unsafe(`create database "${dbName}"`);
  await admin.end();

  const { db, close } = createDb(TEST_DATABASE_URL);
  await runMigrations(db, "drizzle");
  await close();
}
