"use client";

import { Pause, Music } from "lucide-react";
import { useWeddingInvitation } from "@/src/lib/invitation/wedding-context";
import { cn } from "@/src/lib/utils";

export function WeddingMusicPlayer() {
  const { opened, musicPlaying, musicSupported, toggleMusic } = useWeddingInvitation();

  if (!opened || !musicSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-label={musicPlaying ? "Matikan musik" : "Nyalakan musik"}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full",
        "border border-[var(--wd-line-strong)] bg-[var(--wd-card)] text-[var(--wd-ink)] shadow-lg",
        "transition-all duration-200 active:scale-95",
        musicPlaying && "animate-pulse [animation-duration:2.4s]",
      )}
    >
      {musicPlaying ? <Pause className="h-4 w-4" /> : <Music className="h-4 w-4" />}
    </button>
  );
}
