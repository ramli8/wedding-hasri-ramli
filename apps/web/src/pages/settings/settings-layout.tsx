import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { DatabaseBackup, Heart, KeyRound, Link2, Palette } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/pengaturan", title: "Pernikahan", icon: <Heart size={18} /> },
  { href: "/admin/pengaturan/pratinjau", title: "Pratinjau tautan", icon: <Link2 size={18} /> },
  { href: "/admin/pengaturan/sandi", title: "Kata sandi", icon: <KeyRound size={18} /> },
  { href: "/admin/pengaturan/cadangan", title: "Cadangan", icon: <DatabaseBackup size={18} /> },
  { href: "/admin/pengaturan/tampilan", title: "Tampilan", icon: <Palette size={18} /> },
] as const;

/** SidebarNav shadcn-admin: Select di HP, daftar tombol ghost di layar lebar. */
function SidebarNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <div className="p-1 md:hidden">
        <Select value={pathname} onValueChange={(value) => navigate({ to: value as "/admin" })}>
          <SelectTrigger className="h-12 sm:w-48">
            <SelectValue placeholder="Bagian" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <div className="flex gap-x-4 px-2 py-1">
                  <span className="scale-125">{item.icon}</span>
                  <span className="text-md">{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <nav
        aria-label="Bagian pengaturan"
        className="hidden w-full min-w-40 bg-background px-1 py-2 md:flex md:space-x-2 lg:flex-col lg:space-y-1 lg:space-x-0"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              pathname === item.href
                ? "bg-muted hover:bg-accent"
                : "hover:bg-accent hover:underline",
              "justify-start",
            )}
          >
            <span className="me-2">{item.icon}</span>
            {item.title}
          </Link>
        ))}
      </nav>
    </>
  );
}

/** Halaman Settings shadcn-admin: judul, garis, sub-menu di kiri, isi di kanan. */
export function SettingsLayout() {
  return (
    <>
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pengaturan</h1>
        <p className="text-muted-foreground">
          Data dasar pernikahan, akun Anda, dan tampilan panel.
        </p>
      </div>
      <hr className="my-4 lg:my-6" />
      <div className="flex flex-1 flex-col space-y-2 md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
        <aside className="top-0 lg:sticky lg:w-1/5">
          <SidebarNav />
        </aside>
        <div className="flex w-full p-1">
          <Outlet />
        </div>
      </div>
    </>
  );
}

/** ContentSection shadcn-admin: judul bagian, garis, isi maksimal selebar `lg:max-w-xl`. */
export function ContentSection({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-none">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <hr className="my-4 flex-none" />
      <div className="w-full pe-4 pb-12">
        <div className="-mx-1 px-1.5 lg:max-w-xl">{children}</div>
      </div>
    </div>
  );
}
