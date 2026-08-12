"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/src/lib/utils";

export type InvitationTheme = "ivory" | "moody";

type InvitationThemeContextValue = {
  theme: InvitationTheme;
  setTheme: (theme: InvitationTheme) => void;
  toggle: () => void;
};

const InvitationThemeContext = createContext<
  InvitationThemeContextValue | undefined
>(undefined);

const THEME_STORAGE_KEY = "inv-theme";

type InvitationThemeProviderProps = {
  children: ReactNode;
  fontClassName?: string;
};

export function InvitationThemeProvider({
  children,
  fontClassName,
}: InvitationThemeProviderProps) {
  const [theme, setTheme] = useState<InvitationTheme>("moody");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "ivory" || saved === "moody") {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () =>
    setTheme((current) => (current === "ivory" ? "moody" : "ivory"));

  return (
    <InvitationThemeContext.Provider value={{ theme, setTheme, toggle }}>
      <div
        className={cn(
          "invitation theme-" + theme,
          "min-h-dvh bg-[var(--inv-bg)] text-[var(--inv-accent)] antialiased",
          fontClassName,
        )}
      >
        {children}
      </div>
    </InvitationThemeContext.Provider>
  );
}

export function useInvitationTheme(): InvitationThemeContextValue {
  const context = useContext(InvitationThemeContext);
  if (!context) {
    throw new Error(
      "useInvitationTheme must be used within InvitationThemeProvider",
    );
  }
  return context;
}
