import { useQuery } from "@tanstack/react-query";
import type { CoupleProfile, StoryItem } from "@wedding/shared";
import { AtSign } from "lucide-react";
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

/** Perkenalan mempelai dan linimasa cerita. Tidak tampil sama sekali bila admin belum mengisinya. */
export function InvitationSections() {
  const invitation = useQuery({
    queryKey: ["public", "invitation"],
    queryFn: publicApi.invitation,
    retry: false,
    staleTime: 60_000,
  });
  if (!invitation.data) return null;

  const { couple, story } = invitation.data;
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
    </>
  );
}
