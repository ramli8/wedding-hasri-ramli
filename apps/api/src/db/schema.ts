import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  bigserial,
  boolean,
  check,
  date,
  index,
  inet,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
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
    // Nama pendek situs (judul tab, nama aplikasi di HP); kosong = DEFAULT_SITE_NAME.
    siteName: text(),
    groomName: text().notNull(),
    brideName: text().notNull(),
    publicBaseUrl: text().notNull(),
    // Pratinjau tautan (Open Graph) saat undangan dibagikan ke WhatsApp atau Instagram.
    seoTitle: text(),
    seoDescription: text(),
    seoImageMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
    // Logo persegi: sumber favicon dan ikon aplikasi (/site-icon/*).
    logoMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
    // Tujuan hitung mundur di undangan; kosong = tanggal acara pertama.
    countdownAt: timestamp({ withTimezone: true }),
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

// Template pesan pengingat RSVP per acara (variabel sama dengan pesan undangan). Tidak ada baris =
// memakai DEFAULT_REMINDER_TEMPLATE.
export const reminderTemplates = pgTable("reminder_templates", {
  eventId: uuid()
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  body: text().notNull(),
});

// Pesan WhatsApp ucapan terima kasih untuk pemberi hadiah (satu baris). Tidak ada baris = memakai
// DEFAULT_THANKS_TEMPLATE.
export const thanksTemplate = pgTable(
  "thanks_template",
  {
    id: smallint().primaryKey().default(1),
    body: text().notNull(),
  },
  (table) => [check("thanks_template_singleton", sql`${table.id} = 1`)],
);

export const guestGroups = pgTable("guest_groups", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique("guest_groups_name_unique"),
  isVip: boolean().notNull().default(false),
});

// Acara yang diundang untuk satu kelompok. Tamu baru di kelompok ini diundang ke acara-acara ini,
// dan mengubahnya ikut mengubah undangan tamu kelompok yang sudah ada.
export const groupEvents = pgTable(
  "group_events",
  {
    groupId: uuid()
      .notNull()
      .references(() => guestGroups.id, { onDelete: "cascade" }),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.eventId] })],
);

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
    // Null = "sampai selesai". Tanpa baris sesi sama sekali = jam bebas.
    endsAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.eventId] }),
    check(
      "group_sessions_time_order",
      sql`${table.endsAt} is null or ${table.endsAt} > ${table.startsAt}`,
    ),
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
    // Tamu penting: keluarga mendapat kabar saat ia check-in (tidak dikirim ke HP scanner).
    isVip: boolean().notNull().default(false),
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
    // Pengingat RSVP terakhir yang ditandai terkirim oleh admin.
    remindedAt: timestamp({ withTimezone: true }),
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
    // Kode pairing apa adanya ("K7M2-9QXA"), agar kartu pasang bisa dicetak ulang kapan saja. Hash
    // tetap disimpan setelah kode dipakai, supaya pemakaian ulang ditolak dengan pesan "sudah
    // dipakai". Kode hanya bisa memasang perangkat yang berstatus pending.
    pairingCode: text(),
    pairingExpiresAt: timestamp({ withTimezone: true }),
    tokenHash: text().unique("devices_token_hash_unique"),
    status: text().notNull().default("pending"),
    // Ditentukan saat pairing: HP scanner hanya boleh /sync, laptop booth hanya /booth, HP meja buwuh
    // hanya /buwuh, layar (TV/proyektor) hanya /layar.
    kind: text().notNull().default("scanner"),
    appVersion: text(),
    protocolVersion: integer(),
    lastSeenAt: timestamp({ withTimezone: true }),
    lastSyncAt: timestamp({ withTimezone: true }),
    pendingOutbox: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("devices_status_valid", sql`${table.status} in ('pending', 'active', 'revoked')`),
    check("devices_kind_valid", sql`${table.kind} in ('scanner', 'booth', 'buwuh', 'layar')`),
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

// Ide hadiah (wishlist). quantity = jumlah dibutuhkan; yang terpenuhi dihitung dari wishlist_claims.
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
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("wishlist_items_qty_valid", sql`${table.quantity} >= 1`)],
);

