import { z } from "zod";

/** Penjaga hanya boleh membatalkan atau mengubah jumlah check-in terakhirnya dalam jendela ini. */
export const CHECKIN_UNDO_WINDOW_MS = 2 * 60 * 1000;
export const MAX_PAX = 500;

const isoDateTime = z.iso.datetime({ offset: true });
const pax = z.number().int().min(1, "Jumlah orang minimal 1").max(MAX_PAX);

export const checkinMethodSchema = z.enum(["qr", "code", "search", "walkin", "admin"]);
export type CheckinMethod = z.infer<typeof checkinMethodSchema>;

// --- Event yang dibuat perangkat ---------------------------------------------------------------

const eventBase = {
  id: z.uuid(),
  guestId: z.uuid(),
  eventId: z.uuid(),
  /** Waktu terkoreksi (jam perangkat + offset terhadap server). */
  scannedAt: isoDateTime,
};

export const deviceEventSchema = z.discriminatedUnion("kind", [
  z.object({ ...eventBase, kind: z.literal("checkin"), pax, method: checkinMethodSchema }),
  z.object({ ...eventBase, kind: z.literal("undo"), targetId: z.uuid() }),
  z.object({ ...eventBase, kind: z.literal("set_pax"), targetId: z.uuid(), pax }),
]);
export type DeviceEvent = z.infer<typeof deviceEventSchema>;

/** Event yang sudah disimpan server: ditambah urutan global dan siapa yang membuatnya. */
export const storedEventSchema = z.object({
  seq: z.number().int(),
  id: z.uuid(),
  kind: z.enum(["checkin", "undo", "set_pax"]),
  guestId: z.uuid(),
  eventId: z.uuid(),
  targetId: z.uuid().nullable(),
  pax: z.number().int().nullable(),
  method: checkinMethodSchema.nullable(),
  deviceId: z.uuid().nullable(),
  adminId: z.uuid().nullable(),
  scannedAt: z.string(),
  outsideSession: z.boolean(),
});
export type StoredEvent = z.infer<typeof storedEventSchema>;

// --- Pemecah status (murni) ------------------------------------------------------------------------

/** Bentuk minimal yang dibutuhkan pemecah; dipenuhi oleh event perangkat maupun event tersimpan. */
export type ResolverEvent = {
  id: string;
  kind: "checkin" | "undo" | "set_pax";
  guestId: string;
  eventId: string;
  targetId?: string | null;
  pax?: number | null;
  scannedAt: string;
};

export type Resolution = "keep_first" | "merge_pax";
export type ResolverReview = { guestId: string; eventId: string; resolution: Resolution };

export type CheckinState<E extends ResolverEvent = ResolverEvent> = {
  guestId: string;
  eventId: string;
  /** Check-in paling awal yang masih berlaku. */
  primary: E;
  /** Jumlah orang yang dihitung (lihat `resolution`). */
  pax: number;
  /** Check-in lain yang masih berlaku untuk tamu dan acara yang sama. */
  duplicates: E[];
  /** Keputusan admin atas duplikat, bila sudah ada. */
  resolution: Resolution | null;
};

const timeOf = (event: ResolverEvent) => Date.parse(event.scannedAt);

/** Urutan total yang tidak bergantung urutan kedatangan: waktu, lalu id. */
function byTimeThenId(a: ResolverEvent, b: ResolverEvent) {
  return timeOf(a) - timeOf(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/**
 * Menghitung status akhir setiap (tamu, acara) dari log event.
 *
 * - `undo` yang menunjuk sebuah check-in membatalkannya.
 * - Check-in yang masih berlaku diurutkan menurut (waktu, id); yang pertama menjadi `primary`,
 *   sisanya `duplicates` (untuk diperiksa admin).
 * - `set_pax` terakhir untuk sebuah check-in menggantikan jumlahnya.
 *
 * Hasilnya tidak bergantung pada urutan `events`, sehingga perangkat yang menerima event dalam
 * urutan berbeda tetap sampai pada status yang sama.
 */
export function resolveCheckins<E extends ResolverEvent>(
  events: readonly E[],
  reviews: readonly ResolverReview[] = [],
): CheckinState<E>[] {
  const checkins = new Map<string, E>();
  for (const event of events) if (event.kind === "checkin") checkins.set(event.id, event);

  const undone = new Set<string>();
  const paxChanges = new Map<string, E[]>();
  for (const event of events) {
    const target = event.targetId ? checkins.get(event.targetId) : undefined;
    // Event koreksi yang menunjuk check-in tamu/acara lain diabaikan.
    if (!target || target.guestId !== event.guestId || target.eventId !== event.eventId) continue;
    if (event.kind === "undo") undone.add(target.id);
    if (event.kind === "set_pax") {
      const list = paxChanges.get(target.id) ?? [];
      list.push(event);
      paxChanges.set(target.id, list);
    }
  }

  const paxOf = (checkin: E) => {
    const latest = (paxChanges.get(checkin.id) ?? []).sort(byTimeThenId).at(-1);
    return latest?.pax ?? checkin.pax ?? 1;
  };

  const groups = new Map<string, E[]>();
  for (const checkin of checkins.values()) {
    if (undone.has(checkin.id)) continue;
    const key = `${checkin.guestId}|${checkin.eventId}`;
    const list = groups.get(key) ?? [];
    list.push(checkin);
    groups.set(key, list);
  }

  const reviewOf = new Map(reviews.map((r) => [`${r.guestId}|${r.eventId}`, r.resolution]));

  const states: CheckinState<E>[] = [];
  for (const [key, list] of groups) {
    list.sort(byTimeThenId);
    const [primary, ...duplicates] = list as [E, ...E[]];
    const resolution = reviewOf.get(key) ?? null;
    states.push({
      guestId: primary.guestId,
      eventId: primary.eventId,
      primary,
      duplicates,
      resolution,
      pax: resolution === "merge_pax" ? list.reduce((sum, c) => sum + paxOf(c), 0) : paxOf(primary),
    });
  }
  return states.sort((a, b) => byTimeThenId(a.primary, b.primary));
}

/** Duplikat yang belum diperiksa admin. */
export const needsReview = (state: CheckinState) =>
  state.duplicates.length > 0 && state.resolution === null;

/** Apakah koreksi (undo/ubah jumlah) masih dalam jendela waktu terhadap check-in aslinya. */
export function withinUndoWindow(target: { scannedAt: string }, correctionAt: string) {
  const elapsed = Date.parse(correctionAt) - Date.parse(target.scannedAt);
  return elapsed >= 0 && elapsed <= CHECKIN_UNDO_WINDOW_MS;
}
