"use client";

import Image from "next/image";
import { Share2 } from "lucide-react";
import { toast } from "react-toastify";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";

export function WeddingPenutup() {
  const { data } = useInvitation();
  if (!data) return null;

  const { wedding, couples } = data;
  const footer = wedding.content.footer;
  const photo =
    wedding.content.cover.image_desktop ||
    wedding.content.cover.image_tablet ||
    wedding.content.cover.image_mobile;
const bride = couples.find((c) => c.side === "wanita")?.nickname || couples.find((c) => c.side === "wanita")?.full_name;
const groom = couples.find((c) => c.side === "pria")?.nickname || couples.find((c) => c.side === "pria")?.full_name;
  const brideName = bride ?? wedding.bride_name;
  const groomName = groom ?? wedding.groom_name;
  const year = wedding.wedding_date
    ? new Date(wedding.wedding_date).getFullYear().toString()
    : null;

  // Bagikan versi generik tanpa ?guest= — nama penerima tidak ikut terbocor.
  const handleShare = async () => {
    haptic(8);
    const genericUrl = `${window.location.origin}/`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Undangan Pernikahan",
          text: `${groomName.split(" ")[0]} & ${brideName.split(" ")[0]} — Kami mengundang Anda`,
          url: genericUrl,
        });
      } else {
        await navigator.clipboard.writeText(genericUrl);
        toast.success("Tautan undangan tersalin");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Gagal membagikan undangan");
    }
  };

  return (
    <section id="penutup" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center">
        {photo ? (
          <WeddingReveal>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] md:aspect-[21/9]">
              <Image
                src={photo}
                alt="Foto penutup"
                fill
                sizes="(min-width: 768px) 64rem, 100vw"
                className="wd-photo object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-7">
                <p className="wd-script text-[2.5rem] leading-tight text-white/90 md:text-[3.5rem]">
                  Terima Kasih
                </p>
              </div>
            </div>
          </WeddingReveal>
        ) : null}

        {footer.thank_you_message ? (
          <WeddingReveal delay={80}>
            <p className="max-w-[28rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[34rem] md:text-[14px]">
              {footer.thank_you_message}
            </p>
          </WeddingReveal>
        ) : null}

        <WeddingReveal delay={120}>
          <div className="flex flex-col items-center gap-3">
            <p className="wd-label">Kami Yang Berbahagia</p>
            <div className="flex flex-col items-center gap-1">
              <p className="wd-display text-[2.25rem] leading-tight md:text-[2.75rem]">
                {groomName}
              </p>
              <p
                aria-hidden
                className="wd-script -my-1 text-[2.25rem] leading-none text-[var(--wd-accent)]/80 md:text-[2.75rem]"
              >
                &amp;
              </p>
              <p className="wd-display text-[2.25rem] leading-tight md:text-[2.75rem]">
                {brideName}
              </p>
            </div>
            {year ? <p className="wd-label mt-2">{year}</p> : null}
          </div>
        </WeddingReveal>

        <WeddingReveal delay={160} className="w-full">
          <div className="flex flex-col items-center gap-4 border-t border-[var(--wd-line)] pt-7">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--wd-line-strong)] px-6 text-[12px] font-bold tracking-wide transition-all duration-200 hover:border-[var(--wd-accent-line)] active:scale-[0.97]"
            >
              <Share2 className="h-4 w-4 text-[var(--wd-accent)]" aria-hidden />
              Bagikan Undangan
            </button>
            {footer.social_links.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {footer.social_links.map((link, index) =>
                  Object.entries(link).map(([key, url]) => (
                    <a
                      key={`${key}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--wd-muted)] underline decoration-[var(--wd-line)] underline-offset-4 transition-colors duration-200 hover:text-[var(--wd-accent)] hover:decoration-[var(--wd-accent-line)]"
                    >
                      {key}
                    </a>
                  )),
                )}
              </div>
            ) : null}
            {footer.made_by_credit ? (
              <p className="text-[11px] tracking-wide text-[var(--wd-muted)]/60">
                {footer.made_by_credit}
              </p>
            ) : null}
          </div>
        </WeddingReveal>
      </div>
    </section>
  );
}
