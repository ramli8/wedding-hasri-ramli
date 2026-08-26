"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
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
  // Baca lewat getter lokal (bukan potong ISO UTC) agar tanggal sesuai zona pengguna.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "--", month: "--", year: "--" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    day: pad(d.getDate()),
    month: pad(d.getMonth() + 1),
    year: String(d.getFullYear()).slice(-2),
  };
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

  if (!data || hidden || (opened && !exiting)) return null;

  const { wedding, guest } = data;
  const cover = wedding.content.cover;
  const { image_desktop, image_tablet, image_mobile } = cover;
  // Fallback berantai: slot kosong memakai gambar perangkat lain yang tersedia.
  // next/image yang memilih resolusi optimal per viewport (srcset otomatis).
  const coverSrc = image_mobile || image_tablet || image_desktop || "";
  const { day, month, year } = splitDateParts(wedding.wedding_date);
  const dateLabel = formatDateLabel(wedding.wedding_date);
  // Baris kecil di bawah tanggal & sapaan: dikosongkan admin → tidak dirender.
  const saveTheDateLabel = cover.save_the_date_label || "";
  const guestGreetingLabel = cover.guest_greeting_label || "";
  // Nama panggilan untuk tampilan besar; fallback ke nama lengkap.
  const groomDisplay =
    data.couples.find((c) => c.side === "pria")?.nickname || wedding.groom_name;
  const brideDisplay =
    data.couples.find((c) => c.side === "wanita")?.nickname || wedding.bride_name;

  const handleOpen = () => {
    if (exiting) return;
    haptic(12);

    if (prefersReducedMotion()) {
      open();
      setHidden(true);
      return;
    }

    setExiting(true);
    // Koreografi: konten (reveal) menyala saat cover masih meluncur —
    // elemen ayat ikut bangun tepat ketika tepi bawah cover melewatinya.
    timeoutsRef.current.push(window.setTimeout(() => open(), 380));
    timeoutsRef.current.push(
      window.setTimeout(() => setHidden(true), 930),
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
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt="Foto prewedding Hasri & Ramli"
              fill
              priority
              sizes="100vw"
              className="wd-kenburns object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[var(--wd-surface)]" />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        <div className="relative z-10 flex min-h-dvh flex-col px-6 pb-12 pt-12 text-center md:px-12">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {dateLabel ? <p className="sr-only">{dateLabel}</p> : null}
            <div aria-hidden className="wd-display text-[clamp(2.75rem,13dvh,9rem)] leading-[0.85] text-white lg:text-[clamp(5rem,14dvh,9.5rem)]">
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
                {brideDisplay}
              </p>
              <span
                className="wd-script text-[1.75rem] leading-none text-white/85 md:text-[2rem] lg:text-[2.25rem]"
                aria-hidden
              >
                &amp;
              </span>
              <p className="wd-display text-[2.25rem] leading-none text-white md:text-[3rem] lg:text-[3.5rem]">
                {groomDisplay}
              </p>
              <div className="mt-4 flex flex-col items-center gap-0.5 text-center">
                {dateLabel ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 md:text-[12px]">
                    {dateLabel}
                  </p>
                ) : null}
                {saveTheDateLabel ? (
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                    {saveTheDateLabel}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              {guest?.name ? (
                <p className="text-[12px] tracking-wide text-white/70">
                  {guestGreetingLabel ? `${guestGreetingLabel} ` : ""}
                  <span className="font-semibold text-white">{guest.name}</span>
                </p>
              ) : null}
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
      </div>
    </section>
  );
}
