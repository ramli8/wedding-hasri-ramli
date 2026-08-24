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
      <div className="wd-container flex flex-col items-center gap-8 text-center md:max-w-[42rem] lg:max-w-[48rem]">
        {opening.greeting ? (
          <WeddingReveal>
            <p className="wd-label">Assalamu&rsquo;alaikum Warahmatullahi Wabarakatuh</p>
            <p className="mt-5 text-[14px] leading-relaxed text-[var(--wd-ink)]/80 md:text-[15px]">
              {opening.greeting}
            </p>
          </WeddingReveal>
        ) : null}

        {opening.arabic ? (
          <WeddingReveal delay={100}>
            <div className="flex flex-col items-center gap-6 border-t border-[var(--wd-line)] pt-10 md:pt-14">
              {opening.eyebrow ? <p className="wd-label">{opening.eyebrow}</p> : null}
              <p
                dir="rtl"
                lang="ar"
                className="text-[1.375rem] leading-[2.2] text-[var(--wd-ink)] md:text-[1.75rem] md:leading-[2.3]"
                style={{ fontFamily: "var(--font-amiri), serif" }}
              >
                {opening.arabic}
              </p>
              {opening.translation ? (
                <p className="max-w-[36rem] text-[13px] italic leading-relaxed text-[var(--wd-muted)] md:text-[14px]">
                  &ldquo;{opening.translation}&rdquo;
                </p>
              ) : null}
              {opening.source ? (
                <p className="wd-label text-[var(--wd-ink)]">{opening.source}</p>
              ) : null}
            </div>
          </WeddingReveal>
        ) : null}
      </div>
    </section>
  );
}
