import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  type CoupleProfile,
  type Faq,
  formatEventDate,
  formatTimeRange,
  type GalleryItem,
  type Gift,
  type InvitationResponse,
  type Live,
  SECTION_LABEL,
  type SectionKey,
  type StoryItem,
  type TicketEvent,
} from "@wedding/shared";
import {
  AtSign,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Radio,
  X,
} from "lucide-react";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { publicApi } from "../../lib/public-api.js";
import { GuestbookCard } from "./guestbook-card.js";
import { Barcode, BODY_COL, HEAD_COL, MagHead, MagPhoto } from "./mag.js";
import { WishlistSection } from "./wishlist-section.js";

function ProfileCard({
  profile,
  label,
  className = "",
}: {
  profile: CoupleProfile;
  label: string;
  className?: string;
}) {
  return (
    <article className={`flex flex-col ${className}`}>
      {profile.photo && (
        <MagPhoto photo={profile.photo} alt={`Foto ${profile.nickname ?? profile.fullName}`} />
      )}
      <h3
        className={`font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.82] font-medium tracking-[-0.05em] break-words ${
          profile.photo ? "mt-4" : ""
        }`}
      >
        {profile.fullName}
      </h3>
      <div className="mt-5 flex flex-col gap-3">
        <p className="tag text-ink-soft">{label}</p>
        {profile.parents && <p className="text-ink-soft">{profile.parents}</p>}
        {profile.bio && (
          <p className="max-w-prose break-words whitespace-pre-wrap">{profile.bio}</p>
        )}
        {profile.instagram && (
          <a
            href={`https://instagram.com/${profile.instagram}`}
            target="_blank"
            rel="noreferrer"
            className="tag inline-flex w-fit items-center gap-2 underline underline-offset-4"
          >
            <AtSign className="size-4" aria-hidden /> {profile.instagram}
          </a>
        )}
      </div>
    </article>
  );
}

