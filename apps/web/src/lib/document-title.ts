import { queryOptions, useQuery } from "@tanstack/react-query";
import { DEFAULT_SITE_NAME } from "@wedding/shared";
import { useEffect } from "react";
import { navGroups } from "@/components/layout/sidebar-data";
import { publicApi } from "./public-api.js";

/** Nama situs dari Pengaturan → Situs (tanpa login, jadi juga untuk scanner dan halaman tamu). */
export const siteNameQuery = queryOptions({
  queryKey: ["site"],
  queryFn: async () => (await publicApi.site()).name,
  staleTime: 5 * 60_000,
});

/** Judul tab peramban "Halaman · Nama situs", agar tab yang banyak terbuka mudah dibedakan. */
export function useDocumentTitle(title: string | null | undefined) {
  const site = useQuery(siteNameQuery).data ?? DEFAULT_SITE_NAME;
  useEffect(() => {
    document.title = title ? `${title} · ${site}` : site;
  }, [title, site]);
}

const adminPages = navGroups
  .flatMap((group) => group.items)
  .flatMap((item) =>
    "items" in item && item.items
      ? item.items.map((sub) => ({ url: sub.url, title: sub.title }))
      : "url" in item
        ? [{ url: item.url, title: item.title }]
        : [],
  )
  // Alamat terpanjang dulu: /admin/pengaturan/akun cocok sebelum /admin/pengaturan.
  .sort((a, b) => b.url.length - a.url.length);

/** Nama menu admin untuk alamat ini (cocok persis atau sebagai awalan), dari sidebar-data. */
export function adminPageTitle(pathname: string): string | null {
  const page = adminPages.find(
    (p) => pathname === p.url || (p.url !== "/admin" && pathname.startsWith(`${p.url}/`)),
  );
  return page?.title ?? null;
}
