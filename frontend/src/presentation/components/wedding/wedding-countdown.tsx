"use client";

import { useEffect, useMemo, useState } from "react";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function diffToParts(target: Date): CountdownParts {
  const ms = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function WeddingCountdown() {
  const { data } = useInvitation();
  const target = data?.countdown_target ?? null;

  const targetDate = useMemo(() => {
    if (!target) return null;
    const date = new Date(target);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [target]);

  const [parts, setParts] = useState<CountdownParts | null>(() =>
    targetDate ? diffToParts(targetDate) : null,
  );

  useEffect(() => {
    if (!targetDate) return;
    setParts(diffToParts(targetDate));
    const interval = window.setInterval(() => setParts(diffToParts(targetDate)), 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  if (!parts) return null;

  const items = [
    { value: pad(parts.days), label: "Hari" },
    { value: pad(parts.hours), label: "Jam" },
    { value: pad(parts.minutes), label: "Menit" },
    { value: pad(parts.seconds), label: "Detik", ticking: true },
  ];

  return (
    <section id="countdown" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            Detik demi Detik
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Menuju Hari Bahagia</h2>
        </WeddingReveal>

        <WeddingReveal delay={100} className="w-full md:max-w-[38rem]">
          <div
            className="mx-auto grid w-full grid-cols-4 gap-2 sm:gap-3"
            role="timer"
            aria-live="off"
          >
            {items.map((item) => (
              <div
                key={item.label}
                className="wd-glass flex flex-col items-center justify-center gap-1.5 px-1 py-5 sm:py-6 md:py-8"
              >
                <span
                  key={item.value}
                  className={
                    item.ticking
                      ? "wd-display wd-tick text-[1.75rem] tabular-nums text-[var(--wd-accent)] sm:text-[2.25rem] md:text-[3rem]"
                      : "wd-display text-[1.75rem] tabular-nums text-[var(--wd-accent)] sm:text-[2.25rem] md:text-[3rem]"
                  }
                  aria-hidden
                >
                  {item.value}
                </span>
                <span className="wd-label">{item.label}</span>
              </div>
            ))}
          </div>
        </WeddingReveal>
      </div>
    </section>
  );
}
