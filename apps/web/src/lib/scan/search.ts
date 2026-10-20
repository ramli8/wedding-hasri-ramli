import type { SnapshotGuest } from "@wedding/shared";
import MiniSearch from "minisearch";
import { extractCode } from "./actions.js";
import { db, getMeta } from "./db.js";

let index: MiniSearch<SnapshotGuest> | null = null;
let signature = "";

/** Indeks dibangun ulang hanya bila daftar tamu berubah (1000 tamu: puluhan milidetik). */
async function ensureIndex() {
  const next = `${await db.guests.count()}:${(await getMeta("guestRev")) ?? 0}:${await db.walkins.count()}`;
  if (index && next === signature) return index;
  index = new MiniSearch<SnapshotGuest>({
    fields: ["displayName", "fullName", "code"],
    idField: "id",
    searchOptions: { prefix: true, fuzzy: 0.2, combineWith: "AND" },
  });
  index.addAll(await db.guests.toArray());
  signature = next;
  return index;
}

/** Mencari tamu berdasarkan nama atau kode, tahan salah ketik, tanpa jaringan. */
export async function searchGuests(query: string, limit = 8): Promise<SnapshotGuest[]> {
  const text = query.trim();
  if (text.length < 2) return [];

  // Kode lengkap: cocokkan persis, lalu tampilkan sebagai satu-satunya hasil.
  const code = extractCode(text);
  if (code) {
    const exact = await db.guests.where("code").equals(code).first();
    if (exact) return [exact];
  }

  const found = (await ensureIndex()).search(text).slice(0, limit);
  const guests = await db.guests.bulkGet(found.map((r) => r.id as string));
  return guests.filter((g): g is SnapshotGuest => !!g);
}
