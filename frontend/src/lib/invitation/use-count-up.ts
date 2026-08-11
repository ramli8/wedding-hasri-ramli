"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./reduced-motion";

type UseCountUpOptions = {
  duration?: number;
  decimals?: number;
  start?: number;
};

export function useCountUp(target: number, options?: UseCountUpOptions) {
  const { duration = 1600, decimals = 0, start = 0 } = options ?? {};
  const reducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(reducedMotion ? target : start);
  const rafRef = useRef<number | null>(null);
  const nodeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      return;
    }

    const el = nodeRef.current;
    if (!el) return;

    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        observer.unobserve(el);

        const startTime = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(start + (target - start) * eased);
          if (progress < 1) {
            rafRef.current = requestAnimationFrame(step);
          } else {
            setValue(target);
          }
        };
        rafRef.current = requestAnimationFrame(step);
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, start, reducedMotion]);

  const factor = Math.pow(10, decimals);
  const display = (Math.round(value * factor) / factor).toFixed(decimals);

  return { ref: nodeRef, value: display };
}
