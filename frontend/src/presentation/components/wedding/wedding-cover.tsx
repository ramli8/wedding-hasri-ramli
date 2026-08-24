"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { useWeddingInvitation } from "@/src/lib/invitation/wedding-context";
import { prefersReducedMotion } from "@/src/lib/invitation/reduced-motion";
import { haptic } from "@/src/lib/invitation/haptics";
import { cn } from "@/src/lib/utils";

function splitDateParts(iso: string | null): { day: string; month: string; year: string } {
  if (!iso) return { day: "--", month: "--", year: "--" };
  const [datePart] = iso.split("T");
  const segments = datePart?.split("-") ?? [];
  if (segments.length < 3) return { day: "--", month: "--", year: "--" };
  const [, month, day] = segments;
  return { day, month, year: segments[0].slice(-2) };
}

function formatDateLabel(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "EEEE, d MMMM yyyy", { locale: localeId });
}

export function WeddingCover() {
  const { data } = useInvitation();
  const { opened, open } = useWeddingInvitation();
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach((t) => window.clearTimeout(t));
  }, []);

  if (!data || opened || hidden) return null;

  const { wedding, guest } = data;
  const photos = wedding.content.cover.photos;
  const { day, month, year } = splitDateParts(wedding.wedding_date);
  const dateLabel = formatDateLabel(wedding.wedding_date);
  const mainEvent = data.events.find((event) => event.is_main_event) ?? data.events[0];
  const venueName = mainEvent?.venue_name ?? null;

  const handleOpen = () => {
    if (exiting) return;
    haptic(12);

    if (prefersReducedMotion()) {
      open();
      setHidden(true);
      return;
    }

    setExiting(true);
    timeoutsRef.current.push(
      window.setTimeout(() => {
        open();
        setHidden(true);
      }, 900),
    );
  };

  return (
    <section
      aria-label="Cover undangan"
      className={cn(
        "fixed inset-0 z-40 overflow-hidden bg-[var(--wd-bg)] text-[var(--wd-ink)]",
        exiting && "wd-cover-exit",
      )}
    >
      <div className="relative flex min-h-dvh flex-col">
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {photos[0] ? (
            <picture>
              <source media="(min-width:1024px)" srcSet={photos[2] ?? photos[0]} />
              <source media="(min-width:640px)" srcSet={photos[1] ?? photos[0]} />
              <img
                src={photos[0]}
                alt="Foto prewedding Hasri & Ramli"
                fetchPriority="high"
                decoding="async"
                className="wd-kenburns absolute inset-0 h-full w-full object-cover"
              />
            </picture>
          ) : (
            <div className="h-full w-full bg-[var(--wd-surface)]" />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        <div className="relative z-10 flex min-h-dvh flex-col px-6 pb-16 pt-12 text-center md:px-12 lg:pb-8">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div
              className="wd-display text-[clamp(2.75rem,13dvh,9rem)] leading-[0.85] text-white lg:text-[clamp(5rem,14dvh,9.5rem)]"
              aria-label={wedding.wedding_date ?? ""}
            >
              {[
                { value: day, delay: 150 },
                { value: month, delay: 300 },
                { value: year, delay: 450 },
              ].map((part, index) => (
                <span
                  key={`${part.value}-${index}`}
                  className="wd-rise block"
                  style={{ "--rise-delay": `${part.delay}ms` } as CSSProperties}
                >
                  {part.value}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[64rem]">
            <div className="flex flex-col items-center gap-1.5">
              <p className="wd-display text-[2.25rem] leading-none text-white md:text-[3rem] lg:text-[3.5rem]">
                {wedding.bride_name}
              </p>
              <span
                className="wd-script text-[1.75rem] leading-none text-white/85 md:text-[2rem] lg:text-[2.25rem]"
                aria-hidden
              >
                &amp;
              </span>
              <p className="wd-display text-[2.25rem] leading-none text-white md:text-[3rem] lg:text-[3.5rem]">
                {wedding.groom_name}
              </p>
              <div className="mt-4 flex flex-col items-center gap-0.5 text-center">
                {dateLabel ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 md:text-[12px]">
                    {dateLabel}
                  </p>
                ) : null}
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  {venueName ?? "Save The Date"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-4">
              <p className="text-[12px] tracking-wide text-white/70">
                Kepada Yth.{" "}
                <span className="font-semibold text-white">
                  {guest?.name ?? "Bapak/Ibu/Saudara/i"}
                </span>
              </p>
              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[var(--wd-accent)] px-8 text-[13px] font-bold tracking-wide text-[#141413] shadow-lg shadow-black/30 transition-all duration-200 active:scale-[0.97]"
              >
                {wedding.content.cover.button_text}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          className="wd-scroll-hint absolute inset-x-0 bottom-3 z-10 flex flex-col items-center gap-1 text-white/60 [@media(max-height:620px)]:hidden"
          aria-hidden
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.32em]">
            Scroll
          </span>
          <ChevronDown className="h-3.5 w-3.5" />
        </div>
      </div>
    </section>
  );
}
