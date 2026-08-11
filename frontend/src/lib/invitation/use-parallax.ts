"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./reduced-motion";

type UseParallaxOptions = {
  factor?: number;
  offset?: number;
};

export function useParallax<T extends HTMLElement = HTMLElement>(
  options?: UseParallaxOptions,
) {
  const { factor = 0.08, offset = 0 } = options ?? {};
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let rafId: number | null = null;

    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const distance = (elementCenter - viewportCenter) * factor;

      if (rect.bottom < -offset || rect.top > window.innerHeight + offset) {
        ref.current.style.transform = "";
      } else {
        ref.current.style.transform = `translate3d(0, ${distance.toFixed(1)}px, 0)`;
      }
    };

    const onScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [factor, offset]);

  return ref;
}
