import { type Context, Hono } from "hono";
import { z } from "zod";
import { FailureLimiter } from "../auth/rate-limit.js";
import type { AppDeps, AppEnv } from "../http/env.js";
import { clientIp } from "../http/middleware.js";
import { getGuestPhoto } from "../services/booth.js";
import { findGuestByCode } from "../services/public.js";
import { buildPhotoPreview, buildPreview, type LinkPreview } from "../services/seo.js";

const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/** Tag pratinjau tautan yang dibaca crawler WhatsApp, Instagram, Telegram, dan sejenisnya. */
export function renderHead(preview: LinkPreview): string {
  const tag = (property: string, content: string) =>
    `<meta property="${property}" content="${escapeHtml(content)}" />`;
  const lines = [
    `<title>${escapeHtml(preview.title)}</title>`,
    `<meta name="description" content="${escapeHtml(preview.description)}" />`,
    // Halaman ini pribadi per tamu, jadi jangan diindeks mesin pencari.
    `<meta name="robots" content="noindex, nofollow" />`,
    tag("og:type", "website"),
    tag("og:site_name", preview.siteName),
    tag("og:title", preview.title),
    tag("og:description", preview.description),
    tag("og:url", preview.url),
    `<meta name="twitter:card" content="${preview.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(preview.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(preview.description)}" />`,
  ];
  if (preview.image) {
    lines.push(
      tag("og:image", preview.image),
      `<meta name="twitter:image" content="${escapeHtml(preview.image)}" />`,
    );
  }
  return lines.join("\n    ");
}

/** Mengganti <title> bawaan dan menyisipkan tag pratinjau sebelum </head>. */
export function injectHead(html: string, preview: LinkPreview): string {
  // Pengganti berupa fungsi: nama tamu bisa memuat "$&" / "$'" yang pada string pengganti biasa
  // dibaca sebagai pola khusus dan menyalin potongan HTML ke dalam tag.
  const head = `    ${renderHead(preview)}\n  </head>`;
  return html.replace(/<title>[\s\S]*?<\/title>/i, () => "").replace(/<\/head>/i, () => head);
}

const CACHE_MS = 30_000;

/**
 * index.html aplikasi web (dari WEB_INDEX_URL, di-cache 30 detik) yang disajikan dengan tag Open
 * Graph tambahan; aplikasinya sendiri tetap SPA yang berjalan di browser seperti biasa.
 */
function indexPage({ config, logger }: AppDeps) {
  let cached: { html: string; at: number } | null = null;

  async function loadIndex(): Promise<string | null> {
    if (!config.webIndexUrl) return null;
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.html;
    try {
      const res = await fetch(config.webIndexUrl, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const html = await res.text();
      cached = { html, at: Date.now() };
      return html;
    } catch (err) {
      logger.warn({ err }, "gagal memuat index.html web untuk pratinjau tautan");
      return cached?.html ?? null;
    }
  }

  /** Halaman dengan pratinjau; tanpa pratinjau (data tidak ada) index.html apa adanya. */
  return async (
    c: Context<AppEnv>,
    preview: () => Promise<LinkPreview | null>,
  ): Promise<Response> => {
    const html = await loadIndex();
    if (!html) return c.text("Halaman belum tersedia.", 503);
    const head = await preview();
    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    c.header("X-Robots-Tag", "noindex, nofollow");
    return c.body(head ? injectHead(html, head) : html);
  };
}

/** Halaman tamu (/u/KODE dan /u/KODE/undangan) dengan tag Open Graph per tamu. */
export function shareRoutes(deps: AppDeps) {
  const { db, config } = deps;
  const serve = indexPage(deps);
  // Halaman ini membedakan kode valid (ada tag nama tamu) dari yang tidak, jadi tebakan kode yang
  // salah dibatasi per IP seperti di /api/v1/public. Yang diblokir tetap mendapat halaman, hanya
  // tanpa pratinjau (crawler WhatsApp tidak pernah menebak, jadi tidak terkena).
  const guessLimiter = new FailureLimiter({ max: 30, windowMs: 15 * 60 * 1000 });

  const page = (suffix: string) => (c: Context<AppEnv>) =>
    serve(c, async () => {
      const code = (c.req.param("code") ?? "").toUpperCase();
      const ip = clientIp(c, config.trustProxy);
      const guest = code && !guessLimiter.isBlocked(ip) ? await findGuestByCode(db, code) : null;
      if (code && !guest) guessLimiter.recordFailure(ip);
      return guest
        ? buildPreview(db, { panggilan: guest.displayName, path: `/u/${code}${suffix}` })
        : null;
    });

  return new Hono<AppEnv>().get("/:code", page("")).get("/:code/undangan", page("/undangan"));
}

const photoId = z.uuid();

/**
 * Halaman foto photobooth (/foto/<id>) dengan pratinjau tautan berisi foto itu, agar tautan yang
 * dikirim tamu lewat WhatsApp tampil dengan gambarnya. Seperti GET /public/foto/:id, tanpa
 * pembatas tebakan per IP: id foto acak (uuid v7) tidak bisa ditebak.
 */
export function photoShareRoutes(deps: AppDeps) {
  const serve = indexPage(deps);
  return new Hono<AppEnv>().get("/:id", (c) =>
    serve(c, async () => {
      const id = photoId.safeParse(c.req.param("id"));
      if (!id.success) return null;
      const photo = await getGuestPhoto(deps.db, id.data);
      if (typeof photo === "string") return null;
      return buildPhotoPreview(deps.db, { id: id.data, thumb: photo.photo.media.thumb });
    }),
  );
}
