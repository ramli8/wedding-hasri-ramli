"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLenisScroll } from "./smooth-scroll";
import { haptic } from "./haptics";

type WeddingContextValue = {
  opened: boolean;
  open: () => void;
  musicPlaying: boolean;
  musicSupported: boolean;
  toggleMusic: () => void;
};

const WeddingContext = createContext<WeddingContextValue | null>(null);

// Bertahan lintas remount subtree (singleton modul) — cover tidak boleh
// muncul kembali setelah tamu membuka undangan, apa pun yang memicu remount.
let hasOpenedInSession = false;

export function WeddingProvider({
  children,
  musicSrc,
}: {
  children: ReactNode;
  musicSrc?: string | null;
}) {
  const lenis = useLenisScroll();
  const [opened, setOpened] = useState(() => hasOpenedInSession);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicSupported, setMusicSupported] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Kunci scroll dokumen selama cover menutupi layar — konten utama
  // di belakangnya tidak boleh bisa discroll.
  useEffect(() => {
    if (opened) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [opened]);

  useEffect(() => {
    if (!musicSrc) {
      setMusicSupported(false);
      return;
    }
    const audio = new Audio(musicSrc);
    audio.preload = "none";
    audio.loop = true;
    audio.onerror = () => setMusicSupported(false);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [musicSrc]);

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !musicSupported) return;
    audio.play().catch(() => setMusicSupported(false));
    setMusicPlaying(true);
  }, [musicSupported]);

  const open = useCallback(() => {
    hasOpenedInSession = true;
    setOpened(true);
    lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    startMusic();
    haptic(12);
  }, [lenis, startMusic]);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    haptic(10);
    if (!audio || !musicSupported) return;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
    } else {
      audio.play().catch(() => setMusicSupported(false));
      setMusicPlaying(true);
    }
  }, [musicPlaying, musicSupported]);

  useEffect(() => {
    if (!opened) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
  }, [opened, lenis]);

  const value = useMemo(
    () => ({ opened, open, musicPlaying, musicSupported, toggleMusic }),
    [opened, open, musicPlaying, musicSupported, toggleMusic],
  );

  return (
    <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>
  );
}

export function useWeddingInvitation(): WeddingContextValue {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWeddingInvitation must be used within WeddingProvider");
  return ctx;
}
