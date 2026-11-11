import "./lib/zod-config.js";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "./components/kit/toast.js";
import { ApiError } from "./lib/api.js";
import { meQuery } from "./lib/queries.js";
import "./lib/pwa.js";
import { router } from "./router.js";
import "./styles.css";

/**
 * Sesi admin habis atau dicabut (mis. kata sandi diganti di perangkat lain): kembali ke halaman
 * masuk. Tanpa ini `me` yang tersimpan di cache membuat halaman admin tetap terbuka dan setiap
 * permintaan hanya menampilkan galat 401. Salah sandi saat masuk (INVALID_CREDENTIALS) bukan sesi habis.
 */
function onUnauthenticated(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 401) return;
  if (error.code === "INVALID_CREDENTIALS") return;
  const path = window.location.pathname;
  if (!path.startsWith("/admin") || path === "/admin/masuk") return;
  queryClient.setQueryData(meQuery.queryKey, null);
  void router.navigate({ to: "/admin/masuk" });
}

// Setiap simpan yang berhasil memberi tanda singkat "Tersimpan" (lihat Toaster di AppLayout).
// Mutasi boleh mengganti pesannya lewat `meta: { toast: "Terhapus" }` atau mematikannya (`false`).
const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Galat 4xx (tidak ditemukan, sesi habis, data tidak valid) tidak akan sembuh dengan mengulang.
      retry: (failures, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failures < 3,
    },
  },
  queryCache: new QueryCache({ onError: onUnauthenticated }),
  mutationCache: new MutationCache({
    onError: onUnauthenticated,
    onSuccess: (_data, _variables, _context, mutation) => {
      const message = mutation.meta?.toast;
      if (message === false) return;
      toast(typeof message === "string" ? message : "Tersimpan");
    },
  }),
});

const root = document.getElementById("root");
if (!root) throw new Error("elemen #root tidak ditemukan");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient }} />
    </QueryClientProvider>
  </StrictMode>,
);
