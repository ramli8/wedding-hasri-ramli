import type { HomeResponse } from "@wedding/shared";
import { and, count, eq, isNull, min, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { events, guestbook, guests } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { buildDashboard } from "./checkin-admin.js";
import { listRsvps } from "./engage.js";
import { getCouple } from "./invitation.js";
import { receivedGiftSummary } from "./received-gifts.js";
import { getOverview } from "./vendors.js";

/** Menjalankan pengambil data yang boleh gagal karena "belum ada acara yang cocok" (409/404). */
async function optional<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (err) {
    if (err instanceof AppError && (err.status === 409 || err.status === 404)) return null;
    throw err;
  }
}

export async function getHome(db: Db): Promise<HomeResponse> {
  const [first] = await db.select({ at: min(events.startsAt) }).from(events);

  const [total] = await db.select({ n: count() }).from(guests).where(isNull(guests.deletedAt));
  // Diundang ke setidaknya satu acara, tetapi tidak ada satu pun undangan yang ditandai terkirim.
  const [neverSent] = await db
    .select({ n: count() })
    .from(guests)
    .where(
      and(
        isNull(guests.deletedAt),
        sql`exists (select 1 from guest_events ge where ge.guest_id = ${guests.id})`,
        sql`not exists (select 1 from guest_events ge where ge.guest_id = ${guests.id} and ge.sent_at is not null)`,
      ),
    );

  const rsvp = await optional(() => listRsvps(db));
  const dashboard = await optional(() => buildDashboard(db));
  const vendors = await getOverview(db);
  const categoryName = new Map(vendors.categories.map((c) => [c.id, c.name]));

  const [unreplied] = await db
    .select({ n: count() })
    .from(guestbook)
    .where(and(isNull(guestbook.reply), eq(guestbook.isHidden, false)));
  const couple = await getCouple(db);

  return {
    eventDate: first?.at?.toISOString() ?? null,
    guests: { total: total?.n ?? 0, neverSent: neverSent?.n ?? 0 },
    rsvp: rsvp
      ? {
          eventName: rsvp.event.name,
          invited: rsvp.totals.invited,
          hadir: rsvp.totals.hadir,
          hadirPax: rsvp.totals.hadirPax,
          tidakHadir: rsvp.totals.tidakHadir,
          ragu: rsvp.totals.ragu,
          belum: rsvp.totals.belum,
        }
      : null,
    checkin: dashboard
      ? {
          eventName: dashboard.event.name,
          invited: dashboard.totals.invited,
          arrived: dashboard.totals.arrived,
          needsReview: dashboard.totals.needsReview,
        }
      : null,
    vendors: {
      summary: vendors.summary,
      due: vendors.vendors
        .flatMap((v) =>
          v.dueState && v.dueOn
            ? [
                {
                  id: v.id,
                  name: v.name,
                  categoryName: categoryName.get(v.categoryId) ?? "",
                  dueOn: v.dueOn,
                  dueAmount: v.dueAmount,
                  state: v.dueState,
                },
              ]
            : [],
        )
        .sort((a, b) => a.dueOn.localeCompare(b.dueOn))
        .slice(0, 5),
    },
    gifts: await receivedGiftSummary(db),
    guestbookUnreplied: unreplied?.n ?? 0,
    coupleFilled: !!couple.groom && !!couple.bride,
  };
}
