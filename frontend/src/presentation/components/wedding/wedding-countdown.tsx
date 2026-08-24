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
            counting down
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Menuju Hari Bahagia</h2>
        </WeddingReveal>

        <WeddingReveal delay={100} className="w-full md:max-w-[42rem]">
          <div
            className="mx-auto flex w-fit items-stretch justify-center"
            role="timer"
            aria-live="off"
          >
            {items.map((item, index) => (
              <div key={item.label} className="flex items-stretch">
                {index > 0 ? (
                  <span aria-hidden className="w-px self-stretch bg-[var(--wd-line)]" />
                ) : null}
                <div className="flex flex-col items-center gap-1.5 px-2.5 py-2 sm:px-5 sm:py-3 md:px-7">
                  <span
                    key={item.value}
                    className={
                      item.ticking
                        ? "wd-display wd-tick text-[1.6rem] tabular-nums sm:text-[2.25rem] md:text-[3.25rem]"
                        : "wd-display text-[1.6rem] tabular-nums sm:text-[2.25rem] md:text-[3.25rem]"
                    }
                    aria-hidden
                  >
                    {item.value}
                  </span>
                  <span className="wd-label">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </WeddingReveal>
      </div>
    </section>
  );
}
