import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ISSUE, pageOf } from "./content.js";
import { TornPhoto } from "./frames.js";
import { IssueHead, picSrc, Sheet, SlicedPhoto, STRIPS_WIDE } from "./parts.js";

type Open = (index: number) => void;
type Item = (typeof ISSUE.gallery)[number];

/** Lembar kontak: semua foto sebagai bingkai kecil di rol film, dua di antaranya dilingkari spidol merah. */
function ContactSheet({ items, open }: { items: readonly Item[]; open: Open }) {
  const picks = new Map([
    [2, "pilih ini!"],
    [6, "untuk sampul?"],
  ]);
  return (
    <div className="bg-[#14100c] p-4 text-[#e6b34a] md:p-8">
      <div className="tag flex justify-between gap-4 pb-4">
        <span>Lembar kontak · Rol 07</span>
        <span>Film 400 · 36 frame</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-5 md:gap-x-6">
        {items.map((item, index) => (
          <li key={item.cap} className="relative">
            <button
              type="button"
              onClick={() => open(index)}
              aria-label={`Buka foto: ${item.cap}`}
              className="mag-photo block aspect-[3/2] w-full cursor-zoom-in overflow-hidden bg-bone-2"
            >
              <img
                src={picSrc(item.pic)}
                alt={item.cap}
                className="size-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
            <p className="tag mt-1 flex justify-between">
              <span>{index + 1}</span>
              <span>▸ {index + 1}A</span>
            </p>
            {picks.has(index) && (
              <>
                <svg
                  aria-hidden
                  viewBox="0 0 200 140"
                  fill="none"
                  className="pointer-events-none absolute -inset-3 size-[calc(100%+1.5rem)] overflow-visible text-[#e0372c]"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M24 74C16 24 150 6 184 56c18 48-110 82-152 40C14 80 22 66 44 54"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute -right-1 -bottom-8 -rotate-6 font-(family-name:--font-typewriter) text-sm text-[#e0372c]">
                  {picks.get(index)}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lima foto dikipas seperti kartu di tangan; arahkan kursor atau ketuk, kartu terangkat. */
function Fan({ items, start, open }: { items: Item[]; start: number; open: Open }) {
  return (
    <div className="relative mx-auto h-[22rem] w-full max-w-4xl md:h-[30rem]">
      {items.map((item, index) => {
        const pos = index - (items.length - 1) / 2;
        return (
          <button
            key={item.cap}
            type="button"
            onClick={() => open(start + index)}
            aria-label={`Buka foto: ${item.cap}`}
            className="fan-card absolute bottom-0 left-1/2 w-36 cursor-zoom-in bg-paper p-2 pb-9 md:w-60 md:p-3 md:pb-12"
            style={{ "--x": pos, "--r": pos * 9, zIndex: index } as CSSProperties}
          >
            <span className="mag-photo block aspect-[3/4] overflow-hidden bg-bone-2">
              <img
                src={picSrc(item.pic)}
                alt={item.cap}
                className="size-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="tag absolute inset-x-2 bottom-2 truncate text-center text-ink-soft md:bottom-3">
              {item.cap}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Tiga guntingan bertepi sobek, tingginya berbeda dan saling bergeser. */
function Scraps({ items, start, open }: { items: Item[]; start: number; open: Open }) {
  const specs = [
    { ratio: "aspect-[3/4]", tilt: "-rotate-2", lift: "" },
    { ratio: "aspect-[4/5]", tilt: "rotate-1", lift: "md:-mt-16" },
    { ratio: "aspect-[2/3]", tilt: "rotate-3", lift: "md:mt-10" },
  ];
  return (
    <div className="grid gap-12 md:grid-cols-3 md:gap-8">
      {items.map((item, index) => {
        const spec = specs[index % specs.length] ?? specs[0];
        if (!spec) return null;
        return (
          <button
            key={item.cap}
            type="button"
            onClick={() => open(start + index)}
            aria-label={`Buka foto: ${item.cap}`}
            className={`cursor-zoom-in text-left ${spec.lift}`}
          >
            <TornPhoto
              pic={item.pic}
              alt={item.cap}
              ratio={spec.ratio}
              seed={start + index + 2}
              className={spec.tilt}
            />
            <span className="tag mt-3 block text-ink-soft">
              {String(start + index + 1).padStart(2, "0")} · {item.cap}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Foto() {
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
    "tag grid size-12 place-items-center border border-paper text-paper hover:bg-paper hover:text-ink";
  const last = items[items.length - 1];

  return (
    <Sheet id="foto" page={pageOf("foto")}>
      <IssueHead
        eyebrow="Rubrik 06 · Esai foto"
        title="Esai foto"
        deck="Sepuluh potret dari album kami, dari lembar kontak sampai yang terpilih. Ketuk untuk memperbesar."
      />
      <div className="flex flex-col gap-20 md:gap-24">
        <ContactSheet items={items} open={setOpen} />
        <Fan items={items.slice(1, 6)} start={1} open={setOpen} />
        <Scraps items={items.slice(6, 9)} start={6} open={setOpen} />
        {last && (
          <figure>
            <SlicedPhoto
              pic={last.pic}
              alt={last.cap}
              ratio="aspect-[16/9]"
              strips={STRIPS_WIDE}
              onOpen={() => setOpen(items.length - 1)}
            />
            <figcaption className="tag mt-3 flex justify-between gap-4 text-ink-soft">
              <span>
                {String(items.length).padStart(2, "0")} · {last.cap}
              </span>
              <span>Foto diiris, ketuk untuk memperbesar</span>
            </figcaption>
          </figure>
        )}
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
        className="m-auto max-h-dvh w-full max-w-3xl bg-transparent p-3 backdrop:bg-ink/90"
        aria-label="Foto galeri"
      >
        {current && (
          <figure className="flex flex-col gap-3">
            <img
              src={picSrc(current.pic)}
              alt={current.cap}
              className="mx-auto max-h-[74dvh] w-auto max-w-full border-[10px] border-paper bg-paper object-contain"
            />
            <figcaption className="tag text-center text-paper">{current.cap}</figcaption>
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
    </Sheet>
  );
}
