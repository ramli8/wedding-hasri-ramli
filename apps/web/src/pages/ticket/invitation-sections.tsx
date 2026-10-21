import { useQuery } from "@tanstack/react-query";
import type { CoupleProfile, GalleryItem, StoryItem } from "@wedding/shared";
import { AtSign, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/ui/badge.js";
import { Card } from "../../components/ui/card.js";
import { publicApi } from "../../lib/public-api.js";

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

/** Perkenalan mempelai dan linimasa cerita. Tidak tampil sama sekali bila admin belum mengisinya. */
export function InvitationSections() {
  const invitation = useQuery({
    queryKey: ["public", "invitation"],
    queryFn: publicApi.invitation,
    retry: false,
    staleTime: 60_000,
  });
  if (!invitation.data) return null;

  const { couple, story, gallery } = invitation.data;
  const profiles = [
    couple.bride && { profile: couple.bride, label: "Mempelai wanita" },
    couple.groom && { profile: couple.groom, label: "Mempelai pria" },
  ].filter((entry): entry is { profile: CoupleProfile; label: string } => !!entry);

  return (
    <>
      {profiles.length > 0 && (
        <section aria-label="Mempelai" className="flex flex-col gap-5">
          {profiles.map(({ profile, label }) => (
            <ProfileCard key={profile.role} profile={profile} label={label} />
          ))}
        </section>
      )}
      {story.length > 0 && (
        <Card className="flex flex-col gap-6">
          <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Cerita kami</h2>
          <ol className="flex flex-col gap-8">
            {story.map((item) => (
              <StoryCard key={item.id} item={item} />
            ))}
          </ol>
        </Card>
      )}
      {gallery.length > 0 && <Gallery items={gallery} />}
    </>
  );
}
