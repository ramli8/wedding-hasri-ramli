"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { invitationContent } from "@/src/domain/services/invitation-content";
import { useInvitation } from "@/src/lib/invitation/invitation-context";
import { useLenisScroll } from "@/src/lib/invitation/smooth-scroll";
import { useGuestName } from "@/src/lib/invitation/use-guest";
import { Magnetic } from "@/src/lib/invitation/magnetic";
import { Button } from "@/src/presentation/components/ui/button";
import { CoverflowCarousel } from "@/src/presentation/components/ui/coverflow-carousel";

export function Cover() {
  const { open } = useInvitation();
  const lenis = useLenisScroll();
  const guestName = useGuestName();
  const [exiting, setExiting] = useState(false);
  const { couple, wedding, cover } = invitationContent;

  const handleOpen = () => {
    setExiting(true);
    open();
    if (lenis) {
      lenis.start();
      lenis.scrollTo("#ayat", {
        duration: 1.6,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
    } else {
      requestAnimationFrame(() => {
        document.getElementById("ayat")?.scrollIntoView({ behavior: "auto" });
      });
    }
  };

  return (
    <section
      id="cover"
      className={`relative flex min-h-dvh items-center overflow-hidden transition-all duration-500 ease-out ${exiting ? "opacity-80" : ""}`}
    >
      <div className="inv-cover-bg absolute inset-0" aria-hidden />
      <div className="inv-cover-grain absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-12 pt-6 sm:pb-20 sm:pt-10 lg:px-10">
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-16">
          <div className="flex flex-col items-center lg:col-span-6 lg:items-start">
            <div className="inv-rise w-full" style={{ animationDelay: "250ms" }}>
              <CoverflowCarousel
                slides={cover.photos.map((src) => ({
                  src,
                  alt: "Foto prewedding",
                }))}
                rotate={32}
                depth={0.45}
                falloff={0.65}
                perspective={3.5}
                fade={0.12}
                cardWidth="clamp(170px, 24vw, 300px)"
                loop
                label="Foto prewedding Hasri & Ramli"
                cardClassName="aspect-[4/5] rounded-lg border border-[var(--inv-hairline)] bg-[var(--inv-surface)] shadow-xl [&_img]:[filter:contrast(1.02)]"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center lg:col-span-6 lg:mt-0 lg:items-start lg:pt-10">
            <p
              className="inv-cover-greeting inv-rise"
              style={{ animationDelay: "450ms" }}
            >
              Kpd Yth. {guestName ?? "Bapak/Ibu/Saudara/i"}
            </p>
            <p
              className="inv-eyebrow inv-rise mt-4"
              style={{ animationDelay: "550ms" }}
            >
              The Wedding Of
            </p>
            <h1
              className="inv-cover-names inv-rise mt-3 lg:justify-start"
              style={{ animationDelay: "650ms" }}
            >
              {couple.names[0]}
              <span className="inv-cover-names-amp">&amp;</span>
              {couple.names[1]}
            </h1>
            <p
              className="inv-cover-tagline inv-rise mt-2"
              style={{ animationDelay: "700ms" }}
            >
              13 tahun bersama, kini satu ikatan
            </p>
            <p
              className="inv-eyebrow inv-rise mt-4 text-center lg:text-left"
              style={{ animationDelay: "750ms" }}
            >
              {wedding.dateLabel}
            </p>
            <p
              className="inv-eyebrow inv-rise mt-2 text-center lg:text-left"
              style={{ animationDelay: "800ms" }}
            >
              {wedding.venue}
            </p>

            <div
              className="inv-rise mt-6 self-center lg:self-start"
              style={{ animationDelay: "900ms" }}
            >
              <Magnetic>
                <Button onClick={handleOpen} className="inv-cta group rounded-lg">
                  Buka Undangan
                  <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Magnetic>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
