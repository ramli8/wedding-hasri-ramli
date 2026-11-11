import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Db = PostgresJsDatabase<typeof schema>;

export function createDb(url: string) {
  const client = postgres(url, {
    max: 10,
    connection: {
      // Kueri yang macet (mis. dipicu permintaan berat berulang) dihentikan, bukan menahan
      // koneksi pool selamanya sampai API berhenti menjawab. Ekspor/impor terbesar jauh di bawahnya.
      statement_timeout: 30_000,
      // Transaksi yang ditinggal terbuka melepas kuncinya (termasuk kunci log check-in).
      idle_in_transaction_session_timeout: 60_000,
    },
  });
  const db: Db = drizzle(client, { schema, casing: "snake_case" });
  return { db, close: () => client.end({ timeout: 5 }) };
}
