"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import { usePrefersReducedMotion } from "./reduced-motion";

type MagneticProps = {
  children: ReactNode;
  strength?: number;
  maxPull?: number;
  detectRadius?: number;
  className?: string;
};

export function Magnetic({
  children,
  strength = 0.25,
  maxPull = 12,
  detectRadius = 72,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pulled, setPulled] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const triggerDistance = Math.hypot(rect.width, rect.height) / 2 + detectRadius;

    if (Math.hypot(dx, dy) > triggerDistance) {
      if (pulled) {
        setPulled(false);
        ref.current.style.transform = "";
      }
      return;
    }

    const clamp = (value: number) =>
      Math.max(-maxPull, Math.min(maxPull, value));

    setPulled(true);
    ref.current.style.transform = `translate(${clamp(dx * strength)}px, ${clamp(dy * strength)}px)`;
  };

  const onLeave = () => {
    if (!ref.current) return;
    setPulled(false);
    ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "inline-block will-change-transform",
        pulled
          ? "transition-transform duration-150 ease-out"
          : "transition-transform duration-500 ease-[cubic-bezier(0.34,1.45,0.64,1)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
