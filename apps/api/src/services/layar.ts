import type { LayarFeed, LayarPortions, LayarPortionsInput } from "@wedding/shared";
import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { layarConfig } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { buildDashboard } from "./checkin-admin.js";
import { type DeviceRow, touchDevice } from "./devices.js";
import { coupleName, getSettings } from "./settings.js";

/** Banyak nama tamu terbaru yang dikirim ke layar Sapa. */
const RECENT_LIMIT = 12;

export async function getLayarPortions(db: Db): Promise<LayarPortions> {
  const [row] = await db.select().from(layarConfig).where(eq(layarConfig.id, 1));
  return {
    portionsReady: row?.portionsReady ?? 0,
    updatedAt: row?.updatedAt.toISOString() ?? null,
  };
}

export async function saveLayarPortions(db: Db, input: LayarPortionsInput): Promise<LayarPortions> {
  const now = new Date();
  await db
    .insert(layarConfig)
    .values({ id: 1, portionsReady: input.portionsReady, updatedAt: now })
    .onConflictDoUpdate({
      target: layarConfig.id,
      set: { portionsReady: input.portionsReady, updatedAt: now },
    });
  return { portionsReady: input.portionsReady, updatedAt: now.toISOString() };
}

/**
 * Data untuk layar Sapa/Dapur dari rekap check-in acara aktif. Tanpa acara check-in aktif layar tetap
 * tampil (kosong), supaya bisa dipasang sebelum hari-H.
 */
export async function layarFeed(db: Db, device: DeviceRow): Promise<LayarFeed> {
  const [dashboard, settings, portions] = await Promise.all([
    buildDashboard(db).catch((error: unknown) => {
      if (error instanceof AppError && error.status === 409) return null;
      throw error;
    }),
    getSettings(db),
    getLayarPortions(db),
  ]);
  await touchDevice(db, device.id);
  return {
    serverTime: new Date().toISOString(),
    deviceName: device.name,
    couple: coupleName(settings),
    eventName: dashboard?.event.name ?? null,
    recent: (dashboard?.recent ?? []).slice(0, RECENT_LIMIT).map((r) => ({
      id: r.checkinId,
      name: r.displayName,
      groupName: r.groupName,
      isVip: r.isVip,
      pax: r.pax,
      scannedAt: r.scannedAt,
    })),
    kitchen: {
      arrivedPax: dashboard?.totals.arrivedPax ?? 0,
      rsvpPax: dashboard?.totals.rsvpPax ?? null,
      portionsReady: portions.portionsReady,
      portionsUpdatedAt: portions.updatedAt,
    },
  };
}
