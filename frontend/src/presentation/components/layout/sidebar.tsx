"use client";

import {
  X,
  Gauge,
  Tags,
  Contact,
  UserRound,
  Users,
  ShieldCheck,
  Key,
  ScanQrCode,
  ScanFace,
  NotebookTabs,
  Heart,
  Store,
} from "lucide-react";
import { SidebarItem, SidebarMenuItem } from "./sidebar-item";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/presentation/components/ui/button";
import { ThemeToggle } from "@/src/presentation/components/theme-toggle";

import Image from "next/image";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: SidebarMenuItem[] = [
  {
    label: "Beranda",
    href: "/home",
    icon: Gauge,
  },
  {
    label: "Tamu Digital",
    icon: NotebookTabs,
    anyRole: ["Super Admin", "Admin"],
    children: [
      {
        label: "Check-In",
        href: "/admin/guest-checkin",
        icon: ScanQrCode,
        permission: "guests.check_in",
      },
      {
        label: "Check-In Manual",
        href: "/admin/guest-checkin-bypass",
        icon: ScanFace,
        permission: "guests.bypass_checkin",
      },
      {
        label: "Daftar Tamu",
        href: "/admin/guests",
        icon: UserRound,
        permission: "guests.read",
      },
      {
        label: "Kategori",
        href: "/admin/guest-categories",
        icon: Tags,
        permission: "guest_categories.read",
      },
    ],
  },
  {
    label: "Perencanaan",
    icon: Heart,
    anyRole: ["Super Admin", "Admin"],
    children: [
      {
        label: "Vendor",
        href: "/admin/vendors",
        icon: Store,
      },
    ],
  },
  {
    label: "Hak Akses",
    icon: Users,
    anyRole: ["Super Admin", "Admin"],
    children: [
      {
        label: "Pengguna",
        href: "/admin/users",
        icon: Users,
        permission: "users.read",
      },
      {
        label: "Peran",
        href: "/admin/roles",
        icon: ShieldCheck,
        permission: "roles.read",
      },
      {
        label: "Izin",
        href: "/admin/permissions",
        icon: Key,
        permission: "permissions.read",
      },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile/tablet */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-border bg-sidebar transition-transform duration-300 ease-in-out",
          // Mobile: slide in from left
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar Header — Brand area */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <Image
              src="/gns.png"
              alt="GNS"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg brightness-0 dark:invert"
            />
            <span className="text-xl font-bold text-sidebar-foreground">
              Wedding App
            </span>
          </div>

          {/* Close button (mobile/tablet only) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="flex justify-center mb-4 mt-2">
            <ThemeToggle />
          </div>
          {menuItems.map((item, index) => (
            <SidebarItem key={index} item={item} onNavigate={onClose} />
          ))}
        </nav>
      </aside>
    </>
  );
}
