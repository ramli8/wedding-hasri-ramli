"use client";

import type { CSSProperties, ReactNode } from "react";
import { useScrollReveal } from "./use-scroll-reveal";
import { cn } from "@/src/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
};

export function Reveal({ children, className, delay = 0, style }: RevealProps) {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn("inv-reveal", className)}
      style={{
        ...(delay ? { transitionDelay: `${delay}ms` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
