import { type SettingsResponse, settingsInputSchema } from "@wedding/shared";
import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { validate } from "../http/validate.js";
import { getSettings, saveSettings } from "../services/settings.js";

export function settingsRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>()
    .get("/", async (c) => {
      return c.json({ settings: await getSettings(db) } satisfies SettingsResponse);
    })
    .put("/", validate("json", settingsInputSchema), async (c) => {
      const settings = await saveSettings(db, c.req.valid("json"));
      return c.json({ settings } satisfies SettingsResponse);
    });
}
