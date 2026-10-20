import { sql } from "drizzle-orm";
import { check, inet, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull(),
  passwordHash: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: uuid().primaryKey().defaultRandom(),
  adminId: uuid()
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  // sha256 dari token di cookie; token mentah tidak pernah disimpan
  tokenHash: text().notNull().unique("admin_sessions_token_hash_unique"),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  userAgent: text(),
  ip: inet(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Konfigurasi pernikahan: selalu satu baris.
export const settings = pgTable(
  "settings",
  {
    id: smallint().primaryKey().default(1),
    groomName: text().notNull(),
    brideName: text().notNull(),
    publicBaseUrl: text().notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("settings_singleton", sql`${table.id} = 1`)],
);
