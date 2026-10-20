import {
  errorResponseSchema,
  type PairResponse,
  type PushRequest,
  type PushResponse,
  pairResponseSchema,
  pushResponseSchema,
  type SnapshotResponse,
  SYNC_PROTOCOL_VERSION,
  SYNC_VERSION_HEADER,
  snapshotResponseSchema,
} from "@wedding/shared";
import type { z } from "zod";
import { ApiError } from "../api.js";

async function call<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit,
  token?: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        [SYNC_VERSION_HEADER]: String(SYNC_PROTOCOL_VERSION),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
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

export const deviceApi = {
  pair: (code: string): Promise<PairResponse> =>
    call("/v1/device/pair", pairResponseSchema, {
      method: "POST",
      body: JSON.stringify({ code, userAgent: navigator.userAgent.slice(0, 300) }),
    }),

  snapshot: (token: string, since: { rev: number; seq: number }): Promise<SnapshotResponse> =>
    call(
      `/v1/sync/snapshot?sinceRev=${since.rev}&sinceSeq=${since.seq}`,
      snapshotResponseSchema,
      { method: "GET" },
      token,
    ),

  push: (token: string, body: PushRequest): Promise<PushResponse> =>
    call(
      "/v1/sync/push",
      pushResponseSchema,
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
};
