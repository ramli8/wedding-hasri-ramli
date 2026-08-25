"use client";

import { useInvitation, setActiveGuestId } from "@/src/application/hooks/use-invitation-query";
import { SmoothScrollProvider } from "@/src/lib/invitation/smooth-scroll";
import { WeddingProvider } from "@/src/lib/invitation/wedding-context";
import { weddingSectionComponents } from "./section-map";
import { WeddingCover } from "./wedding-cover";
import { WeddingMusicPlayer } from "./wedding-music-player";

interface WeddingPageProps {
  guest?: string;
}

export function WeddingPage({ guest }: WeddingPageProps) {
  // Daftarkan tamu aktif sebelum section mana pun memanggil useInvitation()
  // agar semua section membaca cache entry yang sama (terpersonalisasi).
  setActiveGuestId(guest);
  const { data } = useInvitation(guest);

  // Sengaja tanpa isLoading: flicker pending saat refetch tidak boleh
  // membongkar pohon (state cover/music ikut hilang).
  if (!data) {
    return (
      <div className="wedding flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--wd-bg)]">
        <p className="wd-script wd-loading-pulse text-[3rem] text-[var(--wd-ink)] md:text-[4rem]">
          Hasri &amp; Ramli
        </p>
        <span aria-hidden className="wd-loading-pulse h-px w-16 bg-[var(--wd-line-strong)]" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--wd-muted)]">
          Memuat undangan
        </p>
      </div>
    );
  }

  return (
    <SmoothScrollProvider>
      <WeddingProvider musicSrc={data.wedding.content.music.file_url}>
        <div className="wedding">
          <main>
            {[...data.sections]
              .sort((a, b) => a.order_index - b.order_index)
              // Cover dirender eksplisit sebagai overlay di luar main —
              // instansi dari daftar sections akan membuat dua layer bertumpuk.
              .filter((section) => section.section_key !== "cover")
              // Konfirmasi kehadiran hanya untuk tamu dengan link personal.
              .filter(
                (section) => section.section_key !== "rsvp" || Boolean(data.guest),
              )
              .map((section) => {
                const Section = weddingSectionComponents[section.section_key];
                return Section ? <Section key={section.section_key} /> : null;
              })}
          </main>
          <WeddingCover />
          <WeddingMusicPlayer />
        </div>
      </WeddingProvider>
    </SmoothScrollProvider>
  );
}
