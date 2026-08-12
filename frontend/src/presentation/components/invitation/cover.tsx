"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { invitationContent } from "@/src/domain/services/invitation-content";
import { useInvitation } from "@/src/lib/invitation/invitation-context";
import { useInvitationTheme } from "@/src/lib/invitation/invitation-theme";
import { useLenisScroll } from "@/src/lib/invitation/smooth-scroll";
import { useGuestName } from "@/src/lib/invitation/use-guest";
import { haptic } from "@/src/lib/invitation/haptics";
import { useIsMobile } from "@/src/application/hooks/use-mobile";
import { Button } from "@/src/presentation/components/ui/button";
import { CoverflowCarousel } from "@/src/presentation/components/ui/coverflow-carousel";

export function Cover() {
  const { open } = useInvitation();
  const lenis = useLenisScroll();
  const guestName = useGuestName();
  const isMobile = useIsMobile();
  const [exiting, setExiting] = useState(false);
  const { couple, wedding, cover } = invitationContent;
  const { theme } = useInvitationTheme();

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
      className={`relative flex min-h-dvh flex-col items-center overflow-hidden transition-all duration-500 ease-out ${exiting ? "opacity-80" : ""}`}
    >
      <div className="inv-cover-bg absolute inset-0" aria-hidden />
      <div className="inv-cover-grain absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6 sm:gap-9 lg:gap-0 lg:justify-start">
        <div className="inv-rise w-full lg:flex lg:flex-1 lg:items-center" style={{ animationDelay: "250ms" }}>
          <div className="w-full">
            <CoverflowCarousel
              slides={cover.photos.map((src) => ({
                src,
                alt: "Foto prewedding",
              }))}
              rotate={isMobile ? 18 : 32}
              depth={isMobile ? 0.4 : 0.45}
              falloff={0.65}
              perspective={isMobile ? 4 : 3.5}
              fade={isMobile ? 0.07 : 0.12}
              minOpacity={theme === "ivory" ? 0.68 : 0}
              cardWidth={isMobile ? "clamp(112px, 32vw, 340px)" : "clamp(84px, 26vw, 340px)"}
              loop
              onSlideChange={() => haptic(8)}
              label="Foto prewedding Hasri & Ramli"
              cardClassName={`rounded-lg border shadow-xl ${
                theme === "ivory"
                  ? "border-[rgba(33,29,24,0.10)] bg-[#fbf8f2] [&_img]:[filter:contrast(1.05)]"
                  : "border-[var(--inv-hairline)] bg-[var(--inv-surface)] [&_img]:[filter:contrast(1.02)]"
              }`}
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-2 pb-6 sm:pb-10 lg:pb-16 lg:px-10">
          <p
            className="inv-cover-greeting inv-rise"
            style={{ animationDelay: "450ms" }}
          >
            Kpd Yth. {guestName ?? "Bapak/Ibu/Saudara/i"}
          </p>
          <p
            className="inv-eyebrow inv-eyebrow-accent inv-rise mt-4"
            style={{ animationDelay: "550ms" }}
          >
            The Wedding Of
          </p>
          <h1
            className="inv-cover-names inv-rise mt-3"
            style={{ animationDelay: "650ms" }}
          >
            {couple.names[0]}
            <span className="inv-cover-names-amp">&amp;</span>
            {couple.names[1]}
          </h1>
          <div
            className="inv-cover-flourish inv-rise mt-3"
            style={{ animationDelay: "675ms" }}
            aria-hidden
          >
            <span className="inv-cover-flourish-line" />
            <span className="inv-cover-flourish-dot" />
            <span className="inv-cover-flourish-line" />
          </div>
          <p
            className="inv-cover-tagline inv-rise mt-2"
            style={{ animationDelay: "700ms" }}
          >
            13 tahun bersama, kini satu ikatan
          </p>
          <p
            className="inv-eyebrow inv-rise mt-4 text-center"
            style={{ animationDelay: "750ms" }}
          >
            {wedding.dateLabel}
          </p>
          <p
            className="inv-eyebrow inv-rise mt-2 text-center"
            style={{ animationDelay: "800ms" }}
          >
            {wedding.venue}
          </p>

          <div
            className="inv-rise mt-10"
            style={{ animationDelay: "900ms" }}
          >
            <Button
              onClick={handleOpen}
              className="inv-cta inv-cta--underline rounded-lg"
            >
              Buka Undangan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
