import { z } from "zod";

const isoDateTime = z.iso.datetime({ offset: true });

export const groupSessionInputSchema = z
  .object({
    eventId: z.uuid(),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
  })
  .refine((s) => s.endsAt > s.startsAt, {
    message: "Jam selesai harus setelah jam mulai",
    path: ["endsAt"],
  });

export const groupInputSchema = z.object({
  name: z.string().trim().min(1, "Nama kelompok wajib diisi"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Warna harus berformat #rrggbb")
    .default("#737373"),
  isVip: z.boolean().default(false),
  sessions: z.array(groupSessionInputSchema).default([]),
});
export type GroupInput = z.input<typeof groupInputSchema>;
export type GroupData = z.output<typeof groupInputSchema>;

export const groupSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  color: z.string(),
  isVip: z.boolean(),
  guestCount: z.number(),
  sessions: z.array(z.object({ eventId: z.uuid(), startsAt: z.string(), endsAt: z.string() })),
});
export type Group = z.infer<typeof groupSchema>;

export const groupListResponseSchema = z.object({ items: z.array(groupSchema) });
export const groupResponseSchema = z.object({ group: groupSchema });
