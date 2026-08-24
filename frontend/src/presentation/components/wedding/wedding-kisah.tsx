"use client";

import Image from "next/image";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";

export function WeddingKisah() {
  const { data } = useInvitation();
  if (!data) return null;

  const story = data.story;
  if (story.length === 0) return null;

  return (
    <section id="kisah" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            Perjalanan Kami
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Kisah Kami</h2>
          <div className="h-px w-10 bg-[var(--wd-line-strong)]" aria-hidden />
        </WeddingReveal>

        <div className="flex w-full flex-col gap-12 lg:gap-16">
          {story.map((item, index) => (
            <WeddingReveal
              key={`${item.title}-${index}`}
              delay={80}
              className={index % 2 === 1 ? "md:flex md:flex-row-reverse md:gap-10" : "md:flex md:gap-10"}
            >
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[1.5rem] bg-[var(--wd-card)] md:w-1/2">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 32rem, (min-width: 768px) 50vw, 100vw"
                    className="wd-photo object-cover"
                  />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
              <div className="flex flex-col items-center justify-center gap-2 pt-5 text-center md:w-1/2 md:pt-0">
                {item.event_date ? (
                  <span className="wd-display text-[2.5rem] leading-none text-[var(--wd-ink)]/25 md:text-[3.5rem]">
                    {item.event_date}
                  </span>
                ) : null}
                <h3 className="wd-display text-[1.5rem] md:text-[2rem]">{item.title}</h3>
                {item.description ? (
                  <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[28rem] md:text-[14px]">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </WeddingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
