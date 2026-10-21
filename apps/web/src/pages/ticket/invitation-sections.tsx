import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  type CoupleProfile,
  type Faq,
  formatEventDate,
  type GalleryItem,
  type Gift,
  type SectionKey,
  type StoryItem,
} from "@wedding/shared";
import { AtSign, Check, ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { Badge } from "../../components/ui/badge.js";
import { Card } from "../../components/ui/card.js";
import { publicApi } from "../../lib/public-api.js";
import { GuestbookCard } from "./guestbook-card.js";
import { WishlistSection } from "./wishlist-section.js";

function ProfileCard({ profile, label }: { profile: CoupleProfile; label: string }) {
  return (
    <Card className="flex flex-col gap-4 p-0">
      {profile.photo && (
        <img
          src={profile.photo.large}
          alt={`Foto ${profile.nickname ?? profile.fullName}`}
          width={profile.photo.width}
          height={profile.photo.height}
          loading="lazy"
          decoding="async"
          className="h-auto w-full border-b-2 border-ink"
        />
      )}
      <div className="flex flex-col gap-2 px-5 pb-5 text-center">
        <p className="tag text-ink-soft">{label}</p>
        <h3 className="font-display text-2xl leading-tight font-bold tracking-h2 uppercase">
          {profile.fullName}
        </h3>
        {profile.parents && <p className="text-sm text-ink-soft">{profile.parents}</p>}
        {profile.bio && <p className="break-words whitespace-pre-wrap">{profile.bio}</p>}
        {profile.instagram && (
          <a
            href={`https://instagram.com/${profile.instagram}`}
            target="_blank"
            rel="noreferrer"
            className="mx-auto inline-flex items-center gap-2 border-2 border-ink bg-paper px-3 py-1.5 text-sm font-semibold hover:bg-acid"
          >
            <AtSign className="size-4" aria-hidden /> {profile.instagram}
          </a>
        )}
      </div>
    </Card>
  );
}

function StoryCard({ item }: { item: StoryItem }) {
  return (
    <li className="flex flex-col gap-3 border-l-[3px] border-ink pl-4">
      {item.whenLabel && (
        <Badge variant="tag" className="w-fit">
          {item.whenLabel}
        </Badge>
      )}
      <h3 className="font-display text-xl leading-tight font-bold tracking-h3">{item.title}</h3>
      {item.body && <p className="break-words whitespace-pre-wrap">{item.body}</p>}
      {item.photo && (
        <img
          src={item.photo.large}
          alt=""
          width={item.photo.width}
          height={item.photo.height}
          loading="lazy"
          decoding="async"
          className="h-auto w-full border-2 border-ink"
        />
      )}
    </li>
  );
}

function Gallery({ items }: { items: GalleryItem[] }) {
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

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Galeri</h2>
      <ul className="grid grid-cols-3 gap-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className="block w-full border-2 border-ink hover:bg-acid"
              onClick={() => setOpen(index)}
              aria-label={item.caption ?? `Buka foto ${index + 1}`}
            >
              <img
                src={item.photo.thumb}
                alt={item.caption ?? ""}
                width={item.photo.width}
                height={item.photo.height}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

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
        className="m-auto max-h-dvh w-full max-w-4xl bg-transparent p-3 backdrop:bg-ink/80"
        aria-label="Foto galeri"
      >
        {current && (
          <figure className="flex flex-col gap-2">
            <img
              src={current.photo.large}
              alt={current.caption ?? ""}
              className="mx-auto max-h-[80dvh] w-auto max-w-full border-2 border-ink bg-paper object-contain"
            />
            {current.caption && (
              <figcaption className="bg-paper px-3 py-2 text-center text-sm">
                {current.caption}
              </figcaption>
            )}
          </figure>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Foto sebelumnya"
            className="grid size-11 place-items-center border-2 border-ink bg-paper hover:bg-acid"
            onClick={() => step(-1)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Tutup"
            className="grid size-11 place-items-center border-2 border-ink bg-paper hover:bg-acid"
            onClick={() => setOpen(null)}
          >
            <X className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Foto berikutnya"
            className="grid size-11 place-items-center border-2 border-ink bg-paper hover:bg-acid"
            onClick={() => step(1)}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </dialog>
    </Card>
  );
}

function GiftCard({ gift }: { gift: Gift }) {
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
    <li className="flex flex-col gap-2 border-2 border-ink bg-bone p-4">
      <p className="font-display text-lg font-bold">{gift.provider}</p>
      <p className="font-mono text-xl break-all select-all">{gift.accountNumber}</p>
      <p className="text-sm text-ink-soft">a.n. {gift.accountName}</p>
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-paper px-3 py-1.5 text-sm font-semibold hover:bg-acid"
      >
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
        {copied ? "Tersalin" : "Salin nomor"}
      </button>
      {gift.qr && (
        <a href={gift.qr.large} target="_blank" rel="noreferrer" className="mt-1 block w-fit">
          <img
            src={gift.qr.large}
            alt={`QR ${gift.provider}`}
            width={gift.qr.width}
            height={gift.qr.height}
            loading="lazy"
            decoding="async"
            className="h-auto w-48 max-w-full border-2 border-ink bg-paper"
          />
        </a>
      )}
    </li>
  );
}

function Gifts({ gifts }: { gifts: Gift[] }) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Amplop digital</h2>
      <p className="text-sm text-ink-soft">
        Doa restu Anda sudah sangat berarti. Bila ingin berbagi kebahagiaan, Anda dapat mengirimnya
        melalui:
      </p>
      <ul className="flex flex-col gap-3">
        {gifts.map((gift) => (
          <GiftCard key={gift.id} gift={gift} />
        ))}
      </ul>
    </Card>
  );
}

