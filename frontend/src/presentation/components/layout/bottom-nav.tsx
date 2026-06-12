"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, ScanQrCode, Menu } from "lucide-react";
import { cn } from "@/src/lib/utils";

const bottomNavItems = [
  {
    label: "Beranda",
    href: "/admin",
    icon: Home,
  },
  {
    label: "Tamu",
    href: "/admin/guests",
    icon: Users,
  },
  {
    label: "Scan QR",
    href: "/admin/guest-checkin",
    icon: ScanQrCode,
  },
  {
    label: "Menu",
    href: "/admin/menu",
    icon: Menu,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 bg-background border-t border-border pb-safe">
      <div className="flex w-full justify-around items-center px-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
