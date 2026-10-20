import type { Settings } from "@wedding/shared";
import type { Db } from "../db/client.js";
import { settings } from "../db/schema.js";

export async function getSettings(db: Db): Promise<Settings | null> {
  const [row] = await db.select().from(settings).limit(1);
  return row
    ? { groomName: row.groomName, brideName: row.brideName, publicBaseUrl: row.publicBaseUrl }
    : null;
}

export async function saveSettings(db: Db, input: Settings): Promise<Settings> {
  await db
    .insert(settings)
    .values({ id: 1, ...input })
    .onConflictDoUpdate({ target: settings.id, set: { ...input, updatedAt: new Date() } });
  return input;
}
