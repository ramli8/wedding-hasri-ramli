"use client";

import Image from "next/image";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";

export function WeddingDresscode() {
  const { data } = useInvitation();
  if (!data) return null;

  const dressCode = data.wedding.content.dress_code;
  if (!dressCode.description && dressCode.color_palette.length === 0) return null;

  return (
    <section id="dresscode" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Dress Code</h2>
          {dressCode.description ? (
            <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[30rem]">
              {dressCode.description}
            </p>
          ) : null}
        </WeddingReveal>

        {dressCode.color_palette.length > 0 ? (
          <WeddingReveal delay={100}>
            <div className="flex items-center justify-center gap-3 md:gap-4">
              {dressCode.color_palette.map((color) => (
                <div key={color} className="flex flex-col items-center gap-2">
                  <span
                    aria-hidden
                    className="block h-12 w-12 rounded-full border border-[var(--wd-line-strong)] md:h-14 md:w-14"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[9px] uppercase tracking-widest text-[var(--wd-muted)] md:text-[10px]">
                    {color.replace("#", "")}
                  </span>
                </div>
              ))}
            </div>
          </WeddingReveal>
        ) : null}

        {dressCode.image_url ? (
          <WeddingReveal delay={150} className="w-full md:max-w-[28rem]">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] bg-[var(--wd-card)]">
              <Image
                src={dressCode.image_url}
                alt="Referensi dress code"
                fill
                sizes="(min-width: 768px) 28rem, 100vw"
                className="wd-photo object-cover"
              />
            </div>
          </WeddingReveal>
        ) : null}
      </div>
    </section>
  );
}
