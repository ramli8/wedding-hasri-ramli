import { randomInt } from "node:crypto";
import type {
  Doorprize,
  DoorprizeDrawResponse,
  DoorprizeInput,
  DoorprizeList,
  DoorprizeWinner,
} from "@wedding/shared";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { doorprizePrizes, doorprizeWinners, guestGroups, guests } from "../db/schema.js";
import { AppError } from "../http/errors.js";

type Executor = Parameters<Parameters<Db["transaction"]>[0]>[0] | Db;

/** Banyak nama contoh untuk animasi acak di layar undian. */
const SAMPLE_SIZE = 60;

/**
 * Peserta undian: tamu yang punya check-in yang tidak dibatalkan, belum dihapus, dan belum pernah
 * diundi (menang atau dicoret).
 */
async function eligibleGuests(db: Executor): Promise<{ id: string; name: string }[]> {
  const rows = await db.execute<{ id: string; name: string }>(sql`
    select g.id, g.display_name as name
    from guests g
    where g.deleted_at is null
      and exists (
        select 1 from checkin_events c
        where c.guest_id = g.id and c.kind = 'checkin'
          and not exists (
            select 1 from checkin_events u where u.kind = 'undo' and u.target_id = c.id
          )
      )
      and not exists (select 1 from doorprize_winners w where w.guest_id = g.id)
    order by g.id
  `);
  return [...rows];
}

async function loadWinners(db: Executor, prizeIds: string[]) {
  if (prizeIds.length === 0) return new Map<string, DoorprizeWinner[]>();
  const rows = await db
    .select({
      id: doorprizeWinners.id,
      prizeId: doorprizeWinners.prizeId,
      guestId: doorprizeWinners.guestId,
      guestName: guests.displayName,
      groupName: guestGroups.name,
      drawnAt: doorprizeWinners.drawnAt,
      forfeitedAt: doorprizeWinners.forfeitedAt,
    })
    .from(doorprizeWinners)
    .innerJoin(guests, eq(guests.id, doorprizeWinners.guestId))
    .leftJoin(guestGroups, eq(guestGroups.id, guests.groupId))
    .where(inArray(doorprizeWinners.prizeId, prizeIds))
    .orderBy(asc(doorprizeWinners.drawnAt));
  const byPrize = new Map<string, DoorprizeWinner[]>();
  for (const { prizeId, ...row } of rows) {
    const list = byPrize.get(prizeId) ?? [];
    list.push({
      ...row,
      drawnAt: row.drawnAt.toISOString(),
      forfeitedAt: row.forfeitedAt?.toISOString() ?? null,
    });
    byPrize.set(prizeId, list);
  }
  return byPrize;
}

async function getPrize(db: Executor, id: string): Promise<Doorprize> {
  const [row] = await db.select().from(doorprizePrizes).where(eq(doorprizePrizes.id, id));
  if (!row) throw new AppError(404, "NOT_FOUND", "Hadiah tidak ditemukan");
  const winners = await loadWinners(db, [id]);
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    sortOrder: row.sortOrder,
    winners: winners.get(id) ?? [],
  };
}

function sample<T>(items: T[], size: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy.slice(0, size);
}

export async function listDoorprize(db: Db): Promise<DoorprizeList> {
  const rows = await db
    .select()
    .from(doorprizePrizes)
    .orderBy(asc(doorprizePrizes.sortOrder), asc(doorprizePrizes.createdAt));
  const winners = await loadWinners(
    db,
    rows.map((r) => r.id),
  );
  const pool = await eligibleGuests(db);
  return {
    prizes: rows.map((row) => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      sortOrder: row.sortOrder,
      winners: winners.get(row.id) ?? [],
    })),
    poolSize: pool.length,
    poolSample: sample(pool, SAMPLE_SIZE).map((g) => g.name),
  };
}

export async function createDoorprize(db: Db, input: DoorprizeInput): Promise<Doorprize> {
  const [{ next } = { next: 0 }] = await db
    .select({ next: sql<number>`coalesce(max(${doorprizePrizes.sortOrder}) + 1, 0)::int` })
    .from(doorprizePrizes);
  const [row] = await db
    .insert(doorprizePrizes)
    .values({ name: input.name, quantity: input.quantity, sortOrder: next })
    .returning({ id: doorprizePrizes.id });
  if (!row) throw new Error("Gagal menyimpan hadiah");
  return getPrize(db, row.id);
}

