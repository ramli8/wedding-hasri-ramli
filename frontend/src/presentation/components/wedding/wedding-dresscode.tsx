"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";
import { cn } from "@/src/lib/utils";

function isValidHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

function prefersLightInk(hex: string): boolean {
  const value = hex.slice(1);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return 0.299 * red + 0.587 * green + 0.114 * blue < 140;
}

export function WeddingDresscode() {
  const { data } = useInvitation();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  if (!data) return null;

  const dressCode = data.wedding.content.dress_code;
  if (!dressCode.description && dressCode.color_palette.length === 0) return null;

  const handleCopy = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color.toUpperCase());
      haptic(8);
      setCopiedColor(color);
      toast.success(`Warna ${color.toUpperCase()} tersalin`);
      window.setTimeout(
        () => setCopiedColor((prev) => (prev === color ? null : prev)),
        2000,
      );
    } catch {
      toast.error("Gagal menyalin warna.");
    }
  };

  return (
    <section id="dresscode" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            Busana Tamu
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Dress Code</h2>
          {dressCode.description ? (
            <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[30rem]">
              {dressCode.description}
            </p>
          ) : null}
        </WeddingReveal>

        {dressCode.color_palette.length > 0 ? (
          <WeddingReveal delay={80}>
            <div
              className="flex max-w-md flex-wrap items-start justify-center gap-x-5 gap-y-6"
              aria-label="Palet warna dress code"
            >
              {dressCode.color_palette.map((color, index) => {
                const valid = isValidHex(color);
                const copied = copiedColor === color;
                return (
                  <WeddingReveal key={color} delay={index * 45}>
                    <button
                      type="button"
                      aria-label={`Salin warna ${color.toUpperCase()}`}
                      onClick={() => handleCopy(color)}
                      className="group flex flex-col items-center gap-2 transition-transform duration-200 active:scale-95"
                    >
                      <span
                        aria-hidden
                        style={{ backgroundColor: color }}
                        className="relative block h-14 w-14 rounded-full border border-[var(--wd-line-strong)] transition-shadow duration-300 group-hover:shadow-[0_0_0_3px_var(--wd-accent-soft)] md:h-16 md:w-16"
                      >
                        {copied ? (
                          <Check
                            className={cn(
                              "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2",
                              valid && prefersLightInk(color)
                                ? "text-white"
                                : "text-[#141413]",
                            )}
                          />
                        ) : null}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-[var(--wd-muted)] md:text-[10px]">
                        {valid ? color.replace("#", "") : "—"}
                      </span>
                    </button>
                  </WeddingReveal>
                );
              })}
            </div>
            <p className="wd-label mt-5">Ketuk warna untuk menyalin kode</p>
          </WeddingReveal>
        ) : null}

        {dressCode.image_url ? (
          <WeddingReveal delay={150} className="group w-full md:max-w-[28rem]">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] bg-[var(--wd-card)]">
              <Image
                src={dressCode.image_url}
                alt="Referensi dress code"
                fill
                sizes="(min-width: 768px) 28rem, 100vw"
                className="wd-photo-live object-cover"
              />
            </div>
          </WeddingReveal>
        ) : null}
      </div>
    </section>
  );
}
