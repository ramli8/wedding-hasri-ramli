import { z } from "zod";

// Zod mencoba `new Function` untuk mempercepat validasi. CSP situs ini (deploy/web.Caddyfile)
// melarang eval, jadi percobaan itu hanya menghasilkan pelanggaran CSP lalu jatuh ke cara biasa.
// Dimatikan sejak awal; diimpor paling atas di main.tsx sebelum skema apa pun dipakai.
z.config({ jitless: true });