/** Bab cerita: nomor besar, dan tiga tata letak foto yang bergantian supaya tidak monoton. */
function StoryChapter({ item, index }: { item: StoryItem; index: number }) {
  const number = String(index + 1).padStart(2, "0");
  const layout = index % 3;
  const heading = (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-7xl leading-[0.8] font-extrabold md:text-8xl">
          {number}
        </span>
        {item.whenLabel && <span className="tag">{item.whenLabel}</span>}
      </div>
      <h3 className="font-display text-3xl leading-none font-semibold tracking-h2 text-balance uppercase md:text-5xl">
        {item.title}
      </h3>
    </div>
  );
  const body = item.body && (
    <p
      className={`${item.body.length > 160 ? "drop " : ""}break-words whitespace-pre-wrap ${
        item.body.length > 600 ? "text-justify md:columns-2 md:gap-8" : "max-w-prose"
      }`}
    >
      {item.body}
    </p>
  );

  if (!item.photo) {
    return (
      <li className="grid gap-6 border-t border-ink/30 pt-6 md:grid-cols-12">
        <div className="md:col-span-5">{heading}</div>
        <div className="md:col-span-6 md:col-start-7">{body}</div>
      </li>
    );
  }

  if (layout === 0) {
    return (
      <li className="flex flex-col gap-8 border-t border-ink/30 pt-6">
        <div className="aspect-[4/3] md:aspect-[21/9]">
          <MagPhoto photo={item.photo} fill />
        </div>
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-5">{heading}</div>
          <div className="md:col-span-6 md:col-start-7">{body}</div>
        </div>
      </li>
    );
  }

  if (layout === 1) {
    return (
      <li className="grid gap-8 border-t border-ink/30 pt-6 md:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-6 md:pt-10">
          {heading}
          {item.body && (
            <p className="bg-ink p-6 font-display text-xl leading-snug break-words whitespace-pre-wrap text-paper italic md:p-8 md:text-2xl">
              {item.body}
            </p>
          )}
        </div>
        <div className="md:col-span-5 md:col-start-8">
          <div className="aspect-square rounded-full border-[10px] border-bone md:border-[14px]">
            <MagPhoto photo={item.photo} fill className="rounded-full" />
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="grid gap-8 border-t border-ink/30 pt-6 md:grid-cols-12">
      <div className="md:col-span-4 md:mt-20">
        <MagPhoto photo={item.photo} framed />
      </div>
      <div className="flex flex-col gap-6 md:col-span-7 md:col-start-6">
        {heading}
        {body}
      </div>
    </li>
  );
}

type Opener = (index: number) => void;

/** Satu foto galeri yang bisa diketuk untuk diperbesar; bentuk potongan diatur lewat className. */
function GalleryCell({
  item,
  index,
  open,
  className = "",
}: {
  item: GalleryItem;
  index: number;
  open: Opener;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <button
        type="button"
        className="mag-photo block size-full cursor-zoom-in overflow-hidden bg-bone-2"
        onClick={() => open(index)}
        aria-label={item.caption ?? `Buka foto ${index + 1}`}
      >
        <img
          src={item.photo.large}
          alt={item.caption ?? ""}
          width={item.photo.width}
          height={item.photo.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </button>
    </div>
  );
}

/** Empat foto membentuk satu lingkaran besar: setengah lingkaran di kiri, tiga petak di kanan. */
function CircleGrid({ items, start, open }: { items: GalleryItem[]; start: number; open: Opener }) {
  const [a, b, c, d] = items;
  if (!a || !b || !c || !d) return null;
  const captions = items.filter((item) => item.caption);
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
      <div className="grid aspect-square max-h-[88vh] grid-cols-2 grid-rows-3 gap-2 lg:col-span-7">
        <GalleryCell item={a} index={start} open={open} className="row-span-3 rounded-l-full" />
        <GalleryCell item={b} index={start + 1} open={open} className="rounded-tr-full" />
        <GalleryCell item={c} index={start + 2} open={open} />
        <GalleryCell item={d} index={start + 3} open={open} className="rounded-br-full" />
      </div>
      <div className="flex flex-col justify-between gap-8 lg:col-span-4 lg:col-start-9 lg:self-stretch">
        <p className="drop text-justify font-display text-lg leading-relaxed hyphens-auto">
          Potret-potret ini kami kumpulkan dari perjalanan panjang yang pelan-pelan membawa kami
          sampai di sini. Setiap gambar menyimpan cerita kecil, tentang tawa, perjalanan, dan
          hari-hari biasa yang ternyata paling kami rindukan.
        </p>
        {captions.length > 0 && (
          <ol className="flex flex-col gap-3">
            {items.map((item, index) =>
              item.caption ? (
                <li key={item.id} className="flex gap-3 border-t border-ink/30 pt-3">
                  <span className="tag text-ink-soft">{pad2(start + index + 1)}</span>
                  <span className="font-display text-xl leading-snug italic">{item.caption}</span>
                </li>
              ) : null,
            )}
          </ol>
        )}
      </div>
    </div>
  );
}

/** Foto besar dengan foto bulat bercincin yang menimpa sudutnya. */
function OverlapPair({
  items,
  start,
  open,
}: {
  items: GalleryItem[];
  start: number;
  open: Opener;
}) {
  const [a, b] = items;
  if (!a || !b) return null;
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="relative lg:col-span-9">
        <div className="aspect-[4/5] max-h-[90vh] w-[88%] lg:aspect-[5/6]">
          <GalleryCell item={a} index={start} open={open} className="size-full" />
        </div>
        <div className="absolute -top-4 right-0 z-10 aspect-square w-[44%] rounded-full border-[10px] border-bone md:border-[14px]">
          <GalleryCell item={b} index={start + 1} open={open} className="size-full rounded-full" />
        </div>
      </div>
      <div className="flex flex-col justify-end gap-4 lg:col-span-3">
        {[a, b].map(
          (item) =>
            item.caption && (
              <p
                key={item.id}
                className="border-t border-ink/30 pt-3 font-display text-xl leading-snug italic"
              >
                {item.caption}
              </p>
            ),
        )}
      </div>
    </div>
  );
}

/** Satu foto tinggi di kiri, dua foto bertumpuk di kanan. */
function TallTrio({ items, start, open }: { items: GalleryItem[]; start: number; open: Opener }) {
  const [a, b, c] = items;
  if (!a || !b || !c) return null;
  return (
    <div className="grid gap-2 md:gap-3 lg:grid-cols-12">
      <div className="aspect-[3/4] lg:col-span-7">
        <GalleryCell item={a} index={start} open={open} className="size-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3 lg:col-span-5 lg:grid-cols-1 lg:grid-rows-[3fr_2fr]">
        <div className="aspect-square lg:aspect-auto">
          <GalleryCell
            item={b}
            index={start + 1}
            open={open}
            className="size-full rounded-t-full"
          />
        </div>
        <div className="aspect-square lg:aspect-auto">
          <GalleryCell item={c} index={start + 2} open={open} className="size-full" />
        </div>
      </div>
    </div>
  );
}

