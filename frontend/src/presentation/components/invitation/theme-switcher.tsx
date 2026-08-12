"use client";

import { Moon, Sun } from "lucide-react";
import { useInvitationTheme } from "@/src/lib/invitation/invitation-theme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useInvitationTheme();
  const isIvory = theme === "ivory";

  return (
    <div
      role="group"
      aria-label="Pilih tema undangan"
      className="fixed right-5 top-5 z-50 flex items-center rounded-full border border-[var(--inv-hairline)] bg-[var(--inv-surface)]/70 p-1 shadow-lg backdrop-blur"
    >
      <span
        aria-hidden
        className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[var(--inv-accent)] transition-transform duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isIvory ? "translate-x-0" : "translate-x-full"
        }`}
      />
      <button
        type="button"
        role="radio"
        aria-checked={isIvory}
        aria-label="Tema terang"
        onClick={() => setTheme("ivory")}
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          isIvory
            ? "text-[var(--inv-bg)]"
            : "text-[var(--inv-muted)] hover:text-[var(--inv-accent)]"
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!isIvory}
        aria-label="Tema gelap"
        onClick={() => setTheme("moody")}
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          isIvory
            ? "text-[var(--inv-muted)] hover:text-[var(--inv-accent)]"
            : "text-[var(--inv-bg)]"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
