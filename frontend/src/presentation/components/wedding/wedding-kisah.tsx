"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/src/presentation/components/ui/drawer";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import type { InvitationStory } from "@/src/domain/services/invitation.service";
import { useParallax } from "@/src/lib/invitation/use-parallax";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";

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

interface StoryChapterProps {
  item: InvitationStory;
  index: number;
  onOpenDetail: (item: InvitationStory) => void;
}

function StoryChapter({ item, index, onOpenDetail }: StoryChapterProps) {
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
          {item.detail ? (
            <button
              type="button"
              onClick={() => {
                haptic(8);
                onOpenDetail(item);
              }}
              aria-haspopup="dialog"
              className="group -m-2 mt-2 inline-flex p-2 md:mt-3"
            >
              <span className="wd-script text-[1.5rem] leading-none text-[var(--wd-accent)] transition-colors duration-200 group-hover:text-[var(--wd-ink)]">
                baca ceritanya&hellip;
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </WeddingReveal>
  );
}

export function WeddingKisah() {
  const { data } = useInvitation();
  const [activeStory, setActiveStory] = useState<InvitationStory | null>(null);
  if (!data) return null;

  const story = data.story;
  if (story.length === 0) return null;

  return (
    <section id="kisah" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-14 md:gap-20">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Kisah Kami</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
            Beberapa bab kecil yang membawa kami sampai di sini.
          </p>
        </WeddingReveal>

        <div className="flex w-full flex-col gap-16 md:gap-24">
          {story.map((item, index) => (
            <StoryChapter
              key={`${item.title}-${index}`}
              item={item}
              index={index}
              onOpenDetail={setActiveStory}
            />
          ))}
        </div>
      </div>

      <Drawer
        shouldScaleBackground={false}
        open={activeStory !== null}
        onOpenChange={(open) => !open && setActiveStory(null)}
      >
        <DrawerContent className="wd-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[1.75rem]">
          <div className="overflow-y-auto px-6 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-2">
            {activeStory ? (
              <>
                <div className="flex flex-col items-center gap-1 pb-4">
                  <DrawerTitle className="text-2xl font-light italic [font-family:var(--font-cormorant),serif]">
                    {activeStory.title}
                  </DrawerTitle>
                  <DrawerDescription className="text-[11px] uppercase tracking-[0.28em] text-[var(--sheet-muted)]">
                    {activeStory.event_date ?? "Kisah Kami"}
                  </DrawerDescription>
                </div>
                <div className="mb-6 flex justify-center">
                  <span className="h-px w-10 bg-white/20" aria-hidden />
                </div>
                <p className="whitespace-pre-line break-words text-[14px] leading-[1.9] text-white/85">
                  {activeStory.detail}
                </p>
              </>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
