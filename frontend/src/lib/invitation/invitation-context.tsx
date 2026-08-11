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
import { invitationContent } from "@/src/domain/services/invitation-content";
import { useLenisScroll } from "./smooth-scroll";
import { haptic } from "./haptics";

type InvitationContextValue = {
  opened: boolean;
  open: () => void;
  musicPlaying: boolean;
  musicSupported: boolean;
  toggleMusic: () => void;
};

const InvitationContext = createContext<InvitationContextValue | null>(null);

export function InvitationProvider({ children }: { children: ReactNode }) {
  const lenis = useLenisScroll();
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicSupported, setMusicSupported] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(invitationContent.music.src);
    audio.preload = "none";
    audio.loop = true;
    audio.onerror = () => setMusicSupported(false);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !musicSupported) return;
    audio.play().catch(() => setMusicSupported(false));
    setMusicPlaying(true);
  }, [musicSupported]);

  const open = useCallback(() => {
    setOpened(true);
    startMusic();
    haptic(12);
  }, [startMusic]);

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
    <InvitationContext.Provider value={value}>{children}</InvitationContext.Provider>
  );
}

export function useInvitation(): InvitationContextValue {
  const ctx = useContext(InvitationContext);
  if (!ctx) throw new Error("useInvitation must be used within InvitationProvider");
  return ctx;
}
