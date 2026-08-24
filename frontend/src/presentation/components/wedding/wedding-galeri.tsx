"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";
import { computeJustifiedRows, rowMetrics } from "@/src/lib/invitation/justified-layout";

const DEFAULT_RATIOS = [3 / 4, 1, 4 / 5, 3 / 4, 1];

export function WeddingGaleri() {
  const { data } = useInvitation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [ratios, setRatios] = useState<Record<number, number>>({});
  const [containerWidth, setContainerWidth] = useState(0);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const gallery = data?.gallery ?? [];

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth((prev) => (Math.abs(prev - width) < 0.5 ? prev : width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [gallery.length]);

  const effectiveRatios = useMemo(
    () => gallery.map((_, index) => ratios[index] ?? DEFAULT_RATIOS[index % DEFAULT_RATIOS.length]),
    [gallery, ratios],
  );

  const rows = useMemo(() => {
    if (containerWidth <= 0) return [];
    const { gap, itemsPerRow } = rowMetrics(containerWidth);
    return computeJustifiedRows({ ratios: effectiveRatios, containerWidth, gap, itemsPerRow });
  }, [effectiveRatios, containerWidth]);

  const handleImageLoad = useCallback((index: number, event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!image.naturalWidth || !image.naturalHeight) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    setRatios((prev) =>
      Math.abs((prev[index] ?? 0) - ratio) < 0.001 ? prev : { ...prev, [index]: ratio },
    );
  }, []);

  const close = useCallback(() => setActiveIndex(null), []);
  const goNext = useCallback(
    () => setActiveIndex((prev) => (prev === null ? prev : (prev + 1) % gallery.length)),
    [gallery.length],
  );
  const goPrev = useCallback(
    () =>
      setActiveIndex((prev) =>
        prev === null ? prev : (prev - 1 + gallery.length) % gallery.length,
      ),
    [gallery.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };

    document.addEventListener("keydown", onKeyDown);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = "";
    };
  }, [activeIndex, close, goNext, goPrev]);

  if (gallery.length === 0) return null;

  const active = activeIndex !== null ? gallery[activeIndex] : null;

  return (
    <section id="galeri" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70">            Momen Bahagia</p>
          <h2 className="wd-display text-[2.25rem]">Galeri</h2>
          <div className="h-px w-10 bg-[var(--wd-line-strong)]" aria-hidden />
        </WeddingReveal>

        <WeddingReveal delay={100} className="w-full">
          <div ref={gridRef} className="flex w-full flex-col gap-2 sm:gap-3">
            {rows.map((row) => (
              <div
                key={`row-${row.indexes[0]}`}
                className={`flex w-full items-stretch gap-2 sm:gap-3 ${
                  row.justify === "center" ? "justify-center" : ""
                }`}
                style={{ height: row.height }}
              >
                {row.indexes.map((index) => {
                  const item = gallery[index];
                  return (
                    <WeddingReveal
                      key={`${item.image_url}-${index}`}
                      delay={(index % 4) * 70}
                      className="group relative h-full"
                      style={
                        row.justify === "fill"
                          ? { flexGrow: effectiveRatios[index], flexBasis: 0, minWidth: 0 }
                          : { width: effectiveRatios[index] * row.height }
                      }
                    >
                      <button
                        type="button"
                        onClick={() => {
                          haptic(8);
                          setActiveIndex(index);
                        }}
                        aria-label={`Lihat foto ${index + 1}`}
                        className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-[var(--wd-card)] transition-all duration-200 active:scale-[0.97]"
                      >
                        <Image
                          src={item.image_url}
                          alt={item.caption ?? "Foto galeri"}
                          fill
                          sizes="(min-width: 768px) 33vw, 50vw"
                          onLoad={(event) => handleImageLoad(index, event)}
                          className="wd-photo-live wd-photo-zoom object-cover"
                        />
                      </button>
                    </WeddingReveal>
                  );
                })}
              </div>
            ))}
          </div>
        </WeddingReveal>
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto galeri"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>

          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  haptic(8);
                  goPrev();
                }}
                aria-label="Foto sebelumnya"
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 active:scale-95 md:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  haptic(8);
                  goNext();
                }}
                aria-label="Foto berikutnya"
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 active:scale-95 md:right-6"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div
            className="relative h-[75dvh] w-full max-w-[42rem]"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0].clientX;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null || gallery.length < 2) return;
              const delta = event.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(delta) < 48) return;
              haptic(8);
              if (delta < 0) goNext();
              else goPrev();
            }}
          >
            <Image
              src={active.image_url}
              alt={active.caption ?? "Foto galeri"}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <div className="mt-5 flex min-h-[2.5rem] flex-col items-center gap-1.5">
            {gallery.length > 1 ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
                {String((activeIndex ?? 0) + 1).padStart(2, "0")} /{" "}
                {String(gallery.length).padStart(2, "0")}
              </span>
            ) : null}
            {active.caption ? (
              <p className="max-w-[28rem] px-4 text-center text-[13px] leading-relaxed text-white/70">
                {active.caption}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
