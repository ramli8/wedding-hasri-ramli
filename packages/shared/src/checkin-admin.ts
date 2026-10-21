import { z } from "zod";
import { checkinMethodSchema, MAX_PAX } from "./checkin.js";

export const deviceStatusSchema = z.enum(["pending", "active", "revoked"]);

export const deviceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  status: deviceStatusSchema,
  appVersion: z.string().nullable(),
  protocolVersion: z.number().nullable(),
  lastSeenAt: z.string().nullable(),
  lastSyncAt: z.string().nullable(),
  pendingOutbox: z.number(),
  createdAt: z.string(),
  /** Hanya ada selama kode pairing belum dipakai dan belum kedaluwarsa. */
  pairingExpiresAt: z.string().nullable(),
});
export type Device = z.infer<typeof deviceSchema>;

export const createDeviceRequestSchema = z.object({
  name: z.string().trim().min(1, "Nama perangkat wajib diisi").max(60),
});
export type CreateDeviceRequest = z.input<typeof createDeviceRequestSchema>;

export const createDeviceResponseSchema = z.object({
  device: deviceSchema,
  /** Kode pairing, ditampilkan sekali saja: "K7M2-9QXA". */
  pairingCode: z.string(),
});

export const deviceListResponseSchema = z.object({ items: z.array(deviceSchema) });
export const deviceResponseSchema = z.object({ device: deviceSchema });

// --- Dashboard ----------------------------------------------------------------------------------

export const dashboardQuerySchema = z.object({ eventId: z.uuid().optional() });

export const dashboardRecentSchema = z.object({
  checkinId: z.uuid(),
  guestId: z.uuid(),
  displayName: z.string(),
  groupName: z.string().nullable(),
  isVip: z.boolean(),
  pax: z.number(),
  method: checkinMethodSchema.nullable(),
  deviceName: z.string().nullable(),
  scannedAt: z.string(),
  outsideSession: z.boolean(),
  hasDuplicates: z.boolean(),
});

export const dashboardResponseSchema = z.object({
  serverTime: z.string(),
  event: z.object({ id: z.uuid(), name: z.string() }),
  totals: z.object({
    invited: z.number(),
    arrived: z.number(),
    /** Jumlah orang yang masuk (untuk katering dan kartu souvenir). */
    arrivedPax: z.number(),
    needsReview: z.number(),
    outsideSession: z.number(),
    walkins: z.number(),
  }),
  groups: z.array(
    z.object({
      id: z.uuid().nullable(),
      name: z.string(),
      color: z.string(),
      isVip: z.boolean(),
      invited: z.number(),
      arrived: z.number(),
      pax: z.number(),
    }),
  ),
  recent: z.array(dashboardRecentSchema),
  devices: z.array(deviceSchema),
});
export type Dashboard = z.infer<typeof dashboardResponseSchema>;

// --- Antrean duplikat ------------------------------------------------------------------------------

const reviewCheckinSchema = z.object({
  id: z.uuid(),
  pax: z.number(),
  method: checkinMethodSchema.nullable(),
  deviceName: z.string().nullable(),
  scannedAt: z.string(),
});

export const reviewItemSchema = z.object({
  guestId: z.uuid(),
  eventId: z.uuid(),
  displayName: z.string(),
  groupName: z.string().nullable(),
  primary: reviewCheckinSchema,
  duplicates: z.array(reviewCheckinSchema),
});
export type ReviewItem = z.infer<typeof reviewItemSchema>;

export const reviewListResponseSchema = z.object({ items: z.array(reviewItemSchema) });

export const resolveRequestSchema = z.object({
  guestId: z.uuid(),
  eventId: z.uuid(),
  resolution: z.enum(["keep_first", "merge_pax"]),
  note: z.string().trim().max(300).nullish(),
});
export type ResolveRequest = z.input<typeof resolveRequestSchema>;

export const adminSetPaxRequestSchema = z.object({
  pax: z.number().int().min(1, "Jumlah orang minimal 1").max(MAX_PAX),
});

// --- Log ----------------------------------------------------------------------------------------------

export const logQuerySchema = z.object({
  eventId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const logEntrySchema = z.object({
  seq: z.number(),
  id: z.uuid(),
  kind: z.enum(["checkin", "undo", "set_pax"]),
  displayName: z.string(),
  pax: z.number().nullable(),
  method: checkinMethodSchema.nullable(),
  deviceName: z.string().nullable(),
  byAdmin: z.boolean(),
  scannedAt: z.string(),
  receivedAt: z.string(),
  outsideSession: z.boolean(),
});

export const logResponseSchema = z.object({
  items: z.array(logEntrySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
