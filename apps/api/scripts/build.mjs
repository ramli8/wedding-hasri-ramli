import { build } from "esbuild";

// Bundel semua kode (termasuk @wedding/shared); hanya modul native yang dibiarkan eksternal.
// create-admin ikut dibundel agar admin pertama bisa dibuat di dalam container produksi.
await build({
  entryPoints: {
    index: "src/index.ts",
    "create-admin": "src/cli/create-admin.ts",
  },
  outdir: "dist",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  sourcemap: true,
  external: ["@node-rs/argon2", "sharp", "pino-pretty"],
  // beberapa dependensi (pino) masih memakai require() di dalam bundel ESM
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
});
