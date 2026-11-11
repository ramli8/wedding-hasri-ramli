import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type ProxyOptions } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Server API untuk proxy; uji e2e memakai port lain agar tidak bentrok dengan server pengembangan.
const apiTarget = process.env.API_TARGET ?? "http://localhost:3000";

// Lewat Cloudflare Quick Tunnel browser mengirim Origin https://xxx.trycloudflare.com, yang ditolak
// pemeriksaan Origin di API (403 "Origin tidak diizinkan"). Khusus server pengembangan, Origin itu
// ditulis ulang menjadi origin lokal; API dan produksi tetap memeriksa Origin apa adanya.
const devProxy: ProxyOptions = {
  target: apiTarget,
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => {
      const origin = proxyReq.getHeader("origin");
      if (typeof origin === "string" && /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin)) {
        proxyReq.setHeader("origin", "http://localhost:5173");
      }
    });
  },
};

const CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt": versi baru tidak pernah menggantikan versi lama sendiri. Di hari-H aplikasi
      // tidak boleh berganti di tengah antrean; penjaga memperbarui secara sadar (lihat scanner).
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Hasri & Ramli",
        short_name: "H&R",
        description: "Admin dan check-in tamu pernikahan Hasri & Ramli",
        lang: "id",
        start_url: "/scan",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Seluruh aplikasi, font, dan WASM pembaca QR harus ada di cache agar scanner terbuka offline.
        globPatterns: ["**/*.{js,css,html,woff2,wasm,png,svg}"],
        // Subset font yang tidak dipakai (bahasa Indonesia hanya butuh latin) tidak perlu di-cache.
        globIgnores: ["**/*vietnamese*", "**/*latin-ext*"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/media\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
    // Untuk uji di HP lewat Cloudflare Quick Tunnel (cloudflared tunnel --url http://localhost:5173).
    allowedHosts: [".trycloudflare.com"],
    proxy: { "/api": devProxy, "/media": apiTarget },
  },
  preview: {
    port: 4173,
    // CSP yang sama dengan deploy/web.Caddyfile, supaya `pnpm e2e` (build produksi) ikut menguji
    // bahwa aplikasi tetap jalan di bawah kebijakan itu. Ubah keduanya bersamaan.
    headers: { "Content-Security-Policy": CSP },
    proxy: { "/api": apiTarget, "/media": apiTarget },
  },
});
