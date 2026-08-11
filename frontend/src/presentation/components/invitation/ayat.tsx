"use client";

import { invitationContent } from "@/src/domain/services/invitation-content";
import { Reveal } from "@/src/lib/invitation/reveal";

export function Ayat() {
  const { ayat, orangTua } = invitationContent;

  return (
    <section
      id="ayat"
      className="inv-section inv-hairline-b relative flex min-h-dvh items-center justify-center border-b px-6 py-28"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <Reveal>
          <p className="inv-eyebrow">Ayat</p>
        </Reveal>

        <Reveal delay={100}>
          <p dir="rtl" lang="ar" className="inv-ayat-arabic mt-12">
            {ayat.arabic}
          </p>
        </Reveal>

        <Reveal delay={200}>
          <div className="inv-ayat-divider mt-12" aria-hidden />
          <p className="inv-ayat-translation mt-8">{ayat.translation}</p>
          <p className="inv-eyebrow mt-8">{ayat.source}</p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-14 flex flex-col items-center gap-4 border-t border-[var(--inv-hairline)] pt-10">
            <p className="inv-eyebrow">{orangTua.pihakWanita}</p>
            <p className="inv-eyebrow">{orangTua.pihakPria}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
