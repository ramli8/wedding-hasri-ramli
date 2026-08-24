"use client";

import Image from "next/image";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import type { InvitationStory } from "@/src/domain/services/invitation.service";
import { useParallax } from "@/src/lib/invitation/use-parallax";
import { WeddingReveal } from "./wedding-reveal";

function StoryPhoto({ src, alt }: { src: string; alt: string }) {
  const parallaxRef = useParallax<HTMLDivElement>({ factor: 0.06, offset: 120 });

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-[var(--wd-card)]">
      <div ref={parallaxRef} className="absolute inset-[-6%]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 58vw, 100vw"
          className="wd-photo-live object-cover"
        />
      </div>
    </div>
  );
}

function StoryChapter({ item, index }: { item: InvitationStory; index: number }) {
  const flip = index % 2 === 1;

  return (
    <WeddingReveal delay={80} className="w-full">
      <div className="md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div
          className={`group relative w-full md:col-span-7 ${flip ? "md:order-2" : ""}`}
        >
          {item.image_url ? (
            <StoryPhoto src={item.image_url} alt={item.title} />
          ) : (
            <div className="aspect-[4/5] w-full rounded-[1.5rem] bg-[var(--wd-card)]" />
          )}
          {item.event_date ? (
            <span
              className={`wd-year-hollow pointer-events-none absolute z-10 text-[clamp(4rem,12vw,7rem)] ${
                flip
                  ? "-top-7 left-1 md:-left-8 md:-top-9"
                  : "-top-7 right-1 md:-right-8 md:-top-9"
              }`}
              aria-hidden
            >
              {item.event_date}
            </span>
          ) : null}
        </div>

        <div
          className={`mt-5 flex flex-col items-center gap-3 text-center md:col-span-5 md:mt-0 md:items-start md:text-left ${
            flip ? "md:order-1 md:pr-4" : "md:pl-4"
          }`}
        >
          <span className="wd-label">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="wd-display text-[1.75rem] italic leading-tight md:text-[2.25rem]">
            {item.title}
          </h3>
          <span className="h-px w-10 bg-[var(--wd-line-strong)]" aria-hidden />
          {item.description ? (
            <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[26rem] md:text-[14px]">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
    </WeddingReveal>
  );
}

export function WeddingKisah() {
  const { data } = useInvitation();
  if (!data) return null;

  const story = data.story;
  if (story.length === 0) return null;

  return (
    <section id="kisah" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-14 md:gap-20">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            Perjalanan Kami
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Kisah Kami</h2>
          <div className="h-px w-10 bg-[var(--wd-line-strong)]" aria-hidden />
        </WeddingReveal>

        <div className="flex w-full flex-col gap-16 md:gap-24">
          {story.map((item, index) => (
            <StoryChapter key={`${item.title}-${index}`} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
