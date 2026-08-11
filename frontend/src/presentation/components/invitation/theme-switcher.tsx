"use client";

import { Moon, Sun } from "lucide-react";
import { useInvitationTheme } from "@/src/lib/invitation/invitation-theme";

export function ThemeSwitcher() {
  const { theme, toggle } = useInvitationTheme();
  const isIvory = theme === "ivory";

  return (
    <button
      onClick={toggle}
      aria-label={isIvory ? "Ganti ke tema gelap" : "Ganti ke tema terang"}
      title={isIvory ? "Tema gelap" : "Tema terang"}
      className="fixed right-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--inv-hairline)] bg-[var(--inv-surface)]/70 text-[var(--inv-accent)] shadow-lg backdrop-blur transition-all hover:bg-[var(--inv-surface)] active:scale-90"
    >
      {isIvory ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
