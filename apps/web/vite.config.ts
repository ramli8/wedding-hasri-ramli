import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Server API untuk proxy; uji e2e memakai port lain agar tidak bentrok dengan server pengembangan.
const apiTarget = process.env.API_TARGET ?? "http://localhost:3000";

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
    // Origin dibiarkan apa adanya (http://localhost:5173) agar lolos pemeriksaan Origin di API.
    proxy: { "/api": apiTarget, "/media": apiTarget },
  },
  preview: {
    port: 4173,
    proxy: { "/api": apiTarget, "/media": apiTarget },
  },
});
