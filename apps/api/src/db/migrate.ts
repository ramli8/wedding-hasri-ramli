import { resolve } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { Db } from "./client.js";

export async function runMigrations(db: Db, migrationsDir: string) {
  await migrate(db, { migrationsFolder: resolve(migrationsDir) });
}
