import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  bigserial,
  boolean,
  check,
  index,
  inet,
  integer,
  pgSequence,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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

export const events = pgTable(
  "events",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique("events_slug_unique"),
    name: text().notNull(),
    startsAt: timestamp({ withTimezone: true }),
    endsAt: timestamp({ withTimezone: true }),
    venueName: text(),
    address: text(),
    mapsUrl: text(),
    checkinEnabled: boolean().notNull().default(false),
    hasRsvp: boolean().notNull().default(false),
  },
  (table) => [
    check(
      "events_time_order",
      sql`${table.startsAt} is null or ${table.endsAt} is null or ${table.endsAt} >= ${table.startsAt}`,
    ),
  ],
);

// Template pesan undangan per acara (variabel: lihat MESSAGE_TEMPLATE_VARIABLES).
export const messageTemplates = pgTable("message_templates", {
  eventId: uuid()
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  body: text().notNull(),
});

export const guestGroups = pgTable("guest_groups", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique("guest_groups_name_unique"),
  color: text().notNull().default("#737373"),
  isVip: boolean().notNull().default(false),
});

// Jam sesi kelompok per acara, mis. kelompok Surabaya 10.00–12.00 di resepsi.
export const groupSessions = pgTable(
  "group_sessions",
  {
    groupId: uuid()
      .notNull()
      .references(() => guestGroups.id, { onDelete: "cascade" }),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.eventId] }),
    check("group_sessions_time_order", sql`${table.endsAt} > ${table.startsAt}`),
  ],
);

// Penanda perubahan tamu untuk sinkronisasi delta ke perangkat (fase 3).
export const guestRevSeq = pgSequence("guest_rev_seq");

export const guests = pgTable(
  "guests",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Diberikan server; tamu walk-in yang dibuat offline mendapat kode saat sinkronisasi.
    code: text().unique("guests_code_unique"),
    displayName: text().notNull(),
    phone: text(),
    instagram: text(),
    groupId: uuid().references(() => guestGroups.id),
    isRombongan: boolean().notNull().default(false),
    usherNote: text(),
    source: text().notNull().default("admin"),
    rev: bigint({ mode: "number" }).notNull().default(sql`nextval('guest_rev_seq')`),
    deletedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("guests_rev_idx").on(table.rev),
    index("guests_group_idx").on(table.groupId),
    check("guests_code_length", sql`${table.code} is null or length(${table.code}) = 6`),
    check("guests_source_valid", sql`${table.source} in ('admin', 'import', 'walkin')`),
    check(
      "guests_has_contact",
      sql`${table.source} = 'walkin' or ${table.phone} is not null or ${table.instagram} is not null`,
    ),
  ],
);

// Siapa diundang ke acara apa, dan apakah pesannya sudah dikirim.
export const guestEvents = pgTable(
  "guest_events",
  {
    guestId: uuid()
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    sentAt: timestamp({ withTimezone: true }),
    sentVia: text(),
  },
  (table) => [
    primaryKey({ columns: [table.guestId, table.eventId] }),
    check(
      "guest_events_sent_via_valid",
      sql`${table.sentVia} is null or ${table.sentVia} in ('whatsapp', 'instagram', 'other')`,
    ),
  ],
);

// Perangkat penjaga pintu (HP atau laptop). Tidak punya akun: dikenali lewat token yang
// ditukar dari kode pairing sekali pakai.
export const devices = pgTable(
  "devices",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    pairingCodeHash: text().unique("devices_pairing_code_hash_unique"),
    pairingExpiresAt: timestamp({ withTimezone: true }),
    tokenHash: text().unique("devices_token_hash_unique"),
    status: text().notNull().default("pending"),
    appVersion: text(),
    protocolVersion: integer(),
    lastSeenAt: timestamp({ withTimezone: true }),
    lastSyncAt: timestamp({ withTimezone: true }),
    pendingOutbox: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("devices_status_valid", sql`${table.status} in ('pending', 'active', 'revoked')`),
  ],
);

// Log check-in yang hanya bertambah. Status tamu dihitung dari log ini (lihat resolveCheckins),
// bukan ditimpa, sehingga event dari banyak perangkat bisa digabung dalam urutan apa pun.
export const checkinEvents = pgTable(
  "checkin_events",
  {
    // Urutan penerimaan oleh server; perangkat menarik event baru dengan `seq > sinceSeq`.
    seq: bigserial({ mode: "number" }).notNull(),
    // Dibuat perangkat (uuid v7), sehingga mengirim ulang event yang sama tidak membuat data ganda.
    id: uuid().primaryKey(),
    kind: text().notNull(),
    guestId: uuid()
      .notNull()
      .references(() => guests.id),
    eventId: uuid()
      .notNull()
      .references(() => events.id),
    targetId: uuid().references((): AnyPgColumn => checkinEvents.id),
    pax: integer(),
    method: text(),
    deviceId: uuid().references(() => devices.id),
    adminId: uuid().references(() => admins.id),
    scannedAt: timestamp({ withTimezone: true }).notNull(),
    deviceTime: timestamp({ withTimezone: true }),
    receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    outsideSession: boolean().notNull().default(false),
  },
  (table) => [
    index("checkin_events_seq_idx").on(table.seq),
    index("checkin_events_guest_idx").on(table.guestId, table.eventId, table.scannedAt),
    check("checkin_events_kind_valid", sql`${table.kind} in ('checkin', 'undo', 'set_pax')`),
    check(
      "checkin_events_shape",
      sql`(${table.kind} = 'checkin' and ${table.pax} >= 1 and ${table.method} is not null and ${table.targetId} is null)
        or (${table.kind} = 'undo' and ${table.targetId} is not null)
        or (${table.kind} = 'set_pax' and ${table.targetId} is not null and ${table.pax} >= 1)`,
    ),
  ],
);

