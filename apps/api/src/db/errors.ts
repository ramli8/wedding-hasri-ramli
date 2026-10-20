/** Drizzle membungkus error driver di `cause`, jadi kode Postgres dicari menelusuri rantai itu. */
export function pgError(err: unknown): { code?: string; constraint?: string } {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth++) {
    const e = current as { code?: unknown; constraint_name?: unknown; cause?: unknown };
    if (typeof e.code === "string") {
      return {
        code: e.code,
        constraint: typeof e.constraint_name === "string" ? e.constraint_name : undefined,
      };
    }
    current = e.cause;
  }
  return {};
}

export function isUniqueViolation(err: unknown, constraint?: string) {
  const { code, constraint: name } = pgError(err);
  return code === "23505" && (constraint === undefined || name === constraint);
}

export function isForeignKeyViolation(err: unknown) {
  return pgError(err).code === "23503";
}
