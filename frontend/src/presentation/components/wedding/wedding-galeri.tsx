"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";

export function WeddingGaleri() {
  const { data } = useInvitation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const gallery = data?.gallery ?? [];

  const close = useCallback(() => setActiveIndex(null), []);

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => (prev === null ? prev : (prev + 1) % gallery.length));
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) =>
          prev === null ? prev : (prev - 1 + gallery.length) % gallery.length,
        );
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = "";
    };
  }, [activeIndex, close, gallery.length]);

  if (gallery.length === 0) return null;

  return (
    <section id="galeri" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70">moments</p>
          <h2 className="wd-display text-[2.25rem]">Galeri</h2>
          <div className="h-px w-10 bg-[var(--wd-line-strong)]" aria-hidden />
        </WeddingReveal>

        <WeddingReveal delay={100} className="w-full">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
            {gallery.map((item, index) => (
              <button
                key={`${item.image_url}-${index}`}
                type="button"
                onClick={() => {
                  haptic(8);
                  setActiveIndex(index);
                }}
                aria-label={`Lihat foto ${index + 1}`}
                className="relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--wd-card)] transition-all duration-200 active:scale-95"
              >
                <Image
                  src={item.image_url}
                  alt={item.caption ?? "Foto galeri"}
                  fill
                  sizes="(min-width: 1024px) 16rem, (min-width: 768px) 18rem, 45vw"
                  className="wd-photo object-cover"
                />
              </button>
            ))}
          </div>
        </WeddingReveal>
      </div>

      {activeIndex !== null && gallery[activeIndex] ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto galeri"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative h-[80dvh] w-full max-w-[42rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={gallery[activeIndex].image_url}
              alt={gallery[activeIndex].caption ?? "Foto galeri"}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
