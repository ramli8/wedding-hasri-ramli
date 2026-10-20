import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Db = PostgresJsDatabase<typeof schema>;

export function createDb(url: string) {
  const client = postgres(url, { max: 10 });
  const db: Db = drizzle(client, { schema, casing: "snake_case" });
  return { db, close: () => client.end({ timeout: 5 }) };
}
