import { DEFAULT_SITE_NAME, type Settings } from "@wedding/shared";
import type { Db } from "../db/client.js";
import { settings } from "../db/schema.js";

export async function getSettings(db: Db): Promise<Settings | null> {
  const [row] = await db.select().from(settings).limit(1);
  return row
    ? {
        siteName: row.siteName,
        groomName: row.groomName,
        brideName: row.brideName,
        publicBaseUrl: row.publicBaseUrl,
        countdownAt: row.countdownAt?.toISOString() ?? null,
      }
    : null;
}

/** "Hasri & Ramli" untuk judul halaman; kosong bila nama mempelai belum diisi lengkap. */
export function coupleName(value: Pick<Settings, "brideName" | "groomName"> | null): string {
  const bride = value?.brideName.trim() ?? "";
  const groom = value?.groomName.trim() ?? "";
  return bride && groom ? `${bride} & ${groom}` : bride || groom;
}

/** Nama situs yang dipakai (bawaan bila belum diatur). */
export async function getSiteName(db: Db): Promise<string> {
  const [row] = await db.select({ name: settings.siteName }).from(settings).limit(1);
  return row?.name || DEFAULT_SITE_NAME;
}

export async function saveSettings(db: Db, input: Settings): Promise<Settings> {
  const values = {
    siteName: input.siteName,
    groomName: input.groomName,
    brideName: input.brideName,
    publicBaseUrl: input.publicBaseUrl,
    countdownAt: input.countdownAt ? new Date(input.countdownAt) : null,
  };
  await db
    .insert(settings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: settings.id, set: { ...values, updatedAt: new Date() } });
  return input;
}
