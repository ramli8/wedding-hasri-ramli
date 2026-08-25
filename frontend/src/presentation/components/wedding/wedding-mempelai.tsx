"use client";

import Image from "next/image";
import { Instagram } from "lucide-react";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function WeddingMempelai() {
  const { data } = useInvitation();
  if (!data) return null;

  const { couples } = data;
  if (couples.length === 0) return null;

  const bride = couples.find((c) => c.side === "wanita") ?? couples[0];
  const groom = couples.find((c) => c.side === "pria") ?? couples[1];

  return (
    <section id="mempelai" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center lg:max-w-[64rem]">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Mempelai</h2>
        </WeddingReveal>

        <div className="relative flex w-full flex-col gap-6 md:flex-row md:items-stretch md:justify-center md:gap-3">
          <span
            className="wd-script absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 text-[4rem] text-[var(--wd-accent)] md:block"
            aria-hidden
          >
            &amp;
          </span>

          {[bride, groom].map((couple, index) =>
            couple ? (
              <WeddingReveal
                key={couple.side}
                delay={index * 120}
                className="w-full md:flex-1"
              >
                <figure className="wd-hover-color group relative overflow-hidden rounded-[1.5rem] bg-[var(--wd-surface)]">
                  <div className="relative aspect-[3/4] w-full">
                    {couple.photo_url ? (
                      <Image
                        src={couple.photo_url}
                        alt={couple.full_name}
                        fill
                        sizes="(min-width:768px) 31rem, 100vw"
                        className="wd-photo wd-photo-hover object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="wd-display text-[6rem] leading-none text-[var(--wd-ink)]/15">
                          {initialsOf(couple.full_name)}
                        </span>
                      </div>
                    )}

                    <div
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
                    />

                    <figcaption className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 p-6 pb-7">
                      {couple.parents_line ? (
                        <span className="max-w-[24rem] text-[12px] italic leading-relaxed text-white/70 [font-family:var(--wd-font-serif)] md:text-[13px]">
                          {couple.parents_line}
                        </span>
                      ) : couple.gelar ? (
                        <span className="text-[12px] italic text-white/70 [font-family:var(--wd-font-serif)]">
                          {couple.gelar}
                        </span>
                      ) : null}
                      <span className="wd-display text-[2rem] leading-none text-white md:text-[2.25rem]">
                        {couple.full_name}
                      </span>
                    </figcaption>
                  </div>
                </figure>

                {couple.instagram_handle ? (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Instagram className="h-3.5 w-3.5 text-[var(--wd-muted)]" aria-hidden />
                    <a
                      href={`https://instagram.com/${couple.instagram_handle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[12px] font-semibold text-[var(--wd-ink)]/70 transition-colors hover:text-[var(--wd-ink)]"
                    >
                      {couple.instagram_handle}
                    </a>
                  </div>
                ) : null}
              </WeddingReveal>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}
