/** Versi aplikasi yang dilaporkan ke server dan ditampilkan di scanner (diisi saat build). */
export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "dev";