function Faqs({ faqs }: { faqs: Faq[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Tanya jawab</h2>
      <div className="flex flex-col gap-2">
        {faqs.map((faq) => (
          <details key={faq.id} className="group border-2 border-ink bg-bone">
            <summary className="cursor-pointer list-none px-4 py-3 font-semibold marker:hidden group-open:bg-acid">
              {faq.question}
            </summary>
            <p className="px-4 py-3 break-words whitespace-pre-wrap">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Card>
  );
}

/** Perkenalan mempelai dan linimasa cerita. Tidak tampil sama sekali bila admin belum mengisinya. */

export const invitationQuery = queryOptions({
  queryKey: ["public", "invitation"],
  queryFn: () => publicApi.invitation(),
  retry: false,
  staleTime: 60_000,
});

/** Sampul di atas halaman: foto, nama mempelai (dari header), tanggal acara, dan kalimat pembuka. */
export function InvitationCover() {
  const invitation = useQuery(invitationQuery);
  if (!invitation.data) return null;
  const { cover, eventDate } = invitation.data;
  if (!cover.photo && !cover.greeting && !eventDate) return null;

  return (
    <Card className="flex flex-col gap-4 p-0 text-center">
      {cover.photo && (
        <img
          src={cover.photo.large}
          alt="Foto sampul"
          width={cover.photo.width}
          height={cover.photo.height}
          decoding="async"
          className="h-auto w-full border-b-2 border-ink"
        />
      )}
      <div className="flex flex-col gap-3 px-5 pb-5">
        {eventDate && (
          <p className="font-display text-xl font-bold tracking-h2 uppercase">
            {formatEventDate(eventDate)}
          </p>
        )}
        {cover.greeting && <p className="break-words whitespace-pre-wrap">{cover.greeting}</p>}
      </div>
    </Card>
  );
}

/** Bagian-bagian undangan sesuai urutan dan tampilan yang diatur admin; yang kosong dilewati. */
export function InvitationSections({ code, guestName }: { code: string; guestName: string }) {
  const invitation = useQuery(invitationQuery);
  if (!invitation.data) return null;

  const { couple, story, gallery, gifts, faqs, wishes, sections } = invitation.data;
  const profiles = [
    couple.bride && { profile: couple.bride, label: "Mempelai wanita" },
    couple.groom && { profile: couple.groom, label: "Mempelai pria" },
  ].filter((entry): entry is { profile: CoupleProfile; label: string } => !!entry);

  const render: Record<SectionKey, () => ReactNode> = {
    mempelai: () =>
      profiles.length > 0 && (
        <section aria-label="Mempelai" className="flex flex-col gap-5">
          {profiles.map(({ profile, label }) => (
            <ProfileCard key={profile.role} profile={profile} label={label} />
          ))}
        </section>
      ),
    cerita: () =>
      story.length > 0 && (
        <Card className="flex flex-col gap-6">
          <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Cerita kami</h2>
          <ol className="flex flex-col gap-8">
            {story.map((item) => (
              <StoryCard key={item.id} item={item} />
            ))}
          </ol>
        </Card>
      ),
    galeri: () => gallery.length > 0 && <Gallery items={gallery} />,
    amplop: () => gifts.length > 0 && <Gifts gifts={gifts} />,
    wishlist: () => wishes.length > 0 && <WishlistSection wishes={wishes} code={code} />,
    faq: () => faqs.length > 0 && <Faqs faqs={faqs} />,
    ucapan: () => <GuestbookCard code={code} defaultName={guestName} />,
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
