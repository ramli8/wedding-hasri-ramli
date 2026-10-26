import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  test: {
    environment: "jsdom",
    // IndexedDB tiruan untuk Dexie; reset tiap berkas lewat resetDevice() di setiap tes.
    setupFiles: ["fake-indexeddb/auto"],
    include: ["src/**/*.test.ts"],
  },
});
