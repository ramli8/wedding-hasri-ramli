import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { AppError } from "./errors.js";

export const validate = <T extends ZodType>(target: "json" | "query" | "param", schema: T) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        result.error.issues[0]?.message ?? "Data tidak valid",
      );
    }
  });
