import type { ReactNode } from "react";
import type { Pic } from "./content.js";
import { photo, photoFocus } from "./photos.js";

export const picSrc = (pic: Pic) => photo(pic);

/** Lebar isi satu bagian. */
export const WRAP = "mx-auto w-full max-w-6xl px-5 md:px-10";

/**
 * Satu bagian film: label bergaya naskah (Courier), judul huruf poster, lalu isi. `tone` memilih
 * layar gelap (`reel`) atau kertas program bioskop yang terang (`sand`); keduanya berselang.
 */
export function Scene({
  id,
  label,
  title,
  tone,
  center = false,
  children,
}: {
  id: string;
  label: string;
  title: ReactNode;
  tone: "reel" | "sand";
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${tone} scroll-mt-0 py-20 md:py-28`}>
      <div className={WRAP}>
        <header
          className={`mb-10 flex flex-col gap-3 md:mb-14 ${center ? "items-center text-center" : ""}`}
        >
          <p className="tag text-ember">{label}</p>
          <h2 className="poster-font text-[clamp(3.5rem,14vw,8rem)] leading-[0.86] text-balance">
            {title}
          </h2>
        </header>
        {children}
      </div>
    </section>
  );
}

/** Foto polos tanpa bingkai. `look` memilih hitam putih (poster) atau hangat (adegan). */
export function Photo({
  pic,
  alt,
  ratio = "aspect-[4/5]",
  look = "warm",
  className = "",
}: {
  pic: Pic;
  alt: string;
  ratio?: string;
  look?: "bw" | "warm";
  className?: string;
}) {
  return (
    <div className={`${look} ${ratio} overflow-hidden bg-reel-2 ${className}`}>
      <img
        src={picSrc(pic)}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
        style={{ objectPosition: photoFocus(pic) }}
      />
    </div>
  );
}

/** Tombol utama: bidang aksen senja. */
export const PRIMARY =
  "tag inline-flex min-h-12 items-center justify-center gap-2 bg-ember px-7 text-screen transition-colors hover:bg-umber disabled:opacity-40";

/** Tombol garis untuk aksi sekunder; warnanya mengikuti teks bagian (gelap atau terang). */
export const OUTLINE =
  "tag inline-flex min-h-11 items-center justify-center gap-2 border border-current px-4 transition-opacity hover:opacity-70";
