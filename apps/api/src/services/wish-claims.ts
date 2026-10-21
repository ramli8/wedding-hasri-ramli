import type { AdminWish, Wish } from "@wedding/shared";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { guests, wishlistClaims, wishlistItems } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { getWish, listWishes } from "./invitation.js";

// --- Untuk admin: siapa memilih apa ---------------------------------------------------------------

async function claimsFor(db: Db) {
  const rows = await db
    .select({
      wishId: wishlistClaims.wishId,
      guestId: wishlistClaims.guestId,
      guestName: guests.displayName,
      quantity: wishlistClaims.quantity,
    })
    .from(wishlistClaims)
    .innerJoin(guests, eq(guests.id, wishlistClaims.guestId))
    .orderBy(asc(wishlistClaims.createdAt), asc(guests.id));
  const byWish = new Map<string, AdminWish["claims"]>();
  for (const { wishId, ...claim } of rows) {
    byWish.set(wishId, [...(byWish.get(wishId) ?? []), claim]);
  }
  return byWish;
}

export async function listAdminWishes(db: Db): Promise<AdminWish[]> {
  const [wishes, claims] = await Promise.all([listWishes(db), claimsFor(db)]);
  return wishes.map((wish) => ({ ...wish, claims: claims.get(wish.id) ?? [] }));
}

export async function adminWish(db: Db, id: string): Promise<AdminWish> {
  const wish = await getWish(db, id);
  return { ...wish, claims: (await claimsFor(db)).get(id) ?? [] };
}

/** Admin melepas pilihan tamu (mis. tamu batal tetapi lupa melepas sendiri). */
export async function removeClaim(db: Db, wishId: string, guestId: string): Promise<void> {
  const [row] = await db
    .delete(wishlistClaims)
    .where(and(eq(wishlistClaims.wishId, wishId), eq(wishlistClaims.guestId, guestId)))
    .returning({ wishId: wishlistClaims.wishId });
  if (!row) throw new AppError(404, "NOT_FOUND", "Pilihan tamu tidak ditemukan");
}

// --- Untuk tamu -----------------------------------------------------------------------------------

export async function myClaims(db: Db, guestId: string) {
  return db
    .select({ wishId: wishlistClaims.wishId, quantity: wishlistClaims.quantity })
    .from(wishlistClaims)
    .where(eq(wishlistClaims.guestId, guestId));
}

/**
 * Tamu memilih `quantity` buah hadiah (0 = melepas). Baris hadiah dikunci selama pemeriksaan sisa
 * agar dua tamu yang memilih bersamaan tidak sama-sama lolos untuk unit terakhir.
 */
export async function setClaim(
  db: Db,
  guestId: string,
  wishId: string,
  quantity: number,
): Promise<{ wish: Wish; mine: number }> {
  await db.transaction(async (tx) => {
    const [wish] = await tx
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.id, wishId))
      .for("update");
    if (!wish) throw new AppError(404, "NOT_FOUND", "Hadiah tidak ditemukan");

    if (quantity === 0) {
      await tx
        .delete(wishlistClaims)
        .where(and(eq(wishlistClaims.wishId, wishId), eq(wishlistClaims.guestId, guestId)));
      return;
    }

    const [others] = await tx
      .select({ total: sql<number>`coalesce(sum(${wishlistClaims.quantity}), 0)::int` })
      .from(wishlistClaims)
      .where(and(eq(wishlistClaims.wishId, wishId), ne(wishlistClaims.guestId, guestId)));
    const remaining = wish.quantity - wish.received - (others?.total ?? 0);
    if (quantity > remaining) {
      throw new AppError(
        409,
        "CONFLICT",
        remaining <= 0
          ? "Maaf, hadiah ini sudah dipilih tamu lain."
          : `Maaf, tersisa ${remaining} saja untuk hadiah ini.`,
      );
    }
    await tx
      .insert(wishlistClaims)
      .values({ wishId, guestId, quantity })
      .onConflictDoUpdate({
        target: [wishlistClaims.wishId, wishlistClaims.guestId],
        set: { quantity },
      });
  });

  const mine = (await myClaims(db, guestId)).find((c) => c.wishId === wishId)?.quantity ?? 0;
  return { wish: await getWish(db, wishId), mine };
}
