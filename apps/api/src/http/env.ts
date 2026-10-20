import type { Admin } from "@wedding/shared";
import type { Config } from "../config.js";
import type { Db } from "../db/client.js";
import type { Logger } from "../logger.js";
import type { DeviceRow } from "../services/devices.js";

export type AppEnv = {
  Variables: {
    admin: Admin;
    sessionId: string;
    requestId: string;
    device: DeviceRow;
    syncVersion: number;
  };
};

export type AppDeps = {
  db: Db;
  config: Config;
  logger: Logger;
};
