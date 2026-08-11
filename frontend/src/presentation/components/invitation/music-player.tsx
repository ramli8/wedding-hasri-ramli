"use client";

import { Music2, VolumeX } from "lucide-react";
import { useInvitation } from "@/src/lib/invitation/invitation-context";

export function MusicPlayer() {
  const { opened, musicPlaying, musicSupported, toggleMusic } = useInvitation();

  if (!opened || !musicSupported) return null;

  return (
    <button
      onClick={toggleMusic}
      aria-label={musicPlaying ? "Matikan musik" : "Nyalakan musik"}
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--inv-accent)]/30 bg-[var(--inv-surface)]/70 text-[var(--inv-accent)] shadow-lg backdrop-blur transition-all hover:bg-[var(--inv-surface)] active:scale-90"
    >
      {musicPlaying ? (
        <Music2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
    </button>
  );
}
