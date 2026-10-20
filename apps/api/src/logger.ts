import pino from "pino";
import type { Config } from "./config.js";

export type Logger = pino.Logger;

export function createLogger(config: Pick<Config, "env" | "logLevel">): Logger {
  return pino({
    level: config.env === "test" ? "silent" : config.logLevel,
    ...(config.env === "development" ? { transport: { target: "pino-pretty" } } : {}),
  });
}
