import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { getHome } from "../services/home.js";

/** Ringkasan Beranda admin. */
export function homeRoutes({ db }: AppDeps) {
  return new Hono<AppEnv>().get("/", async (c) => c.json(await getHome(db)));
}
