import { type ReactNode, useState } from "react";
import type { Pic } from "./content.js";
import { photo } from "./photos.js";

export const picSrc = (pic: Pic) => photo(pic.kind, pic.tone);

/** Lebar isi satu lembar: penuh layar dengan batas nyaman di monitor sangat lebar. */
export const SHEET_INNER = "mx-auto w-full max-w-[1920px] px-5 md:px-12 xl:px-20";

/** Satu lembar halaman selebar layar: kepala berjalan bergaya majalah, nomor halaman, dan isi. */
export function Sheet({
  id,
  page,
  children,
  className = "",
}: {
  id: string;
  page: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`sheet w-full scroll-mt-0 pt-5 pb-16 md:pb-24 ${className}`}>
      <div className={SHEET_INNER}>
        <div className="tag flex items-center justify-between gap-4 border-b-[3px] border-double border-ink/60 pb-2 text-ink-soft">
          <span className="truncate">Hasri &amp; Ramli · Edisi pernikahan</span>
          <span>Hal. {page}</span>
        </div>
        <div className="pt-10 md:pt-14">{children}</div>
      </div>
    </section>
  );
}

/** Judul rubrik: kata pertama hitam tebal, sisanya miring tipis, lalu keterangan. */
export function IssueHead({
  eyebrow,
  title,
  deck,
}: {
  eyebrow: string;
  title: string;
  deck?: string;
}) {
  const [first, ...rest] = title.split(" ");
  return (
    <header className="mb-10 flex flex-col gap-4 md:mb-14">
      <p className="tag text-stamp">{eyebrow}</p>
      <h2 className="font-display text-[clamp(3rem,8.5vw,7.5rem)] leading-[0.82] font-black tracking-[-0.045em] text-balance">
        {first}
        {rest.length > 0 && <em className="font-normal tracking-[-0.03em]"> {rest.join(" ")}</em>}
      </h2>
      {deck && (
        <p className="max-w-xl font-display text-xl leading-snug text-ink-soft italic">{deck}</p>
      )}
    </header>
  );
}

export const Stamp = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <span className={`stamp ${className}`}>{children}</span>;

type Strip = { x: number; w: number; y: number; h: number };

/** Irisan tegak: satu foto dipotong jadi beberapa lajur setinggi berbeda dengan celah putih, gambarnya tetap menyambung. */
export const STRIPS_TALL: Strip[] = [
  { x: 0, w: 20, y: 9, h: 78 },
  { x: 22, w: 13, y: 28, h: 64 },
  { x: 37, w: 11, y: 2, h: 76 },
  { x: 50, w: 23, y: 12, h: 86 },
  { x: 75, w: 25, y: 34, h: 54 },
];
export const STRIPS_WIDE: Strip[] = [
  { x: 0, w: 12, y: 18, h: 70 },
  { x: 13.5, w: 9, y: 4, h: 60 },
  { x: 24, w: 16, y: 28, h: 68 },
  { x: 41.5, w: 10, y: 0, h: 82 },
  { x: 53, w: 19, y: 16, h: 76 },
  { x: 73.5, w: 10, y: 38, h: 54 },
  { x: 85, w: 15, y: 6, h: 68 },
];

export function SlicedPhoto({
  pic,
  alt = "",
  ratio = "aspect-[4/5]",
  strips = STRIPS_TALL,
  onOpen,
}: {
  pic: Pic;
  alt?: string;
  ratio?: string;
  strips?: Strip[];
  onOpen?: () => void;
}) {
  const [color, setColor] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={color}
      aria-label={alt ? `${alt} (ketuk untuk membuka)` : "Ketuk untuk warna"}
      onClick={onOpen ?? (() => setColor((value) => !value))}
      className={`mag-photo relative block w-full ${ratio} ${onOpen ? "cursor-zoom-in" : "cursor-pointer"}`}
    >
      {strips.map((strip) => (
        <span
          key={strip.x}
          className="absolute overflow-hidden bg-bone-2"
          style={{
            left: `${strip.x}%`,
            top: `${strip.y}%`,
            width: `${strip.w}%`,
            height: `${strip.h}%`,
          }}
        >
          <img
            src={picSrc(pic)}
            alt={strip.x === strips[0]?.x ? alt : ""}
            loading="lazy"
            decoding="async"
            className="absolute max-w-none object-cover"
            style={{
              left: `${(-strip.x / strip.w) * 100}%`,
              top: `${(-strip.y / strip.h) * 100}%`,
              width: `${(100 / strip.w) * 100}%`,
              height: `${(100 / strip.h) * 100}%`,
            }}
          />
        </span>
      ))}
    </button>
  );
}