// Gambar unggahan admin. Berkasnya ada di disk (config.mediaDir/<id>/{large,thumb}.webp), bukan di
// database. Satu baris dimiliki satu tempat (foto mempelai, butir cerita, dst.).
export const media = pgTable("media", {
  id: uuid().primaryKey().defaultRandom(),
  width: integer().notNull(),
  height: integer().notNull(),
  bytes: integer().notNull(),
  originalName: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Profil mempelai untuk undangan: satu baris per peran.
export const coupleProfiles = pgTable(
  "couple_profiles",
  {
    role: text().primaryKey(),
    fullName: text().notNull(),
    nickname: text(),
    parents: text(),
    bio: text(),
    instagram: text(),
    photoMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("couple_profiles_role_valid", sql`${table.role} in ('groom', 'bride')`)],
);

// Butir cerita (linimasa) di undangan, berurutan menurut sort_order.
// Foto galeri undangan, berurutan menurut sort_order. Satu gambar hanya boleh muncul sekali.
export const galleryItems = pgTable("gallery_items", {
  id: uuid().primaryKey().defaultRandom(),
  sortOrder: integer().notNull(),
  caption: text(),
  photoMediaId: uuid()
    .notNull()
    .unique()
    .references(() => media.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Rekening bank / e-wallet untuk amplop digital, berurutan menurut sort_order.
export const giftAccounts = pgTable(
  "gift_accounts",
  {
    id: uuid().primaryKey().defaultRandom(),
    sortOrder: integer().notNull(),
    kind: text().notNull(),
    provider: text().notNull(),
    accountName: text().notNull(),
    accountNumber: text().notNull(),
    qrMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("gift_accounts_kind_valid", sql`${table.kind} in ('bank', 'ewallet')`)],
);

// Pertanyaan yang sering diajukan tamu, berurutan menurut sort_order.
export const faqItems = pgTable("faq_items", {
  id: uuid().primaryKey().defaultRandom(),
  sortOrder: integer().notNull(),
  question: text().notNull(),
  answer: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Ide hadiah (wishlist). quantity = jumlah dibutuhkan, received = jumlah yang sudah diberikan (diatur admin).
export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    sortOrder: integer().notNull(),
    name: text().notNull(),
    note: text(),
    url: text(),
    photoMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
    quantity: integer().notNull().default(1),
    received: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "wishlist_items_qty_valid",
      sql`${table.quantity} >= 1 and ${table.received} between 0 and ${table.quantity}`,
    ),
  ],
);

// Hadiah wishlist yang dipilih tamu. Satu tamu satu baris per hadiah; jumlah yang dipilih dijaga
// agar received + total klaim tidak melebihi quantity (di dalam transaksi, lihat wish-claims).
export const wishlistClaims = pgTable(
  "wishlist_claims",
  {
    wishId: uuid()
      .notNull()
      .references(() => wishlistItems.id, { onDelete: "cascade" }),
    guestId: uuid()
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    quantity: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.wishId, table.guestId] }),
    check("wishlist_claims_qty_valid", sql`${table.quantity} >= 1`),
  ],
);

export const storyItems = pgTable("story_items", {
  id: uuid().primaryKey().defaultRandom(),
  sortOrder: integer().notNull(),
  whenLabel: text(),
  title: text().notNull(),
  body: text().notNull().default(""),
  photoMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Jawaban RSVP tamu per acara (hanya acara dengan has_rsvp).
export const rsvps = pgTable(
  "rsvps",
  {
    guestId: uuid()
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    status: text().notNull(),
    pax: integer().notNull().default(1),
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.guestId, table.eventId] }),
    check("rsvps_status_valid", sql`${table.status} in ('hadir', 'tidak_hadir', 'ragu')`),
    check("rsvps_pax_valid", sql`${table.pax} >= 0`),
  ],
);

// Ucapan tamu. Tamu yang dihapus tidak menghapus ucapannya (guest_id jadi NULL).
export const guestbook = pgTable(
  "guestbook",
  {
    id: uuid().primaryKey().defaultRandom(),
    guestId: uuid().references(() => guests.id, { onDelete: "set null" }),
    name: text().notNull(),
    message: text().notNull(),
    reply: text(),
    repliedAt: timestamp({ withTimezone: true }),
    isHidden: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("guestbook_created_idx").on(table.createdAt)],
);

// Keputusan admin atas duplikat check-in untuk satu (tamu, acara).
export const checkinReviews = pgTable(
  "checkin_reviews",
  {
    guestId: uuid()
      .notNull()
      .references(() => guests.id),
    eventId: uuid()
      .notNull()
      .references(() => events.id),
    resolution: text().notNull(),
    note: text(),
    resolvedBy: uuid()
      .notNull()
      .references(() => admins.id),
    resolvedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.guestId, table.eventId] }),
    check(
      "checkin_reviews_resolution_valid",
      sql`${table.resolution} in ('keep_first', 'merge_pax')`,
    ),
  ],
);
