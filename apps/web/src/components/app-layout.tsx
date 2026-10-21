import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BookHeart,
  CalendarCheck,
  CalendarDays,
  Gift,
  LogOut,
  Menu,
  ScanLine,
  Settings,
  Smartphone,
  Store,
  Tags,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api.js";
import { meQuery } from "../lib/queries.js";
import { Button } from "./ui/button.js";

const navItems = [
  { to: "/admin/tamu", label: "Tamu", icon: Users },
  { to: "/admin/kelompok", label: "Kelompok", icon: Tags },
  { to: "/admin/acara", label: "Acara", icon: CalendarDays },
  { to: "/admin/rsvp", label: "RSVP", icon: CalendarCheck },
  { to: "/admin/undangan", label: "Undangan", icon: BookHeart },
  { to: "/admin/hadiah", label: "Hadiah", icon: Gift },
  { to: "/admin/vendor", label: "Vendor", icon: Store },
  { to: "/admin/checkin", label: "Check-in", icon: ScanLine },
  { to: "/admin/perangkat", label: "Perangkat", icon: Smartphone },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

// TanStack Router memberi data-status="active" pada tautan yang sedang aktif.
const navLink =
  "flex items-center gap-2 border-2 border-transparent px-2.5 py-2 font-display text-sm font-bold tracking-button whitespace-nowrap uppercase hover:bg-bone-2 data-[status=active]:border-ink data-[status=active]:bg-acid";

export function AppLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(meQuery);
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(meQuery.queryKey, null);
      await navigate({ to: "/admin/masuk" });
    },
  });

  const links = navItems.map((item) => (
    <Link key={item.to} to={item.to} className={navLink} onClick={() => setMenuOpen(false)}>
      <item.icon className="size-4" aria-hidden />
      {item.label}
    </Link>
  ));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-bone print:hidden">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <Link
            to="/admin/tamu"
            className="flex items-center gap-3 font-display text-sm font-bold tracking-h3 whitespace-nowrap uppercase"
          >
            <span className="tag grid size-9 place-items-center border-2 border-ink bg-acid">
              H&amp;R
            </span>
            <span className="hidden sm:inline">Hasri &amp; Ramli</span>
          </Link>

          <div className="hidden items-center gap-3 xl:flex">
            <span className="tag hidden max-w-40 truncate text-ink-soft 2xl:inline">
              {data?.admin.name}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" aria-hidden />
              Keluar
            </Button>
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center border-2 border-ink bg-paper shadow-hard-sm xl:hidden"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>

        <nav
          className="mx-auto hidden w-full max-w-7xl flex-wrap items-center gap-1 border-t-2 border-ink px-4 py-1.5 md:px-6 xl:flex"
          aria-label="Menu utama"
        >
          {links}
        </nav>

        {menuOpen && (
          <div id="menu-mobile" className="border-t-2 border-ink bg-paper px-4 py-3 xl:hidden">
            <nav className="flex flex-col gap-1" aria-label="Menu utama">
              {links}
            </nav>
            <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-ink pt-3">
              <span className="tag truncate text-ink-soft">{data?.admin.name}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="size-4" aria-hidden />
                Keluar
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
        <Outlet />
      </main>
    </div>
  );
}
