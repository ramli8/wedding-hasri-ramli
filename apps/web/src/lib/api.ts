import {
  type ChangePasswordRequest,
  type ErrorCode,
  errorResponseSchema,
  type LoginRequest,
  type MeResponse,
  meResponseSchema,
} from "@wedding/shared";
import { z } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | "NETWORK",
    message: string,
  ) {
    super(message);
  }
}

const okSchema = z.object({ ok: z.literal(true) });

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      credentials: "same-origin",
      ...init,
      headers: { "content-type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Tidak bisa terhubung ke server");
  }

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = errorResponseSchema.safeParse(json);
    throw new ApiError(
      res.status,
      parsed.success ? parsed.data.error.code : "INTERNAL",
      parsed.success ? parsed.data.error.message : "Terjadi kesalahan pada server",
    );
  }
  return schema.parse(json);
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const api = {
  login: (body: LoginRequest) => request("/v1/auth/login", meResponseSchema, post(body)),
  logout: () => request("/v1/auth/logout", okSchema, post({})),
  changePassword: (body: ChangePasswordRequest) =>
    request("/v1/auth/change-password", okSchema, post(body)),
  /** Mengembalikan null bila belum masuk (401), bukan melempar error. */
  async me(): Promise<MeResponse | null> {
    try {
      return await request("/v1/auth/me", meResponseSchema);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },
};
