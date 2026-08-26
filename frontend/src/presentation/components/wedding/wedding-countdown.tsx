"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
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

  const timeUnits = [
    { value: pad(parts.hours), label: "Jam", ticking: false },
    { value: pad(parts.minutes), label: "Menit", ticking: false },
    { value: pad(parts.seconds), label: "Detik", ticking: true },
  ];

  const dateLabel = data?.wedding.wedding_date
    ? format(new Date(data.wedding.wedding_date), "d MMMM yyyy", { locale: localeId })
    : null;

  return (
    <section id="countdown" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-9 text-center">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Menuju Hari Besar</h2>
        </WeddingReveal>

        <WeddingReveal delay={100} className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center" role="timer" aria-live="off">
            <span
              key={parts.days}
              aria-hidden
              style={{ minWidth: `${String(parts.days).length}ch` }}
              className="wd-year-hollow inline-grid place-items-center text-[clamp(7rem,26vw,12rem)] leading-[0.85]"
            >
              {parts.days}
            </span>
            <p className="wd-label mt-3">Hari Lagi</p>
          </div>

          <div className="flex items-start justify-center gap-3 sm:gap-4">
            {timeUnits.map((unit, index) => (
              <div key={unit.label} className="contents">
                {index > 0 ? (
                  <span
                    aria-hidden
                    className="wd-display wd-blink pt-0.5 text-[1.5rem] leading-none text-[var(--wd-muted)]/50 sm:text-[1.75rem]"
                  >
                    :
                  </span>
                ) : null}
                <div className="flex w-14 flex-col items-center gap-1 sm:w-16">
                  <span
                    key={unit.value}
                    className={
                      unit.ticking
                        ? "wd-display wd-tick text-[1.75rem] tabular-nums text-[var(--wd-ink)]/85 sm:text-[2rem]"
                        : "wd-display text-[1.75rem] tabular-nums text-[var(--wd-ink)]/85 sm:text-[2rem]"
                    }
                  >
                    {unit.value}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--wd-muted)]">
                    {unit.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {dateLabel ? (
            <div className="flex items-center justify-center gap-4">
              <span className="h-px w-10 bg-[var(--wd-line)]" aria-hidden />
              <p className="wd-label">{dateLabel}</p>
              <span className="h-px w-10 bg-[var(--wd-line)]" aria-hidden />
            </div>
          ) : null}
        </WeddingReveal>
      </div>
    </section>
  );
}
