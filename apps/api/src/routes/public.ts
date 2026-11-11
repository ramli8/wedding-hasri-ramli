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
import { getGuestPhoto } from "../services/booth.js";
import { createInvitationCache, type InvitationCache } from "../services/layout.js";
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
const photoParam = z.object({ id: z.uuid() });

/**
 * Rute tanpa login untuk tamu. Dua pembatas per IP: tebakan kode yang salah (agar kode tidak bisa
 * dicoba satu per satu) dan jumlah kiriman RSVP/ucapan (agar tidak dipakai spam).
 */
export function publicRoutes(
  { db, config }: AppDeps,
  invitation: InvitationCache = createInvitationCache(db),
) {
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

  /**
   * Kiriman dihitung per kode tamu, bukan per IP: operator seluler di Indonesia memakai CGNAT dan
   * tamu di gedung berbagi Wi-Fi yang sama, jadi batas per IP bisa memblokir banyak tamu sekaligus.
   * Menulis selalu butuh kode yang valid, jadi spam tetap terbatas per tamu.
   */
  function countWrite(code: string) {
    if (writeLimiter.isBlocked(code)) throw tooMany();
    writeLimiter.recordFailure(code);
  }

  return (
    new Hono<AppEnv>()
      // Isi undangan (mempelai, cerita) tidak memuat data tamu, jadi tidak memerlukan kode.
      .get("/invitation", async (c) => {
        c.header("cache-control", "public, max-age=30");
        c.header("content-type", "application/json");
        return c.body(await invitation.get());
      })
      // Foto photobooth dari QR di cetakan. 404 = belum terunggah (booth offline; halaman tamu
      // menunggu dan memeriksa ulang), 410 = dihapus admin. Tidak ada pembatas tebakan per IP: id
      // foto punya 74 bit acak sehingga tidak bisa ditebak, sedangkan tamu yang menunggu di Wi-Fi
      // gedung atau CGNAT berbagi IP dan akan saling memblokir. Batas umum 1200/menit per IP di
      // app.ts tetap berlaku.
      .get("/foto/:id", validate("param", photoParam), async (c) => {
        const found = await getGuestPhoto(db, c.req.valid("param").id);
        if (found === "pending") throw new AppError(404, "NOT_FOUND", "Foto belum tersedia");
        if (found === "deleted") {
          throw new AppError(410, "NOT_FOUND", "Foto ini sudah dihapus oleh pengantin");
        }
        return c.json(found);
      })
      .get("/ticket/:code", validate("param", codeParam), async (c) => {
        const { code } = c.req.valid("param");
        await knownCode(clientIp(c, config.trustProxy), code);
        c.header("cache-control", "no-store");
        return c.json(await getTicket(db, code));
      })
      .post("/rsvp", validate("json", rsvpRequestSchema), async (c) => {
        const input = c.req.valid("json");
        await knownCode(clientIp(c, config.trustProxy), input.code);
        countWrite(input.code);
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
        const guest = await knownCode(clientIp(c, config.trustProxy), input.code);
        countWrite(input.code);
        const result = await setClaim(db, guest.id, input.wishId, input.quantity);
        invitation.invalidate(); // jumlah terpilih berubah
        return c.json(result);
      })
      .get("/guestbook", validate("query", guestbookListQuerySchema), async (c) => {
        const { page, pageSize } = c.req.valid("query");
        return c.json(guestbookListResponseSchema.parse(await listGuestbook(db, page, pageSize)));
      })
      .post("/guestbook", validate("json", guestbookPostRequestSchema), async (c) => {
        const input = c.req.valid("json");
        await knownCode(clientIp(c, config.trustProxy), input.code);
        countWrite(input.code);
        return c.json({ entry: await postGuestbook(db, input) }, 201);
      })
  );
}
