import { Hono } from "hono";
import type { AppDeps, AppEnv } from "../http/env.js";
import { findGuestByCode } from "../services/public.js";
import { buildPreview, type LinkPreview } from "../services/seo.js";

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
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<\/head>/i, `    ${renderHead(preview)}\n  </head>`);
}

const CACHE_MS = 30_000;

/**
 * Halaman tamu (/u/KODE dan /u/KODE/undangan). Isinya index.html aplikasi web ditambah tag Open
 * Graph per tamu; aplikasinya sendiri tetap SPA yang berjalan di browser seperti biasa.
 */
export function shareRoutes({ db, config, logger }: AppDeps) {
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

  const page = (suffix: string) => async (c: import("hono").Context<AppEnv>) => {
    const html = await loadIndex();
    if (!html) return c.text("Halaman belum tersedia.", 503);
    const code = (c.req.param("code") ?? "").toUpperCase();
    const guest = code ? await findGuestByCode(db, code) : null;
    const preview = guest
      ? await buildPreview(db, { panggilan: guest.displayName, path: `/u/${code}${suffix}` })
      : null;
    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    c.header("X-Robots-Tag", "noindex, nofollow");
    return c.body(preview ? injectHead(html, preview) : html);
  };

  return new Hono<AppEnv>().get("/:code", page("")).get("/:code/undangan", page("/undangan"));
}
