import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookHeart,
  CalendarCheck,
  CalendarDays,
  Gift,
  LogOut,
  MoreHorizontal,
  ScanLine,
  Settings,
  Smartphone,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api.js";
import { meQuery } from "../lib/queries.js";
import { Button } from "./ui/button.js";
import { Dialog } from "./ui/dialog.js";

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

/** Menu yang paling sering dipakai tampil di bilah bawah (HP); sisanya di tombol "Lainnya". */
const PRIMARY = ["/admin/tamu", "/admin/checkin", "/admin/undangan", "/admin/hadiah"] as const;
const primaryItems = PRIMARY.map((to) => navItems.find((item) => item.to === to)).filter(
  (item) => item !== undefined,
);
const moreItems = navItems.filter((item) => !(PRIMARY as readonly string[]).includes(item.to));

// TanStack Router memberi data-status="active" pada tautan yang sedang aktif.
const navLink =
  "flex items-center gap-2 border-2 border-transparent px-2.5 py-2 font-display text-sm font-bold tracking-button whitespace-nowrap uppercase hover:bg-bone-2 data-[status=active]:border-ink data-[status=active]:bg-acid";

const tabBase =
  "flex min-h-14 flex-col items-center justify-center gap-0.5 border-t-4 border-transparent px-1 font-display text-[11px] font-bold tracking-button uppercase";

export function AppLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(meQuery);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const moreActive = moreItems.some((item) => pathname.startsWith(item.to));

  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(meQuery.queryKey, null);
      await navigate({ to: "/admin/masuk" });
    },
  });

  const logoutButton = (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      <LogOut className="size-4" aria-hidden />
      Keluar
    </Button>
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-bone pt-[env(safe-area-inset-top)] print:hidden">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6 xl:h-16">
          <Link
            to="/admin/tamu"
            className="flex items-center gap-3 font-display text-sm font-bold tracking-h3 whitespace-nowrap uppercase"
          >
            <span className="tag grid size-9 place-items-center border-2 border-ink bg-acid">
              H&amp;R
            </span>
            <span>Hasri &amp; Ramli</span>
          </Link>

          <div className="hidden items-center gap-3 xl:flex">
            <span className="tag hidden max-w-40 truncate text-ink-soft 2xl:inline">
              {data?.admin.name}
            </span>
            {logoutButton}
          </div>
        </div>

        {/* Layar lebar: semua menu dalam satu baris yang bisa membungkus. */}
        <nav
          className="mx-auto hidden w-full max-w-7xl flex-wrap items-center gap-1 border-t-2 border-ink px-4 py-1.5 md:px-6 xl:flex"
          aria-label="Menu utama"
        >
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={navLink}>
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 pb-28 md:px-6 md:py-12 xl:pb-12">
        <Outlet />
      </main>

      {/* HP dan tablet: bilah bawah seperti aplikasi. */}
      <nav
        aria-label="Menu utama"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-[3px] border-ink bg-bone pb-[env(safe-area-inset-bottom)] xl:hidden print:hidden"
      >
        {primaryItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`${tabBase} data-[status=active]:border-ink data-[status=active]:bg-acid`}
          >
            <item.icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          className={`${tabBase} ${moreActive ? "border-ink bg-acid" : ""}`}
        >
          <MoreHorizontal className="size-5" aria-hidden />
          Lainnya
        </button>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
        <nav aria-label="Menu lainnya" className="flex flex-col gap-2">
          {moreItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center gap-3 border-2 border-ink bg-paper px-4 font-display font-bold tracking-button uppercase data-[status=active]:bg-acid"
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between gap-3 border-t-2 border-ink pt-4">
          <span className="tag truncate text-ink-soft">{data?.admin.name}</span>
          {logoutButton}
        </div>
      </Dialog>
    </div>
  );
}