// Hadiah wishlist yang dipilih tamu. Satu tamu satu baris per hadiah; jumlah yang dipilih dijaga
// agar total klaim tidak melebihi quantity (di dalam transaksi, lihat wish-claims).
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
    // Terisi saat barangnya sudah diterima dan dicatat sebagai hadiah masuk.
    receivedGiftId: uuid().references((): AnyPgColumn => receivedGifts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.wishId, table.guestId] }),
    check("wishlist_claims_qty_valid", sql`${table.quantity} >= 1`),
  ],
);

// Sampul undangan (satu baris): foto dan kalimat pembuka di atas halaman tamu.
export const invitationCover = pgTable(
  "invitation_cover",
  {
    id: smallint().primaryKey().default(1),
    greeting: text(),
    photoMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
    // Siaran langsung ikut disimpan di baris tunggal ini.
    liveUrl: text(),
    liveNote: text(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("invitation_cover_singleton", sql`${table.id} = 1`)],
);

// Urutan dan tampil/sembunyi tiap bagian undangan. Bagian yang belum punya baris memakai bawaan.
export const invitationSections = pgTable("invitation_sections", {
  key: text().primaryKey(),
  sortOrder: integer().notNull(),
  isVisible: boolean().notNull().default(true),
});

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

// Amplop, transfer, dan barang yang diterima. Pemberi boleh tamu terdaftar (guest_id) atau diketik
// bebas; nama pemberi disimpan sendiri agar catatan tetap utuh bila tamunya dihapus.
export const receivedGifts = pgTable(
  "received_gifts",
  {
    id: uuid().primaryKey().defaultRandom(),
    guestId: uuid().references(() => guests.id, { onDelete: "set null" }),
    giverName: text().notNull(),
    // HP pemberi yang bukan tamu terdaftar (tujuan ucapan terima kasih), sudah dinormalisasi.
    phone: text(),
    // Instagram pemberi yang bukan tamu terdaftar (ucapan terima kasih lewat DM), sudah dinormalisasi.
    instagram: text(),
    kind: text().notNull(),
    amount: bigint({ mode: "number" }),
    itemDescription: text(),
    note: text(),
    receivedOn: date({ mode: "string" }).notNull(),
    thankedAt: timestamp({ withTimezone: true }),
    recordedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("received_gifts_kind_valid", sql`${table.kind} in ('amplop', 'transfer', 'barang')`),
    check(
      "received_gifts_amount_valid",
      sql`(${table.kind} = 'barang' and ${table.itemDescription} is not null)
        or (${table.kind} <> 'barang' and ${table.amount} > 0)`,
    ),
    index("received_gifts_received_idx").on(table.receivedOn),
  ],
);

// Vendor pernikahan. Satu kategori punya beberapa kandidat; paling banyak satu yang dipilih.
export const vendorCategories = pgTable("vendor_categories", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique("vendor_categories_name_unique"),
  sortOrder: integer().notNull().default(0),
});

export const vendors = pgTable(
  "vendors",
  {
    id: uuid().primaryKey().defaultRandom(),
    categoryId: uuid()
      .notNull()
      .references(() => vendorCategories.id),
    name: text().notNull(),
    // Penawaran selama kandidat, harga sepakat setelah dipesan.
    price: bigint({ mode: "number" }),
    contactPerson: text(),
    phone: text(),
    instagram: text(),
    address: text(),
    // Batas pelunasan.
    dueOn: date({ mode: "string" }),
    // Hari-H: jam datang ("HH:MM", WIB) dan penanggung jawab di lokasi.
    arrivalTime: text(),
    picName: text(),
    picPhone: text(),
    isSelected: boolean().notNull().default(false),
    note: text(),
    deletedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("one_selected_vendor_per_category")
      .on(table.categoryId)
      .where(sql`${table.isSelected} and ${table.deletedAt} is null`),
    check("vendors_price_valid", sql`${table.price} is null or ${table.price} > 0`),
  ],
);

export const vendorPayments = pgTable(
  "vendor_payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    vendorId: uuid()
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    // dp | cicilan | pelunasan
    kind: text().notNull().default("cicilan"),
    paidOn: date({ mode: "string" }).notNull(),
    amount: bigint({ mode: "number" }).notNull(),
    note: text(),
    proofMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("vendor_payments_amount_valid", sql`${table.amount} > 0`)],
);

