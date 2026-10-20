import type { ErrorCode, ErrorResponse } from "@wedding/shared";
import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Logger } from "../logger.js";

export class AppError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const body = (code: ErrorCode, message: string): ErrorResponse => ({ error: { code, message } });

export function errorHandler(logger: Logger): ErrorHandler {
  return (err, c) => {
    if (err instanceof AppError) {
      return c.json(body(err.code, err.message), err.status);
    }
    if (err instanceof HTTPException) {
      // mis. JSON body rusak dari zValidator
      const code: ErrorCode = err.status === 400 ? "VALIDATION_ERROR" : "INTERNAL";
      return c.json(body(code, err.message), err.status as ContentfulStatusCode);
    }
    logger.error({ err }, "unhandled error");
    return c.json(body("INTERNAL", "Terjadi kesalahan pada server"), 500);
  };
}

export const notFoundHandler: NotFoundHandler = (c) =>
  c.json(body("NOT_FOUND", "Tidak ditemukan"), 404);
