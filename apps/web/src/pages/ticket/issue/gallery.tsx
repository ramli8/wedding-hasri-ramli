import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ISSUE } from "./content.js";
import { picSrc, Scene } from "./parts.js";

/**
 * Cuplikan: galeri sebagai gulungan film yang digeser ke samping, lengkap dengan lubang sproket dan
 * nomor bingkai. Ketuk satu bingkai untuk membukanya di layar penuh.
 */
export function Cuplikan() {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const items = ISSUE.gallery;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open !== null && !el.open) el.showModal();
    if (open === null && el.open) el.close();
  }, [open]);

  const current = open === null ? null : items[open];
  const step = (delta: number) =>
    setOpen((index) => (index === null ? null : (index + delta + items.length) % items.length));
  const nav =
    "grid size-12 place-items-center border border-screen/60 text-screen hover:bg-screen hover:text-reel";

  return (
    <Scene id="cuplikan" label="Cuplikan" title="Potongan adegan" tone="reel">
      <p className="tag -mt-6 mb-8 text-screen/60">Geser untuk melihat · ketuk untuk memperbesar</p>
      <div className="-mx-5 bg-reel-2 md:-mx-10">
        <div aria-hidden className="sprockets" />
        <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-3 [scrollbar-width:none] md:px-10">
          {items.map((item, index) => (
            <li key={item.cap} className="w-[72vw] max-w-sm shrink-0 snap-center md:w-80">
              <button
                type="button"
                onClick={() => setOpen(index)}
                aria-label={`Buka foto: ${item.cap}`}
                className="block w-full cursor-zoom-in text-left"
              >
                <span
                  className={`${index % 3 === 1 ? "bw" : "warm"} block aspect-[4/5] overflow-hidden`}
                >
                  <img
                    src={picSrc(item.pic)}
                    alt={item.cap}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                </span>
                <span className="tag mt-2 flex justify-between gap-3 text-screen/60">
                  <span className="truncate">{item.cap}</span>
                  <span className="text-ember">{String(index + 1).padStart(2, "0")}A</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div aria-hidden className="sprockets" />
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setOpen(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
        className="m-auto max-h-dvh w-full max-w-3xl bg-transparent p-3 backdrop:bg-reel/95"
        aria-label="Foto galeri"
      >
        {current && (
          <figure className="flex flex-col gap-3">
            <img
              src={picSrc(current.pic)}
              alt={current.cap}
              className="mx-auto max-h-[74dvh] w-auto max-w-full object-contain"
            />
            <figcaption className="tag text-center text-screen">{current.cap}</figcaption>
          </figure>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Foto sebelumnya"
            className={nav}
            onClick={() => step(-1)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button type="button" aria-label="Tutup" className={nav} onClick={() => setOpen(null)}>
            <X className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Foto berikutnya"
            className={nav}
            onClick={() => step(1)}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </dialog>
    </Scene>
  );
}
