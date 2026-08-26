"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface CheckInModeTab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: CheckInModeTab[] = [
  { href: "/admin/guest-checkin", label: "Scan QR", icon: ScanLine },
  { href: "/admin/guest-checkin-bypass", label: "Manual", icon: Search },
];

export function CheckInModeTabs({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex rounded-2xl bg-muted/60 p-1.5", className)}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold transition-all active:scale-95",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