/** Foto tunggal selebar halaman, untuk sisa yang tidak membentuk kelompok. */
function Wide({ item, index, open }: { item: GalleryItem; index: number; open: Opener }) {
  return (
    <div className="aspect-[16/9]">
      <GalleryCell item={item} index={index} open={open} className="size-full" />
    </div>
  );
}

/** Membagi foto menjadi kelompok bergantian: lingkaran (4), bertimpa (2), trio (3), lalu ulang. */
function collage(items: GalleryItem[]) {
  const order = [4, 2, 3] as const;
  const groups: { size: 1 | 2 | 3 | 4; start: number }[] = [];
  let start = 0;
  for (let turn = 0; start < items.length; turn++) {
    const remaining = items.length - start;
    const want = order[turn % order.length] ?? 4;
    const size = (remaining >= want ? want : remaining) as 1 | 2 | 3 | 4;
    groups.push({ size, start });
    start += size;
  }
  return groups;
}

function Gallery({ items, folio }: { items: GalleryItem[]; folio: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open !== null && !el.open) el.showModal();
    if (open === null && el.open) el.close();
  }, [open]);

  const current = open === null ? null : items[open];
  const step = (delta: number) =>
    setOpen((index) => (index === null ? null : (index + delta + items.length) % items.length));
  const navButton =
    "tag grid size-12 place-items-center border border-paper text-paper hover:bg-paper hover:text-ink";

  return (
    <section id="galeri" aria-label="Galeri" className="flex scroll-mt-16 flex-col gap-10">
      <MagHead
        folio={folio}
        title={SECTION_LABEL.galeri}
        kicker="Potret-potret yang kami simpan. Arahkan kursor atau ketuk foto untuk melihat warnanya."
      />
      <div className="flex flex-col gap-14 md:gap-24">
        {collage(items).map(({ size, start }) => {
          const group = items.slice(start, start + size);
          const props = { items: group, start, open: setOpen };
          if (size === 4) return <CircleGrid key={start} {...props} />;
          if (size === 2) return <OverlapPair key={start} {...props} />;
          if (size === 3) return <TallTrio key={start} {...props} />;
          const only = group[0];
          return only ? <Wide key={start} item={only} index={start} open={setOpen} /> : null;
        })}
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
        className="m-auto max-h-dvh w-full max-w-5xl bg-transparent p-3 backdrop:bg-ink/90"
        aria-label="Foto galeri"
      >
        {current && (
          <figure className="flex flex-col gap-3">
            <img
              src={current.photo.large}
              alt={current.caption ?? ""}
              className="mx-auto max-h-[78dvh] w-auto max-w-full bg-paper object-contain"
            />
            {current.caption && (
              <figcaption className="text-center font-display text-xl text-paper italic">
                {current.caption}
              </figcaption>
            )}
          </figure>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Foto sebelumnya"
            className={navButton}
            onClick={() => step(-1)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Tutup"
            className={navButton}
            onClick={() => setOpen(null)}
          >
            <X className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Foto berikutnya"
            className={navButton}
            onClick={() => step(1)}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </dialog>
    </section>
  );
}

function GiftRow({ gift }: { gift: Gift }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(gift.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Tanpa izin clipboard, nomor tetap terlihat dan bisa disalin manual.
    }
  }

  return (
    <li className="grid gap-x-8 gap-y-2 border-b border-ink/30 py-6 md:grid-cols-[11rem_1fr_auto] md:items-baseline">
      <p className="font-display text-3xl leading-none italic">{gift.provider}</p>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-display text-4xl leading-none tracking-tight break-all select-all md:text-6xl">
          {gift.accountNumber}
        </p>
        <p className="tag text-ink-soft">a.n. {gift.accountName}</p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className="tag inline-flex w-fit items-center gap-2 underline underline-offset-4 max-md:min-h-11"
      >
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
        {copied ? "Tersalin" : "Salin nomor"}
      </button>
      {gift.qr && (
        <a
          href={gift.qr.large}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block w-fit md:col-start-2"
        >
          <img
            src={gift.qr.large}
            alt={`QR ${gift.provider}`}
            width={gift.qr.width}
            height={gift.qr.height}
            loading="lazy"
            decoding="async"
            className="h-auto w-44 max-w-full bg-white p-2"
          />
        </a>
      )}
    </li>
  );
}

function Gifts({ gifts, folio }: { gifts: Gift[]; folio: string }) {
  return (
    <section id="amplop" aria-label="Amplop digital" className="flex scroll-mt-16 flex-col gap-10">
      <MagHead
        folio={folio}
        title={SECTION_LABEL.amplop}
        kicker="Berbagi kebahagiaan, dengan cara yang paling mudah."
      />
      <div className="grid gap-10 lg:grid-cols-12">
        <p className="drop text-justify font-display text-lg leading-relaxed hyphens-auto lg:col-span-4">
          Doa restu dan kehadiran Anda adalah hadiah terbaik bagi kami. Namun bila Anda ingin
          berbagi kebahagiaan lebih jauh, kami menyediakan amplop digital berikut. Setiap bentuk
          perhatian akan kami kenang dengan penuh rasa syukur, dan kami berharap bisa membalasnya
          dengan kebaikan yang sama.
        </p>
        <ul className="flex flex-col border-t border-ink/30 lg:col-span-8">
          {gifts.map((gift) => (
            <GiftRow key={gift.id} gift={gift} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Faqs({ faqs, folio }: { faqs: Faq[]; folio: string }) {
  return (
    <section id="faq" aria-label="Tanya jawab" className="flex scroll-mt-16 flex-col gap-8">
      <MagHead
        folio={folio}
        title={SECTION_LABEL.faq}
        kicker="Hal-hal yang sering ditanyakan tamu."
        className={HEAD_COL}
      />
      <div className={`flex flex-col border-t border-ink/30 ${BODY_COL}`}>
        {faqs.map((faq) => (
          <details key={faq.id} className="group border-b border-ink/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl marker:hidden">
              {faq.question}
              <span aria-hidden className="tag transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-prose pb-6 break-words whitespace-pre-wrap text-ink-soft">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

export const invitationQuery = queryOptions({
  queryKey: ["public", "invitation"],
  queryFn: () => publicApi.invitation(),
  retry: false,
  staleTime: 60_000,
});

function LiveCard({ live }: { live: Live }) {
  return (
    <section
      aria-label="Siaran langsung"
      className="flex flex-col gap-6 bg-ink p-6 text-paper md:flex-row md:items-end md:justify-between md:p-12"
    >
      <div className="flex flex-col gap-3">
        <p className="tag flex items-center gap-2 text-paper/70">
          <Radio className="size-4" aria-hidden /> Siaran langsung
        </p>
        <p className="font-display text-4xl leading-none font-semibold uppercase md:text-6xl">
          Tidak bisa hadir?
        </p>
        <p className="max-w-md text-paper/80">Ikuti acaranya dari mana saja.</p>
        {live.note && <p className="font-semibold break-words">{live.note}</p>}
      </div>
      <a
        href={live.url}
        target="_blank"
        rel="noreferrer"
        className="tag inline-flex w-fit items-center gap-2 bg-paper px-6 py-4 text-ink hover:bg-bone-2"
      >
        Tonton siaran <ExternalLink className="size-4" aria-hidden />
      </a>
    </section>
  );
}

/** Bagian yang benar-benar tampil, berurutan, dengan nomor halaman (01 sampul, 02 acara, lalu ini). */
function contentSections(data: InvitationResponse) {
  const has: Record<SectionKey, boolean> = {
    mempelai: !!data.couple.bride || !!data.couple.groom,
    siaran: false, // pita siaran langsung tidak diberi nomor halaman
    cerita: data.story.length > 0,
    galeri: data.gallery.length > 0,
    amplop: data.gifts.length > 0,
    wishlist: data.wishes.length > 0,
    faq: data.faqs.length > 0,
    ucapan: true,
  };
  return data.sections.filter((section) => section.visible && has[section.key]);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Hari, bulan, dan tahun (dua digit) di zona WIB, untuk angka besar di sampul. */
function dateParts(iso: string) {
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).formatToParts(new Date(iso));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return [pick("day"), pick("month"), pick("year")];
}

/** Sampul ala majalah: masthead nama, foto atau kutipan di tengah, daftar isi dan ringkasan acara di tepi. */
export function InvitationCover({
  names,
  guestName,
  code,
  events,
}: {
  names: string[];
  guestName: string;
  code: string;
  events: TicketEvent[];
}) {
  const invitation = useQuery(invitationQuery);
  const data = invitation.data;
  const cover = data?.cover;
  const eventDate = data?.eventDate;
  const numerals = eventDate ? dateParts(eventDate) : [];
  const contents = data ? contentSections(data) : [];
  const toc = [
    ...(events.length > 0 ? [{ id: "acara", title: "Acara" }] : []),
    ...contents.map((section) => ({ id: section.key, title: SECTION_LABEL[section.key] })),
  ];
  const quote =
    cover?.greeting ??
    "Dengan penuh syukur, kami mengundang Anda berbagi kebahagiaan di hari pernikahan kami.";

  return (
    <section className="border-b border-ink/30">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-5 py-6 md:px-10 lg:px-16 lg:py-8">
        <div className="tag grid grid-cols-[1fr_auto_1fr] items-center border-y border-ink/40 py-2.5">
          <span>Undangan pernikahan</span>
          <span className="border-x border-ink/40 px-4 text-center">Edisi istimewa</span>
          <span className="text-right">{eventDate ? formatEventDate(eventDate) : ""}</span>
        </div>

        <h1 className="text-center font-display text-[clamp(4rem,21vw,7rem)] leading-[0.82] font-semibold tracking-h1 break-words uppercase md:text-[min(10.5vw,9.4rem)]">
          {names[0]}
          {names[1] && (
            <>
              <span className="mx-[0.12em] font-normal italic md:inline"> &amp; </span>
              {names[1]}
            </>
          )}
        </h1>

        <div className="grid gap-8 border-t border-ink/30 pt-6 lg:grid-cols-12">
          <div className="order-2 flex flex-col gap-6 lg:order-1 lg:col-span-3">
            <div className="bg-bone-2 p-5">
              <p className="tag text-ink-soft">Kepada Yth.</p>
              <p className="mt-2 font-display text-3xl leading-tight font-medium break-words">
                {guestName}
              </p>
              <p className="mt-3 text-sm text-ink-soft">
                Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir dan memberi doa
                restu.
              </p>
            </div>
            {toc.length > 0 && (
              <nav aria-label="Dalam edisi ini">
                <p className="tag mb-2 text-ink-soft">Dalam edisi ini</p>
                <ol className="flex flex-col border-t border-ink/30">
                  {toc.map((item, index) => (
                    <li key={item.id} className="border-b border-ink/20">
                      <a
                        href={`#${item.id}`}
                        className="flex items-baseline justify-between gap-3 py-2 font-display text-lg hover:italic"
                      >
                        <span>{item.title}</span>
                        <span className="tag text-ink-soft">{pad2(index + 2)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>

          <div className="order-1 lg:order-2 lg:col-span-6">
            {cover?.photo ? (
              <MagPhoto photo={cover.photo} alt="Foto sampul" eager />
            ) : (
              <div className="flex h-full flex-col justify-center gap-6 border-x border-ink/20 px-6 py-8 text-center">
                <p className="tag text-ink-soft">Kata pembuka</p>
                <p className="font-display text-3xl leading-tight break-words whitespace-pre-wrap italic md:text-5xl">
                  “{quote}”
                </p>
                <p className="tag text-ink-soft">{names.join(" & ")}</p>
              </div>
            )}
            {cover?.photo && cover.greeting && (
              <p className="mt-4 text-center font-display text-xl leading-snug break-words whitespace-pre-wrap italic">
                {cover.greeting}
              </p>
            )}
          </div>

          <div className="order-3 flex flex-col gap-6 lg:col-span-3">
            {numerals.length > 0 && (
              <p className="font-display text-7xl leading-[0.82] font-extrabold md:text-8xl lg:text-right">
                {(["hari", "bulan", "tahun"] as const).map((unit, index) => (
                  <span key={unit} className="block">
                    {numerals[index]}
                  </span>
                ))}
              </p>
            )}
            {events.length > 0 && (
              <ul className="flex flex-col border-t border-ink/30">
                {events.map((event) => (
                  <li key={event.id} className="flex flex-col gap-0.5 border-b border-ink/20 py-3">
                    <p className="font-display text-xl leading-tight font-semibold">{event.name}</p>
                    {event.startsAt && event.endsAt && (
                      <p className="text-sm text-ink-soft">
                        {formatTimeRange(event.startsAt, event.endsAt)}
                      </p>
                    )}
                    {event.venueName && <p className="text-sm">{event.venueName}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 border-t border-ink/30 pt-4">
          <Barcode value={code} className="max-w-40 shrink-0" />
          <p className="tag min-w-0 flex-1 truncate text-ink-soft">
            Tiket {code} · Tunjukkan di pintu masuk
          </p>
        </div>
      </div>
    </section>
  );
}

function useCountdown(target: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!target) return null;
  const left = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  };
}

/** Hitung mundur dengan angka serif raksasa. Hilang bila acara sudah lewat. */
export function Countdown() {
  const invitation = useQuery(invitationQuery);
  const eventDate = invitation.data?.eventDate;
  const left = useCountdown(eventDate);
  if (!left || !eventDate || new Date(eventDate).getTime() < Date.now()) return null;

  const cells = [
    ["hari", left.days],
    ["jam", left.hours],
    ["menit", left.minutes],
    ["detik", left.seconds],
  ] as const;

  return (
    <section aria-label="Hitung mundur" className="flex flex-col gap-3">
      <p className="tag text-ink-soft">Menuju hari bahagia</p>
      <div className="grid grid-cols-2 border-y border-ink/40 md:grid-cols-4">
        {cells.map(([label, value], index) => (
          <div
            key={label}
            className={`flex flex-col gap-1 py-6 md:px-6 md:py-6 ${
              index > 0 ? "md:border-l md:border-ink/40" : ""
            } ${index % 2 === 1 ? "border-l border-ink/40 pl-5 md:pl-6" : ""}`}
          >
            <span className="font-display text-7xl leading-[0.85] font-medium tabular-nums md:text-[6vw] min-[1700px]:text-[6rem]">
              {String(value).padStart(2, "0")}
            </span>
            <span className="tag text-ink-soft">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Bagian-bagian undangan sesuai urutan dan tampilan yang diatur admin; yang kosong dilewati. */
export function InvitationSections({ code, guestName }: { code: string; guestName: string }) {
  const invitation = useQuery(invitationQuery);
  if (!invitation.data) return null;

  const { couple, story, gallery, gifts, faqs, wishes, sections, live } = invitation.data;
  const profiles = [
    couple.bride && { profile: couple.bride, label: "Mempelai wanita" },
    couple.groom && { profile: couple.groom, label: "Mempelai pria" },
  ].filter((entry): entry is { profile: CoupleProfile; label: string } => !!entry);

  // 01 sampul, 02 acara; bagian bernomor berikutnya dimulai dari 03.
  let page = 2;
  const folio = () => pad2(++page);

  const render: Record<SectionKey, () => ReactNode> = {
    mempelai: () =>
      profiles.length > 0 && (
        <section id="mempelai" aria-label="Mempelai" className="flex scroll-mt-16 flex-col gap-8">
          <MagHead
            folio={folio()}
            title={SECTION_LABEL.mempelai}
            kicker="Mengenal kedua mempelai dan keluarganya."
            className={HEAD_COL}
          />
          <div className={`grid gap-10 md:grid-cols-2 ${BODY_COL}`}>
            {profiles.map(({ profile, label }, index) => (
              <ProfileCard
                key={profile.role}
                profile={profile}
                label={label}
                className={index === 1 ? "md:mt-20" : ""}
              />
            ))}
          </div>
        </section>
      ),
    siaran: () => live && <LiveCard live={live} />,
    cerita: () =>
      story.length > 0 && (
        <section id="cerita" aria-label="Cerita kami" className="flex scroll-mt-16 flex-col gap-8">
          <MagHead
            folio={folio()}
            title={SECTION_LABEL.cerita}
            kicker="Perjalanan kami, dari awal bertemu sampai hari ini."
            className={HEAD_COL}
          />
          <ol className={`flex flex-col gap-14 md:gap-20 ${BODY_COL}`}>
            {story.map((item, index) => (
              <StoryChapter key={item.id} item={item} index={index} />
            ))}
          </ol>
        </section>
      ),
    galeri: () => gallery.length > 0 && <Gallery items={gallery} folio={folio()} />,
    amplop: () => gifts.length > 0 && <Gifts gifts={gifts} folio={folio()} />,
    wishlist: () =>
      wishes.length > 0 && <WishlistSection wishes={wishes} code={code} folio={folio()} />,
    faq: () => faqs.length > 0 && <Faqs faqs={faqs} folio={folio()} />,
    ucapan: () => <GuestbookCard code={code} defaultName={guestName} folio={folio()} />,
  };

  return (
    <>
      {sections
        .filter((section) => section.visible)
        .map((section) => (
          <Fragment key={section.key}>{render[section.key]()}</Fragment>
        ))}
    </>
  );
}
