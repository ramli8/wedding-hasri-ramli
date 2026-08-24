"use client";

import type { CSSProperties, ReactNode } from "react";
import { useScrollReveal } from "@/src/lib/invitation/use-scroll-reveal";
import { useWeddingInvitation } from "@/src/lib/invitation/wedding-context";
import { cn } from "@/src/lib/utils";

interface WeddingRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}

export function WeddingReveal({ children, className, delay = 0, style }: WeddingRevealProps) {
  const { opened } = useWeddingInvitation() ?? { opened: true };
  // Reveal ditahan selama cover menutupi layar supaya konten mengalir
  // sebagai kaskade tepat saat undangan dibuka.
  const ref = useScrollReveal<HTMLDivElement>({ enabled: opened });

  return (
    <div
      ref={ref}
      className={cn("wd-reveal", className)}
      style={{
        ...(delay ? { transitionDelay: `${delay}ms` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