// Pengaturan photobooth (satu baris): bingkai bawaan mana yang boleh dipilih tamu di booth.
export const boothConfig = pgTable(
  "booth_config",
  {
    id: smallint().primaryKey().default(1),
    frames: text().array().notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("booth_config_singleton", sql`${table.id} = 1`),
    check("booth_config_frames_not_empty", sql`cardinality(${table.frames}) > 0`),
  ],
);

// Foto hasil photobooth (sudah berbingkai). `id` dibuat oleh perangkat booth sehingga unggah ulang
// setelah koneksi putus tidak menggandakan foto.
export const boothPhotos = pgTable(
  "booth_photos",
  {
    id: uuid().primaryKey(),
    mediaId: uuid()
      .notNull()
      .unique()
      .references(() => media.id),
    frame: text().notNull(),
    deviceId: uuid().references(() => devices.id, { onDelete: "set null" }),
    takenAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("booth_photos_frame_valid", sql`${table.frame} in ('poster', 'strip', 'tiket')`),
    index("booth_photos_taken_at_idx").on(table.takenAt),
  ],
);

// Id foto booth yang dihapus admin. Halaman tamu (QR di cetakan) menjawab "sudah dihapus" alih-alih
// "belum terunggah", dan booth tidak bisa mengunggahnya ulang.
export const boothPhotoDeletions = pgTable("booth_photo_deletions", {
  id: uuid().primaryKey(),
  deletedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Catatan meja buwuh (nyumbang): satu pemberi per baris, berupa uang dan/atau barang. `id` dibuat
// HP meja sehingga kirim ulang tidak menggandakan; `version` dinaikkan HP setiap kali petugas
// mengubah atau menghapus, dan server hanya menerima versi yang lebih baru. Setelah admin mengubah
// (`edited_at` terisi), kiriman HP untuk catatan itu diabaikan. Hapus = `deleted_at` (bukan baris
// hilang) agar kiriman HP yang terlambat tidak memunculkannya lagi.
export const buwuhEntries = pgTable(
  "buwuh_entries",
  {
    id: uuid().primaryKey(),
    name: text().notNull(),
    address: text(),
    amount: bigint({ mode: "number" }).notNull().default(0),
    // [{ name, quantity, unit }], lihat buwuhItemSchema.
    items: jsonb().$type<{ name: string; quantity: number; unit: string }[]>().notNull(),
    note: text(),
    deviceId: uuid().references(() => devices.id, { onDelete: "set null" }),
    adminId: uuid().references(() => admins.id, { onDelete: "set null" }),
    version: integer().notNull().default(1),
    recordedAt: timestamp({ withTimezone: true }).notNull(),
    editedAt: timestamp({ withTimezone: true }),
    deletedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("buwuh_entries_amount_valid", sql`${table.amount} >= 0`),
    // Satu pemberi memberi uang ATAU barang, tidak keduanya (baris terhapus boleh kosong).
    check(
      "buwuh_entries_satu_jenis",
      sql`${table.deletedAt} is not null or ((${table.amount} > 0) <> (jsonb_array_length(${table.items}) > 0))`,
    ),
    index("buwuh_entries_recorded_idx").on(table.recordedAt),
  ],
);

// Pengaturan meja buwuh (satu baris): daftar barang (belum ada baris = DEFAULT_BUWUH_CATALOG) dan
// daftar alamat pilihan yang tampil sebagai tombol di HP meja.
export const buwuhConfig = pgTable(
  "buwuh_config",
  {
    id: smallint().primaryKey().default(1),
    catalog: jsonb().$type<{ name: string; unit: string }[]>().notNull(),
    addresses: jsonb().$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("buwuh_config_singleton", sql`${table.id} = 1`)],
);

// Mahar, seserahan, dan hantaran: barang, penanggung jawab, harga, dan statusnya.
export const seserahanItems = pgTable(
  "seserahan_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    category: text().notNull(),
    name: text().notNull(),
    pic: text(),
    price: bigint({ mode: "number" }),
    status: text().notNull().default("rencana"),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "seserahan_items_category_valid",
      sql`${table.category} in ('mahar', 'seserahan', 'hantaran')`,
    ),
    check(
      "seserahan_items_status_valid",
      sql`${table.status} in ('rencana', 'dibeli', 'dikemas', 'diserahkan')`,
    ),
    check("seserahan_items_price_valid", sql`${table.price} is null or ${table.price} >= 0`),
  ],
);

