import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./test/global-setup.ts"],
    // semua file memakai satu database tes, jadi dijalankan berurutan
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
