import type { Metadata } from "next";
import type { ComponentType } from "react";
import { Inter } from "next/font/google";
import { invitationContent } from "@/src/domain/services/invitation-content";
import { InvitationThemeProvider } from "@/src/lib/invitation/invitation-theme";
import { SmoothScrollProvider } from "@/src/lib/invitation/smooth-scroll";
import { InvitationProvider } from "@/src/lib/invitation/invitation-context";
import { ScrollProgress } from "@/src/lib/invitation/scroll-progress";
import { FilmGrain } from "@/src/lib/invitation/film-grain";
import { Cover } from "@/src/presentation/components/invitation/cover";
import { Ayat } from "@/src/presentation/components/invitation/ayat";
import { Mempelai } from "@/src/presentation/components/invitation/mempelai";
import { KisahCinta } from "@/src/presentation/components/invitation/kisah-cinta";
import { Acara } from "@/src/presentation/components/invitation/acara";
import { Countdown } from "@/src/presentation/components/invitation/countdown";
import { Galeri } from "@/src/presentation/components/invitation/galeri";
import { Rsvp } from "@/src/presentation/components/invitation/rsvp";
import { Ucapan } from "@/src/presentation/components/invitation/ucapan";
import { Hadiah } from "@/src/presentation/components/invitation/hadiah";
import { QrSection } from "@/src/presentation/components/invitation/qr";
import { Info } from "@/src/presentation/components/invitation/info";
import { Penutup } from "@/src/presentation/components/invitation/penutup";
import { ThemeSwitcher } from "@/src/presentation/components/invitation/theme-switcher";
import { MusicPlayer } from "@/src/presentation/components/invitation/music-player";
import "./invitation.css";

const inter = Inter({
  variable: "--inv-font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Undangan — Hasri & Ramli",
  description: "Undangan digital pernikahan Hasri & Ramli",
};

const sectionComponents: Record<string, ComponentType> = {
  cover: Cover,
  ayat: Ayat,
  mempelai: Mempelai,
  "kisah-cinta": KisahCinta,
  acara: Acara,
  countdown: Countdown,
  galeri: Galeri,
  rsvp: Rsvp,
  ucapan: Ucapan,
  hadiah: Hadiah,
  qr: QrSection,
  info: Info,
  penutup: Penutup,
};

export default function UndanganPage() {
  return (
    <InvitationThemeProvider fontClassName={inter.variable}>
      <SmoothScrollProvider>
        <InvitationProvider>
          <ScrollProgress />
          <FilmGrain />
          <MusicPlayer />
          <ThemeSwitcher />
          <main>
            {Object.values(invitationContent.sections).map((section) => {
              const Section = sectionComponents[section.id];
              return <Section key={section.id} />;
            })}
          </main>
        </InvitationProvider>
      </SmoothScrollProvider>
    </InvitationThemeProvider>
  );
}
