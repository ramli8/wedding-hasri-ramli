import { z } from "zod";

const isoDateTime = z.iso.datetime({ offset: true });

/**
 * Jam kedatangan satu kelompok di satu acara. Tanpa sesi = jam bebas (datang kapan saja).
 * `endsAt` null = "sampai selesai".
 */
export const groupSessionInputSchema = z
  .object({
    eventId: z.uuid(),
    startsAt: isoDateTime,
    endsAt: isoDateTime.nullish().transform((value) => value ?? null),
  })
  .refine((s) => s.endsAt === null || s.endsAt > s.startsAt, {
    message: "Jam selesai harus setelah jam mulai",
    path: ["endsAt"],
  });

/**
 * Warna kelompok sudah dihapus (11 Nov 2026), tetapi snapshot scanner tetap mengirim nilai tetap ini
 * karena aplikasi scanner lama mewajibkan field `color`.
 */
export const LEGACY_GROUP_COLOR = "#d6d3d1";

/**
 * `eventIds` = acara yang diundang untuk kelompok ini. Tamu baru di kelompok ini diundang ke
 * acara-acara ini; mengubahnya ikut menambah/mencabut undangan tamu kelompok yang sudah ada.
 * Jam sesi hanya boleh untuk acara yang diundang.
 */
export const groupInputSchema = z
  .object({
    name: z.string().trim().min(1, "Nama kelompok wajib diisi"),
    isVip: z.boolean().default(false),
    eventIds: z.array(z.uuid()).default([]),
    sessions: z.array(groupSessionInputSchema).default([]),
  })
  .refine((g) => g.sessions.every((s) => g.eventIds.includes(s.eventId)), {
    message: "Jam datang hanya untuk acara yang diundang",
    path: ["sessions"],
  });
export type GroupInput = z.input<typeof groupInputSchema>;
export type GroupData = z.output<typeof groupInputSchema>;

export const groupSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isVip: z.boolean(),
  guestCount: z.number(),
  eventIds: z.array(z.uuid()),
  sessions: z.array(
    z.object({ eventId: z.uuid(), startsAt: z.string(), endsAt: z.string().nullable() }),
  ),
});
export type Group = z.infer<typeof groupSchema>;

export const groupListResponseSchema = z.object({ items: z.array(groupSchema) });
export const groupResponseSchema = z.object({ group: groupSchema });

/**
 * Hapus kelompok: `moveTo` = id kelompok tujuan; tamunya dipindah dulu (tamu wajib berkelompok).
 * Tanpa `moveTo`, kelompok yang masih punya tamu ditolak.
 */
export const groupDeleteQuerySchema = z.object({
  moveTo: z.uuid().optional(),
});
export type GroupDeleteQuery = z.input<typeof groupDeleteQuerySchema>;
