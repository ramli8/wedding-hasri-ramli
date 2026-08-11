"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, type PanInfo } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { usePrefersReducedMotion } from "@/src/lib/invitation/reduced-motion";

type Card = {
  id: number;
  src: string | null;
  zIndex: number;
};

type CoverStackProps = {
  images: readonly (string | null)[];
  className?: string;
};

const MIN_DRAG_DISTANCE = 50;

export function CoverStack({ images, className }: CoverStackProps) {
  const [cards, setCards] = useState<Card[]>(() =>
    images.map((src, index) => ({ id: index, src, zIndex: 50 - index * 10 })),
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const reducedMotion = usePrefersReducedMotion();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const cardPose = (index: number) => {
    const baseRotation = 4;
    const rotationIncrement = 3;
    const offsetIncrement = compact ? -10 : -18;
    const verticalOffset = compact ? -4 : -8;

    return {
      x: index * offsetIncrement,
      y: index * verticalOffset,
      rotate: index === 0 ? 0 : -(baseRotation + index * rotationIncrement),
      scale: index === 0 ? 1 : 1 - index * 0.02,
      transition: { duration: 0.55, ease: "easeOut" as const },
    };
  };

  const handleDragStart = (_: unknown, info: PanInfo) => {
    dragStartPos.current = { x: info.point.x, y: info.point.y };
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (isAnimating) return;
    const distance = Math.hypot(
      info.point.x - dragStartPos.current.x,
      info.point.y - dragStartPos.current.y,
    );
    if (distance < MIN_DRAG_DISTANCE) return;

    setIsAnimating(true);
    setCards((prev) => {
      const [top, ...rest] = prev;
      return [...rest, top].map((card, index) => ({
        ...card,
        zIndex: 50 - index * 10,
      }));
    });
    setTimeout(() => setIsAnimating(false), 340);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        className,
      )}
    >
      <div
        className="relative flex h-[19rem] w-[min(92vw,20rem)] items-center justify-center sm:h-[24rem] sm:w-[min(88vw,28rem)] lg:h-[27rem] lg:w-[min(88vw,30rem)]"
        style={reducedMotion ? { pointerEvents: "none" } : undefined}
      >
        {cards.map((card, index) => {
          const isTopCard = index === 0;
          const canDrag = isTopCard && !isAnimating && !reducedMotion;

          return (
            <motion.div
              key={card.id}
              className="inv-stack-card absolute w-60 cursor-grab active:cursor-grabbing rounded-lg sm:w-72 lg:w-80"
              style={{ zIndex: card.zIndex, aspectRatio: "4 / 5" }}
              animate={cardPose(index)}
              drag={canDrag}
              dragElastic={0.2}
              dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
              dragSnapToOrigin
              dragTransition={{ bounceStiffness: 600, bounceDamping: 12 }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              whileHover={
                isTopCard && !reducedMotion
                  ? {
                      scale: 1.03,
                      boxShadow: "0 20px 40px -12px rgba(26, 26, 26, 0.25)",
                      transition: { duration: 0.2 },
                    }
                  : {}
              }
              whileDrag={{
                scale: 1.06,
                rotate: 0,
                zIndex: 100,
                boxShadow: "0 30px 50px -14px rgba(26, 26, 26, 0.3)",
                transition: { duration: 0.1 },
              }}
            >
              {card.src ? (
                <Image
                  src={card.src}
                  alt={`Foto ${card.id + 1}`}
                  fill
                  sizes="(max-width: 640px) 240px, (max-width: 1024px) 288px, 320px"
                  draggable={false}
                  className="inv-cover-img object-cover"
                />
              ) : (
                <div className="inv-stack-placeholder">
                  <span>H · R</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
