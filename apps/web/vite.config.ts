import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Origin dibiarkan apa adanya (http://localhost:5173) agar lolos pemeriksaan Origin di API.
    proxy: { "/api": "http://localhost:3000" },
  },
});