export async function updateDoorprize(
  db: Db,
  id: string,
  input: DoorprizeInput,
): Promise<Doorprize> {
  const updated = await db
    .update(doorprizePrizes)
    .set({ name: input.name, quantity: input.quantity })
    .where(eq(doorprizePrizes.id, id))
    .returning({ id: doorprizePrizes.id });
  if (updated.length === 0) throw new AppError(404, "NOT_FOUND", "Hadiah tidak ditemukan");
  return getPrize(db, id);
}

/** Menghapus hadiah beserta hasil undiannya; pemenangnya kembali ikut undian hadiah lain. */
export async function deleteDoorprize(db: Db, id: string): Promise<void> {
  const deleted = await db
    .delete(doorprizePrizes)
    .where(eq(doorprizePrizes.id, id))
    .returning({ id: doorprizePrizes.id });
  if (deleted.length === 0) throw new AppError(404, "NOT_FOUND", "Hadiah tidak ditemukan");
}

/** Satu undian dalam transaksi yang sudah memegang kunci hadiah. */
async function drawIn(tx: Executor, prizeId: string): Promise<DoorprizeDrawResponse> {
  const [prize] = await tx
    .select()
    .from(doorprizePrizes)
    .where(eq(doorprizePrizes.id, prizeId))
    .for("update");
  if (!prize) throw new AppError(404, "NOT_FOUND", "Hadiah tidak ditemukan");
  const active = await tx
    .select({ id: doorprizeWinners.id })
    .from(doorprizeWinners)
    .where(and(eq(doorprizeWinners.prizeId, prizeId), isNull(doorprizeWinners.forfeitedAt)));
  if (active.length >= prize.quantity) {
    throw new AppError(409, "CONFLICT", `Pemenang ${prize.name} sudah lengkap`);
  }
  const pool = await eligibleGuests(tx);
  const picked = pool.length > 0 ? pool[randomInt(pool.length)] : undefined;
  if (!picked) {
    throw new AppError(409, "CONFLICT", "Tidak ada lagi tamu check-in yang bisa diundi");
  }
  const [winner] = await tx
    .insert(doorprizeWinners)
    .values({ prizeId, guestId: picked.id })
    .returning({ id: doorprizeWinners.id });
  if (!winner) throw new Error("Gagal menyimpan pemenang");
  const full = await getPrize(tx, prizeId);
  const saved = full.winners.find((w) => w.id === winner.id);
  if (!saved) throw new Error("Pemenang tidak terbaca");
  return { prize: full, winner: saved };
}

/** Kunci tunggal undian: dua klik "Undi" bersamaan tidak memilih tamu yang sama atau melebihi kuota. */
const lockDraw = (tx: Executor) => tx.execute(sql`select pg_advisory_xact_lock(7401)`);

export async function drawDoorprize(db: Db, prizeId: string): Promise<DoorprizeDrawResponse> {
  return db.transaction(async (tx) => {
    await lockDraw(tx);
    return drawIn(tx, prizeId);
  });
}

/** Pemenang tidak maju: namanya dicoret (tidak ikut lagi) lalu hadiahnya langsung diundi ulang. */
export async function redrawDoorprize(db: Db, winnerId: string): Promise<DoorprizeDrawResponse> {
  return db.transaction(async (tx) => {
    await lockDraw(tx);
    const [winner] = await tx
      .update(doorprizeWinners)
      .set({ forfeitedAt: new Date() })
      .where(and(eq(doorprizeWinners.id, winnerId), isNull(doorprizeWinners.forfeitedAt)))
      .returning({ prizeId: doorprizeWinners.prizeId });
    if (!winner)
      throw new AppError(404, "NOT_FOUND", "Pemenang tidak ditemukan atau sudah dicoret");
    return drawIn(tx, winner.prizeId);
  });
}

/** Membatalkan satu hasil undian (mis. salah klik saat gladi); tamunya ikut diundi lagi. */
export async function deleteDoorprizeWinner(db: Db, winnerId: string): Promise<void> {
  const deleted = await db
    .delete(doorprizeWinners)
    .where(eq(doorprizeWinners.id, winnerId))
    .returning({ id: doorprizeWinners.id });
  if (deleted.length === 0) throw new AppError(404, "NOT_FOUND", "Pemenang tidak ditemukan");
}
