import {
  guestbookListQuerySchema,
  guestbookListResponseSchema,
  guestbookPostRequestSchema,
  guestCodeSchema,
  rsvpRequestSchema,
  wishClaimRequestSchema,
} from "@wedding/shared";
import { Hono } from "hono";
import { z } from "zod";
import { FailureLimiter } from "../auth/rate-limit.js";
import type { AppDeps, AppEnv } from "../http/env.js";
import { AppError } from "../http/errors.js";
import { clientIp } from "../http/middleware.js";
import { validate } from "../http/validate.js";
import { getInvitation } from "../services/invitation.js";
import {
  findGuestByCode,
  getTicket,
  listGuestbook,
  postGuestbook,
  submitRsvp,
} from "../services/public.js";
import { myClaims, setClaim } from "../services/wish-claims.js";

const WINDOW_MS = 15 * 60 * 1000;
const codeParam = z.object({ code: guestCodeSchema });

/**
 * Rute tanpa login untuk tamu. Dua pembatas per IP: tebakan kode yang salah (agar kode tidak bisa
 * dicoba satu per satu) dan jumlah kiriman RSVP/ucapan (agar tidak dipakai spam).
 */
export function publicRoutes({ db, config }: AppDeps) {
  const guessLimiter = new FailureLimiter({ max: 30, windowMs: WINDOW_MS });
  const writeLimiter = new FailureLimiter({ max: 20, windowMs: WINDOW_MS });
  const tooMany = () =>
    new AppError(429, "RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.");

  /** Memastikan kode dikenal; tebakan salah dihitung per IP. Mengembalikan tamunya. */
  async function knownCode(ip: string, code: string) {
    if (guessLimiter.isBlocked(ip)) throw tooMany();
    const guest = await findGuestByCode(db, code);
    if (!guest) {
      guessLimiter.recordFailure(ip);
      throw new AppError(404, "NOT_FOUND", "Tiket tidak ditemukan");
    }
    return guest;
  }

  function countWrite(ip: string) {
    if (writeLimiter.isBlocked(ip)) throw tooMany();
    writeLimiter.recordFailure(ip);
  }

  return (
    new Hono<AppEnv>()
      // Isi undangan (mempelai, cerita) tidak memuat data tamu, jadi tidak memerlukan kode.
      .get("/invitation", async (c) => {
        c.header("cache-control", "public, max-age=30");
        return c.json(await getInvitation(db));
      })
      .get("/ticket/:code", validate("param", codeParam), async (c) => {
        const { code } = c.req.valid("param");
        await knownCode(clientIp(c, config.trustProxy), code);
        c.header("cache-control", "no-store");
        return c.json(await getTicket(db, code));
      })
      .post("/rsvp", validate("json", rsvpRequestSchema), async (c) => {
        const input = c.req.valid("json");
        const ip = clientIp(c, config.trustProxy);
        await knownCode(ip, input.code);
        countWrite(ip);
        return c.json({ rsvp: await submitRsvp(db, input) });
      })
      // Hadiah wishlist yang dipilih tamu ini (hanya miliknya sendiri).
      .get("/claims/:code", validate("param", codeParam), async (c) => {
        const guest = await knownCode(clientIp(c, config.trustProxy), c.req.valid("param").code);
        c.header("cache-control", "no-store");
        return c.json({ claims: await myClaims(db, guest.id) });
      })
      .post("/claims", validate("json", wishClaimRequestSchema), async (c) => {
        const input = c.req.valid("json");
        const ip = clientIp(c, config.trustProxy);
        const guest = await knownCode(ip, input.code);
        countWrite(ip);
        return c.json(await setClaim(db, guest.id, input.wishId, input.quantity));
      })
      .get("/guestbook", validate("query", guestbookListQuerySchema), async (c) => {
        const { page, pageSize } = c.req.valid("query");
        return c.json(guestbookListResponseSchema.parse(await listGuestbook(db, page, pageSize)));
      })
      .post("/guestbook", validate("json", guestbookPostRequestSchema), async (c) => {
        const input = c.req.valid("json");
        const ip = clientIp(c, config.trustProxy);
        await knownCode(ip, input.code);
        countWrite(ip);
        return c.json({ entry: await postGuestbook(db, input) }, 201);
      })
  );
}
