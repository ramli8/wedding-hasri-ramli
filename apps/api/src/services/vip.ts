import { randomBytes } from "node:crypto";
import type { VipFeed } from "@wedding/shared";
import { and, asc, count, eq, isNull, or, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { checkinEvents, guestGroups, guests, vipConfig } from "../db/schema.js";

const newToken = () => randomBytes(16).toString("base64url");

/** VIP = tamu yang ditandai VIP atau anggota kelompok VIP. */
const isVipGuest = or(eq(guests.isVip, true), eq(guestGroups.isVip, true));

/**
 * Kedatangan tamu VIP terbaru (check-in yang tidak dibatalkan), paling baru lebih dulu. Satu tamu
 * hanya muncul sekali (check-in pertamanya), walau dipindai dua perangkat atau di beberapa acara,
 * supaya keluarga tidak dikabari dua kali.
 */
export async function vipFeed(db: Db, limit = 50): Promise<VipFeed> {
  const rows = await db
    .select({
      id: checkinEvents.id,
      guestId: checkinEvents.guestId,
      seq: checkinEvents.seq,
      guestName: guests.displayName,
      groupName: guestGroups.name,
      pax: checkinEvents.pax,
      scannedAt: checkinEvents.scannedAt,
    })
    .from(checkinEvents)
    .innerJoin(guests, eq(guests.id, checkinEvents.guestId))
    .leftJoin(guestGroups, eq(guestGroups.id, guests.groupId))
    .where(
      and(
        eq(checkinEvents.kind, "checkin"),
        isNull(guests.deletedAt),
        isVipGuest,
        sql`not exists (select 1 from checkin_events u where u.kind = 'undo' and u.target_id = ${checkinEvents.id})`,
      ),
    )
    .orderBy(asc(checkinEvents.seq));
  const seen = new Set<string>();
  const first = rows.filter((row) => !seen.has(row.guestId) && !!seen.add(row.guestId));
  const [total] = await db
    .select({ n: count() })
    .from(guests)
    .leftJoin(guestGroups, eq(guestGroups.id, guests.groupId))
    .where(and(isNull(guests.deletedAt), isVipGuest));
  return {
    arrivals: first
      .reverse()
      .slice(0, limit)
      .map(({ guestId: _, ...r }) => ({ ...r, scannedAt: r.scannedAt.toISOString() })),
    arrivedCount: first.length,
    vipCount: total?.n ?? 0,
  };
}

export async function getVipToken(db: Db): Promise<string> {
  const [row] = await db.select().from(vipConfig).where(eq(vipConfig.id, 1));
  if (row) return row.token;
  await db.insert(vipConfig).values({ id: 1, token: newToken() }).onConflictDoNothing();
  const [saved] = await db.select().from(vipConfig).where(eq(vipConfig.id, 1));
  if (!saved) throw new Error("Gagal membuat token VIP");
  return saved.token;
}

export async function resetVipToken(db: Db): Promise<string> {
  const token = newToken();
  await db
    .insert(vipConfig)
    .values({ id: 1, token })
    .onConflictDoUpdate({ target: vipConfig.id, set: { token } });
  return token;
}

export async function vipTokenMatches(db: Db, token: string) {
  const [row] = await db.select().from(vipConfig).where(eq(vipConfig.id, 1));
  return !!row && row.token === token;
}
