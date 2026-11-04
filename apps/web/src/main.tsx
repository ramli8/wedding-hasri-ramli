import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "./components/kit/toast.js";
import "./lib/pwa.js";
import { router } from "./router.js";
import "./styles.css";

// Setiap simpan yang berhasil memberi tanda singkat "Tersimpan" (lihat Toaster di AppLayout).
// Mutasi boleh mengganti pesannya lewat `meta: { toast: "Terhapus" }` atau mematikannya (`false`).
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
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
