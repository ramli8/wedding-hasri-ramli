"use client";

import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";

export function WeddingAyat() {
  const { data } = useInvitation();
  if (!data) return null;

  const opening = data.wedding.content.opening;
  if (!opening.arabic && !opening.greeting) return null;

  return (
    <section id="ayat" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center md:max-w-[44rem] lg:max-w-[50rem]">
        {opening.greeting ? (
          <WeddingReveal className="flex flex-col items-center gap-5">
            <p className="wd-label">{opening.salam}</p>
            <p className="max-w-[30rem] text-[14px] leading-relaxed text-[var(--wd-ink)]/80 md:text-[15px]">
              {opening.greeting}
            </p>
          </WeddingReveal>
        ) : null}

        {opening.arabic ? (
          <div className="flex w-full flex-col items-center gap-7 px-4 md:gap-8">
            <WeddingReveal className="flex flex-col items-center gap-7">
              <span
                aria-hidden
                className="block h-px w-12 bg-[var(--wd-line-strong)]"
              />
              {opening.eyebrow ? (
                <p className="wd-label wd-label--accent">{opening.eyebrow}</p>
              ) : null}
            </WeddingReveal>

            <WeddingReveal delay={90}>
              <p
                dir="rtl"
                lang="ar"
                className="max-w-[34rem] text-[1.5rem] leading-[2.1] text-[var(--wd-accent)] md:text-[1.875rem] md:leading-[2.15]"
                style={{ fontFamily: "var(--font-amiri), serif" }}
              >
                {opening.arabic}
              </p>
            </WeddingReveal>

            {opening.translation ? (
              <WeddingReveal delay={180}>
                <blockquote className="max-w-[36rem] text-[13px] italic leading-relaxed text-[var(--wd-muted)] [font-family:var(--wd-font-serif)] md:text-[14.5px]">
                  &ldquo;{opening.translation}&rdquo;
                </blockquote>
              </WeddingReveal>
            ) : null}

            <WeddingReveal delay={260} className="flex flex-col items-center gap-7">
              {opening.source ? (
                <figcaption className="wd-label">{opening.source}</figcaption>
              ) : null}
              <span
                aria-hidden
                className="block h-px w-12 bg-[var(--wd-line-strong)]"
              />
            </WeddingReveal>
          </div>
        ) : null}
      </div>
    </section>
  );
}