// Anggota panitia keluarga (tanpa akun). `token` adalah bagian rahasia tautan /tugas/<token>.
export const panitiaMembers = pgTable("panitia_members", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  phone: text(),
  token: text().notNull().unique("panitia_members_token_unique"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Tugas persiapan; satu tugas satu penanggung jawab (boleh belum ditentukan).
export const panitiaTasks = pgTable(
  "panitia_tasks",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    memberId: uuid().references(() => panitiaMembers.id, { onDelete: "set null" }),
    dueOn: date({ mode: "string" }),
    note: text(),
    doneAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("panitia_tasks_member_idx").on(table.memberId)],
);

// Rundown hari-H per acara. Jam "HH:MM" (WIB) di tanggal acaranya, seperti jam datang vendor.
export const rundownItems = pgTable(
  "rundown_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    time: text().notNull(),
    durationMin: integer(),
    title: text().notNull(),
    pic: text(),
    vendorId: uuid().references(() => vendors.id, { onDelete: "set null" }),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("rundown_items_time_valid", sql`${table.time} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`),
    index("rundown_items_event_idx").on(table.eventId, table.time),
  ],
);

// Pengaturan rundown (satu baris): token tautan baca-saja untuk MC dan panitia.
export const rundownConfig = pgTable(
  "rundown_config",
  {
    id: smallint().primaryKey().default(1),
    token: text().notNull(),
  },
  (table) => [check("rundown_config_singleton", sql`${table.id} = 1`)],
);

// Pengaturan Kabar VIP (satu baris): token tautan /vip/<token> untuk HP keluarga.
export const vipConfig = pgTable(
  "vip_config",
  {
    id: smallint().primaryKey().default(1),
    token: text().notNull(),
  },
  (table) => [check("vip_config_singleton", sql`${table.id} = 1`)],
);

// Pengaturan layar (satu baris): porsi makanan yang sudah siap, diisi admin dari kabar dapur; layar
// mode Dapur membandingkannya dengan banyak orang yang sudah datang.
export const layarConfig = pgTable(
  "layar_config",
  {
    id: smallint().primaryKey().default(1),
    portionsReady: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("layar_config_singleton", sql`${table.id} = 1`),
    check("layar_config_portions_valid", sql`${table.portionsReady} >= 0`),
  ],
);

// Doorprize: hadiah undian untuk tamu yang sudah check-in.
export const doorprizePrizes = pgTable(
  "doorprize_prizes",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    quantity: integer().notNull().default(1),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("doorprize_prizes_quantity_valid", sql`${table.quantity} >= 1`)],
);

// Hasil undian. Satu tamu paling banyak satu baris (unik), termasuk yang dicoret (`forfeited_at`),
// jadi tamu yang sudah menang atau tidak maju tidak ikut diundi lagi.
export const doorprizeWinners = pgTable(
  "doorprize_winners",
  {
    id: uuid().primaryKey().defaultRandom(),
    prizeId: uuid()
      .notNull()
      .references(() => doorprizePrizes.id, { onDelete: "cascade" }),
    guestId: uuid()
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    drawnAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    forfeitedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("doorprize_winners_guest_unique").on(table.guestId),
    index("doorprize_winners_prize_idx").on(table.prizeId),
  ],
);

// Pesan suara tamu (maks. 60 detik). Berkasnya di MEDIA_DIR/voice/<id>.<ext>; hanya admin yang
// mendengarkan.
export const voiceMessages = pgTable(
  "voice_messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    guestId: uuid()
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    durationMs: integer().notNull(),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    hidden: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("voice_messages_guest_idx").on(table.guestId),
    check(
      "voice_messages_mime_valid",
      sql`${table.mimeType} in ('audio/webm', 'audio/ogg', 'audio/mp4')`,
    ),
  ],
);
