import { z } from "zod";
import { deviceEventSchema, storedEventSchema } from "./checkin.js";

/** Kode pairing tampil sebagai "K7M2-9QXA" (8 karakter, alfabet yang sama dengan kode tamu). */
export const PAIRING_CODE_LENGTH = 8;

export const pairRequestSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .pipe(z.string().length(PAIRING_CODE_LENGTH, "Kode pairing harus 8 karakter")),
  /** Info perangkat untuk ditampilkan admin. Nama perangkat ditentukan admin saat membuat kode. */
  userAgent: z.string().max(300).optional(),
});
export type PairRequest = z.input<typeof pairRequestSchema>;

export const pairResponseSchema = z.object({
  token: z.string(),
  deviceId: z.uuid(),
  deviceName: z.string(),
});
export type PairResponse = z.infer<typeof pairResponseSchema>;

// --- Snapshot ------------------------------------------------------------------------------------

export const snapshotQuerySchema = z.object({
  sinceRev: z.coerce.number().int().min(0).default(0),
  sinceSeq: z.coerce.number().int().min(0).default(0),
});

export const snapshotGuestSchema = z.object({
  id: z.uuid(),
  code: z.string().nullable(),
  displayName: z.string(),
  fullName: z.string().nullable(),
  groupId: z.uuid().nullable(),
  quota: z.number().int(),
  usherNote: z.string().nullable(),
  source: z.enum(["admin", "import", "walkin"]),
  /** false: dihapus atau tidak lagi diundang ke acara ini, jadi buang dari perangkat. */
  invited: z.boolean(),
  rev: z.number(),
});
export type SnapshotGuest = z.infer<typeof snapshotGuestSchema>;

export const snapshotResponseSchema = z.object({
  serverTime: z.string(),
  protocol: z.object({ version: z.number().int(), minSupported: z.number().int() }),
  deviceName: z.string(),
  event: z.object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
  }),
  groups: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      color: z.string(),
      isVip: z.boolean(),
    }),
  ),
  sessions: z.array(z.object({ groupId: z.uuid(), startsAt: z.string(), endsAt: z.string() })),
  guests: z.array(snapshotGuestSchema),
  /** Rev tertinggi di antara tamu; kirim sebagai `sinceRev` pada sinkronisasi berikutnya. */
  guestRev: z.number(),
  events: z.array(storedEventSchema),
  /** Seq tertinggi di antara event check-in; kirim sebagai `sinceSeq`. */
  checkinSeq: z.number(),
  /** Nama perangkat untuk setiap deviceId yang muncul di `events`. */
  devices: z.array(z.object({ id: z.uuid(), name: z.string() })),
});
export type SnapshotResponse = z.infer<typeof snapshotResponseSchema>;

// --- Push ------------------------------------------------------------------------------------------

export const walkinGuestSchema = z.object({
  id: z.uuid(),
  eventId: z.uuid(),
  displayName: z.string().trim().min(1).max(200),
  phone: z.string().max(40).nullish(),
  instagram: z.string().max(60).nullish(),
  groupId: z.uuid().nullish(),
  quota: z.number().int().min(1).max(500).default(1),
  usherNote: z.string().max(300).nullish(),
});
export type WalkinGuest = z.input<typeof walkinGuestSchema>;

export const pushRequestSchema = z.object({
  deviceTime: z.iso.datetime({ offset: true }),
  appVersion: z.string().max(40),
  /** Jumlah item di outbox perangkat saat ini, untuk dipantau di dashboard. */
  pendingOutbox: z.number().int().min(0),
  walkins: z.array(walkinGuestSchema).max(200).default([]),
  events: z.array(deviceEventSchema).max(500).default([]),
});
export type PushRequest = z.input<typeof pushRequestSchema>;
export type PushData = z.output<typeof pushRequestSchema>;

export const pushResultSchema = z.object({
  id: z.uuid(),
  /** stored: baru disimpan. noop: sudah pernah diterima. invalid: ditolak (lihat reason). */
  status: z.enum(["stored", "noop", "invalid"]),
  reason: z.string().optional(),
});

export const pushResponseSchema = z.object({
  serverTime: z.string(),
  results: z.array(pushResultSchema),
  /** Kode untuk tamu walk-in yang baru diterima server. */
  walkinCodes: z.array(z.object({ id: z.uuid(), code: z.string() })),
});
export type PushResponse = z.infer<typeof pushResponseSchema>;
