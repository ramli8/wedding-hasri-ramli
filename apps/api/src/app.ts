import { Hono } from "hono";
import type { AppDeps, AppEnv } from "./http/env.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";
import { requestLogger } from "./http/middleware.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { deviceRoutes, syncRoutes } from "./routes/device.js";
import { healthRoutes } from "./routes/health.js";

export function createApp(deps: AppDeps) {
  const v1 = new Hono<AppEnv>()
    .route("/auth", authRoutes(deps))
    .route("/admin", adminRoutes(deps))
    .route("/device", deviceRoutes(deps))
    .route("/sync", syncRoutes(deps));

  const api = new Hono<AppEnv>().route("/", healthRoutes(deps)).route("/v1", v1);

  return new Hono<AppEnv>()
    .use("*", requestLogger(deps.logger))
    .route("/api", api)
    .onError(errorHandler(deps.logger))
    .notFound(notFoundHandler);
}

export type App = ReturnType<typeof createApp>;
