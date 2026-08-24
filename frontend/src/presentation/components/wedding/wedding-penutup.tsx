"use client";

import Image from "next/image";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";

export function WeddingPenutup() {
  const { data } = useInvitation();
  if (!data) return null;

  const { wedding, couples } = data;
  const footer = wedding.content.footer;
  const photo = wedding.content.cover.photos.at(-1);
  const bride = couples.find((c) => c.side === "wanita")?.full_name;
  const groom = couples.find((c) => c.side === "pria")?.full_name;

  return (
    <section id="penutup" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center">
        {photo ? (
          <WeddingReveal>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] md:aspect-[21/9]">
              <Image
                src={photo}
                alt="Foto penutup"
                fill
                sizes="(min-width: 768px) 64rem, 100vw"
                className="wd-photo object-cover"
              />
              <div className="absolute inset-0 bg-black/45" />
              <p className="wd-script absolute inset-0 flex items-center justify-center text-[2.5rem] text-white/90 md:text-[3.5rem]">
                Terima Kasih
              </p>
            </div>
          </WeddingReveal>
        ) : null}

        {footer.thank_you_message ? (
          <WeddingReveal delay={80}>
            <p className="max-w-[28rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[34rem] md:text-[14px]">
              {footer.thank_you_message}
            </p>
          </WeddingReveal>
        ) : null}

        <WeddingReveal delay={120}>
          <div className="flex flex-col items-center gap-2">
            {wedding.wedding_date ? (
              <p className="wd-label">{new Date(wedding.wedding_date).getFullYear()}</p>
            ) : null}
            <p className="wd-display text-[2rem] md:text-[2.5rem]">
              {bride ?? wedding.bride_name}
              <span className="mx-2 italic opacity-70">&amp;</span>
              {groom ?? wedding.groom_name}
            </p>
          </div>
        </WeddingReveal>

        <WeddingReveal delay={160}>
          <div className="flex flex-col items-center gap-4 border-t border-[var(--wd-line)] pt-6">
            {footer.social_links.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {footer.social_links.map((link, index) =>
                  Object.entries(link).map(([key, url]) => (
                    <a
                      key={`${key}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-semibold uppercase tracking-widest text-[var(--wd-muted)] transition-colors hover:text-[var(--wd-ink)]"
                    >
                      {key}
                    </a>
                  )),
                )}
              </div>
            ) : null}
            {footer.made_by_credit ? (
              <p className="text-[11px] tracking-wide text-[var(--wd-muted)]/60">
                {footer.made_by_credit}
              </p>
            ) : null}
          </div>
        </WeddingReveal>
      </div>
    </section>
  );
}
