import type { Settings } from "@wedding/shared";
import type { Db } from "../db/client.js";
import { settings } from "../db/schema.js";

export async function getSettings(db: Db): Promise<Settings | null> {
  const [row] = await db.select().from(settings).limit(1);
  return row
    ? {
        groomName: row.groomName,
        brideName: row.brideName,
        publicBaseUrl: row.publicBaseUrl,
        countdownAt: row.countdownAt?.toISOString() ?? null,
      }
    : null;
}

export async function saveSettings(db: Db, input: Settings): Promise<Settings> {
  const values = {
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
