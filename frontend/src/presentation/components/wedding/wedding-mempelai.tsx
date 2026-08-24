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
      <div className="wd-container flex flex-col items-center gap-10 text-center">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            with love
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Mempelai</h2>
          <div className="h-px w-10 bg-[var(--wd-line-strong)]" aria-hidden />
        </WeddingReveal>

        <div className="relative flex w-full flex-col items-center gap-10 md:flex-row md:items-stretch md:justify-center md:gap-0">
          <span
            className="wd-script absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 text-[3.5rem] text-[var(--wd-accent)] md:block"
            aria-hidden
          >
            &amp;
          </span>
          {[bride, groom].map((couple, index) =>
            couple ? (
              <WeddingReveal
                key={couple.side}
                delay={index * 120}
                className="flex w-full flex-col items-center gap-5 md:w-auto md:flex-1 md:px-10"
              >
                <div className="wd-hover-color relative w-fit">
                  <div
                    aria-hidden
                    className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-t-full rounded-b-[1.5rem] border border-[var(--wd-accent-line)]"
                  />
                  <div className="relative aspect-[4/5] w-64 overflow-hidden rounded-t-full rounded-b-[1.5rem] bg-[var(--wd-card)] md:w-full md:max-w-[20rem]">
                    {couple.photo_url ? (
                      <Image
                        src={couple.photo_url}
                        alt={couple.full_name}
                        fill
                        sizes="(min-width: 768px) 20rem, 16rem"
                        className="wd-photo wd-photo-hover object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="wd-display text-[3rem] text-[var(--wd-card-ink)]/40">
                          {initialsOf(couple.full_name)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <p className="wd-label">{couple.side === "wanita" ? "Putri" : "Putra"}</p>
                  <p className="wd-display text-[1.75rem] md:text-[2rem]">
                    {couple.full_name}
                  </p>
                  {couple.gelar ? (
                    <p className="text-[13px] italic text-[var(--wd-muted)]">
                      {couple.gelar}
                    </p>
                  ) : null}
                  {couple.instagram_handle ? (
                    <a
                      href={`https://instagram.com/${couple.instagram_handle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--wd-ink)]/70 transition-colors hover:text-[var(--wd-ink)]"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                      {couple.instagram_handle}
                    </a>
                  ) : null}
                </div>
              </WeddingReveal>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}
