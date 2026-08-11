"use client";

import Image from "next/image";
import { invitationContent } from "@/src/domain/services/invitation-content";
import { Reveal } from "@/src/lib/invitation/reveal";
import { useParallax } from "@/src/lib/invitation/use-parallax";

type MempelaiCardProps = {
  nama: string;
  label: string;
  gelar: string | null;
  ig: string | null;
  foto: string | null;
  monogram: string;
  delay: number;
};

function MempelaiCard({
  nama,
  label,
  gelar,
  ig,
  foto,
  monogram,
  delay,
}: MempelaiCardProps) {
  const parallaxRef = useParallax<HTMLDivElement>({ factor: 0.07 });

  return (
    <Reveal delay={delay} className="w-full">
      <figure className="inv-card">
        <div className="inv-card-photo">
          {foto ? (
            <div ref={parallaxRef} className="absolute inset-0">
              <Image
                src={foto}
                alt={nama}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="inv-card-img object-cover scale-[1.15]"
              />
            </div>
          ) : (
            <span className="inv-card-mono flex h-full w-full items-center justify-center text-7xl">
              {monogram}
            </span>
          )}
        </div>
        <figcaption className="px-2 pt-6 text-center">
          <p className="inv-display text-3xl sm:text-4xl">{nama}</p>
          <p className="inv-eyebrow inv-card-label mt-3">{label}</p>
          {gelar && <p className="inv-label mt-2">{gelar}</p>}
          {ig && (
            <a
              href={`https://instagram.com/${ig.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inv-eyebrow mt-4 inline-block text-[11px] text-[var(--inv-accent)] underline decoration-[var(--inv-accent)]/40 underline-offset-4 transition-colors hover:decoration-[var(--inv-accent)]"
            >
              {ig}
            </a>
          )}
        </figcaption>
      </figure>
    </Reveal>
  );
}

export function Mempelai() {
  const { mempelai } = invitationContent;

  return (
    <section
      id="mempelai"
      className="inv-section inv-hairline-b relative flex min-h-dvh items-center justify-center border-b px-6 py-28"
    >
      <div className="w-full max-w-4xl">
        <Reveal className="text-center">
          <p className="inv-eyebrow">The Couple</p>
          <h2 className="inv-display mt-4 text-4xl sm:text-5xl">Mempelai</h2>
        </Reveal>

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-10">
          <MempelaiCard
            nama={mempelai.wanita.nama}
            label="Mempelai Wanita"
            gelar={mempelai.wanita.gelar}
            ig={mempelai.wanita.ig}
            foto={mempelai.fotoWanita}
            monogram="H"
            delay={0}
          />
          <MempelaiCard
            nama={mempelai.pria.nama}
            label="Mempelai Pria"
            gelar={mempelai.pria.gelar}
            ig={mempelai.pria.ig}
            foto={mempelai.fotoPria}
            monogram="R"
            delay={150}
          />
        </div>
      </div>
    </section>
  );
}
