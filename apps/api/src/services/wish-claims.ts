import type { AdminWish, Wish } from "@wedding/shared";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { guests, receivedGifts, wishlistClaims, wishlistItems } from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { getWish, listWishes } from "./invitation.js";
import { todayWib } from "./received-gifts.js";

// --- Untuk admin: siapa memilih apa ---------------------------------------------------------------

async function claimsFor(db: Db) {
  const rows = await db
    .select({
      wishId: wishlistClaims.wishId,
      guestId: wishlistClaims.guestId,
      guestName: guests.displayName,
      quantity: wishlistClaims.quantity,
      receivedGiftId: wishlistClaims.receivedGiftId,
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

/**
 * Barang yang dipilih tamu sudah diterima: membuat catatan hadiah masuk (jenis barang) atas nama
 * tamu itu dan menautkannya ke pilihan, sehingga tidak tercatat dua kali.
 */
export async function markClaimReceived(
  db: Db,
  adminId: string,
  wishId: string,
  guestId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [claim] = await tx
      .select()
      .from(wishlistClaims)
      .where(and(eq(wishlistClaims.wishId, wishId), eq(wishlistClaims.guestId, guestId)))
      .for("update");
    if (!claim) throw new AppError(404, "NOT_FOUND", "Pilihan tamu tidak ditemukan");
    if (claim.receivedGiftId) {
      throw new AppError(409, "CONFLICT", "Barang ini sudah dicatat sebagai hadiah masuk");
    }
    const [wish] = await tx.select().from(wishlistItems).where(eq(wishlistItems.id, wishId));
    const [guest] = await tx
      .select({ displayName: guests.displayName })
      .from(guests)
      .where(eq(guests.id, guestId));
    if (!wish || !guest) throw new AppError(404, "NOT_FOUND", "Hadiah atau tamu tidak ditemukan");

    const [gift] = await tx
      .insert(receivedGifts)
      .values({
        guestId,
        giverName: guest.displayName,
        kind: "barang",
        itemDescription: claim.quantity > 1 ? `${wish.name} × ${claim.quantity}` : wish.name,
        note: "Dari wishlist",
        receivedOn: todayWib(),
        recordedBy: adminId,
      })
      .returning({ id: receivedGifts.id });
    if (!gift) throw new Error("Gagal mencatat hadiah masuk");
    await tx
      .update(wishlistClaims)
      .set({ receivedGiftId: gift.id })
      .where(and(eq(wishlistClaims.wishId, wishId), eq(wishlistClaims.guestId, guestId)));
  });
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
    const remaining = wish.quantity - (others?.total ?? 0);
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
