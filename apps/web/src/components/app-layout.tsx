import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { api } from "../lib/api.js";
import { meQuery } from "../lib/queries.js";
import { Button } from "./ui/button.js";

const navItems = [
  { to: "/admin/tamu", label: "Tamu" },
  { to: "/admin/kelompok", label: "Kelompok" },
  { to: "/admin/acara", label: "Acara" },
  { to: "/admin/pengaturan", label: "Pengaturan" },
] as const;

export function AppLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(meQuery);

  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(meQuery.queryKey, null);
      await navigate({ to: "/admin/masuk" });
    },
  });

  return (
    <div className="min-h-dvh md:flex">
      <aside className="flex flex-col gap-3 bg-surface-alt px-4 py-3 md:sticky md:top-0 md:h-dvh md:w-56 md:shrink-0 md:gap-6 md:py-6">
        <p className="text-body-lg font-semibold">Hasri &amp; Ramli</p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-2xl px-3 py-2 text-body whitespace-nowrap text-ink-soft hover:bg-canvas"
              activeProps={{ className: "bg-canvas font-semibold text-ink" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between gap-2 md:mt-auto md:flex-col md:items-stretch">
          <p className="truncate text-caption text-mid-gray">{data?.admin.name}</p>
          <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
            Keluar
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
