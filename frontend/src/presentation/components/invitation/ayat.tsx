"use client";

import { invitationContent } from "@/src/domain/services/invitation-content";
import { Reveal } from "@/src/lib/invitation/reveal";
import { useScrollReveal } from "@/src/lib/invitation/use-scroll-reveal";

export function Ayat() {
  const { ayat, penutup } = invitationContent;
  const stageRef = useScrollReveal<HTMLDivElement>();

  return (
    <section
      id="ayat"
      className="inv-ayat-section inv-hairline-b relative overflow-hidden border-b"
    >
      <div
        className="inv-ayat-texture pointer-events-none absolute inset-0"
        aria-hidden
      />

      <div ref={stageRef} className="inv-ayat-stage relative">
        <div className="mx-auto w-full max-w-3xl px-6 md:px-10">
          <div className="relative flex min-h-dvh flex-col items-center justify-center pt-20 pb-14 text-center md:pt-24 md:pb-16">
            <div className="inv-frame-rule inv-frame-top" aria-hidden />
            <div className="inv-frame-rule inv-frame-bottom" aria-hidden />

            <Reveal>
              <p className="inv-ayat-eyebrow">{ayat.eyebrow}</p>
            </Reveal>

            <div className="relative mx-auto mt-10 w-fit max-w-full md:mt-12">
              <div className="inv-ayat-quote inv-ayat-quote--open" aria-hidden>
                <span className="inv-ayat-quote-mark">{"\u201C"}</span>
              </div>

              <p dir="rtl" lang="ar" className="inv-ayat-arabic-hero">
                {ayat.arabic}
              </p>
            </div>

            <Reveal delay={800} className="mt-12">
              <div className="relative mx-auto w-fit max-w-[58ch]">
                <p className="inv-ayat-note">{ayat.translation}</p>
                <p className="inv-ayat-source mt-4">{ayat.source}</p>
                <div className="inv-ayat-quote inv-ayat-quote--close" aria-hidden>
                  <span className="inv-ayat-quote-mark">{"\u201D"}</span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={900} className="mt-14 md:mt-16">
              <p dir="rtl" lang="ar" className="inv-ayat-bismillah">
                {penutup.bismillah}
              </p>
              <p className="inv-ayat-doa mt-4">{penutup.doa}</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
