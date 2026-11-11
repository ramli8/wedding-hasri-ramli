import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  renderSeoText,
  type Settings,
} from "@wedding/shared";
import { CheckCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
import { seoQuery, settingsQuery } from "../lib/queries.js";

type App = "whatsapp" | "instagram";

/**
 * Perkiraan tampilan pesan undangan di WhatsApp dan Instagram: gelembung chat, format teks
 * (`*tebal*` hanya berlaku di WhatsApp), dan kartu pratinjau link yang diambil dari
 * Pengaturan → Pratinjau tautan. Warna sengaja tetap (meniru aplikasinya), tidak ikut tema admin.
 */
export function MessagePreview({ text, guestName }: { text: string; guestName: string }) {
  const [app, setApp] = useState<App>("whatsapp");
  const seo = useQuery(seoQuery);
  const settings = useQuery(settingsQuery);
  const card = linkCard(seo.data, settings.data, guestName);

  return (
    <div className="grid gap-2">
      <div role="tablist" aria-label="Aplikasi" className="flex gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ["whatsapp", "WhatsApp"],
            ["instagram", "Instagram"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={app === value}
            onClick={() => setApp(value)}
            className={`min-h-9 flex-1 rounded-md text-sm font-medium transition-colors ${
              app === value ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {app === "whatsapp" ? (
        <WhatsAppChat text={text} card={card} />
      ) : (
        <InstagramChat text={text} card={card} />
      )}

      <p className="text-xs text-muted-foreground">
        Perkiraan tampilan; di HP bisa sedikit berbeda. Kartu link (gambar dan judul) diatur di
        Pengaturan → Pratinjau tautan dan baru muncul setelah situs online.
        {app === "instagram" &&
          " Instagram tidak mengenal format *tebal*, jadi tanda bintang tampil apa adanya."}
      </p>
    </div>
  );
}

type Card = { title: string; description: string; image: string | null; host: string };

function linkCard(
  seo: { title: string; description: string; image: { thumb: string } | null } | undefined,
  settings: Settings | null | undefined,
  guestName: string,
): Card {
  const values = {
    panggilan: guestName,
    mempelai: settings ? `${settings.brideName} & ${settings.groomName}` : "Hasri & Ramli",
  };
  let host = "situs-anda.com";
  try {
    if (settings?.publicBaseUrl) host = new URL(settings.publicBaseUrl).host;
  } catch {
    // Alamat situs belum valid: pakai contoh.
  }
  return {
    title: renderSeoText(seo?.title || DEFAULT_SEO_TITLE, values),
    description: renderSeoText(seo?.description || DEFAULT_SEO_DESCRIPTION, values),
    image: seo?.image?.thumb ?? null,
    host,
  };
}

const TOKEN = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|https?:\/\/[^\s]+)/g;

/** Teks pesan dengan format WhatsApp (tebal, miring, coret) dan link berwarna. */
function formatted(
  text: string,
  { whatsapp, linkClass }: { whatsapp: boolean; linkClass: string },
) {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(TOKEN)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const inner = token.slice(1, -1);
    if (token.startsWith("http")) {
      parts.push(
        <span key={key++} className={`${linkClass} break-all underline`}>
          {token}
        </span>,
      );
    } else if (whatsapp && token.startsWith("*")) {
      parts.push(<strong key={key++}>{inner}</strong>);
    } else if (whatsapp && token.startsWith("_")) {
      parts.push(<em key={key++}>{inner}</em>);
    } else if (whatsapp && token.startsWith("~")) {
      parts.push(<s key={key++}>{inner}</s>);
    } else {
      parts.push(token);
    }
    last = index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const hasLink = (text: string) => /https?:\/\/\S+/.test(text);

function CardImage({ image, className }: { image: string | null; className: string }) {
  return image ? (
    <img src={image} alt="" className={`${className} object-cover`} />
  ) : (
    <div className={`${className} grid place-items-center bg-black/10 text-xs text-black/50`}>
      Gambar pratinjau
    </div>
  );
}

function WhatsAppChat({ text, card }: { text: string; card: Card }) {
  return (
    <div className="rounded-lg bg-[#efeae2] p-3 text-[#111b21]">
      <div className="ms-auto max-w-[min(100%,22rem)] rounded-lg rounded-tr-none bg-[#d9fdd3] p-1 shadow-sm">
        {hasLink(text) && (
          <div className="mb-1 overflow-hidden rounded-md bg-[#c8ecc0]">
            <CardImage image={card.image} className="aspect-[1.91/1] w-full" />
            <div className="grid gap-0.5 px-2.5 py-2">
              <p className="line-clamp-2 text-[13px] leading-snug font-semibold">{card.title}</p>
              <p className="line-clamp-2 text-xs leading-snug text-black/60">{card.description}</p>
              <p className="text-xs text-black/50">{card.host}</p>
            </div>
          </div>
        )}
        <p className="px-1.5 pt-0.5 text-[14px] leading-[1.35] break-words whitespace-pre-wrap">
          {formatted(text, { whatsapp: true, linkClass: "text-[#027eb5]" })}
        </p>
        <p className="flex items-center justify-end gap-1 px-1.5 pb-0.5 text-[11px] text-black/45">
          10.00 <CheckCheck className="size-3.5 text-[#53bdeb]" aria-hidden />
        </p>
      </div>
    </div>
  );
}

function InstagramChat({ text, card }: { text: string; card: Card }) {
  return (
    <div className="grid justify-items-end gap-1.5 rounded-lg bg-white p-3 text-[#000]">
      <p className="max-w-[min(100%,20rem)] rounded-[22px] bg-[#3797f0] px-3.5 py-2 text-[14px] leading-[1.35] break-words whitespace-pre-wrap text-white">
        {formatted(text, { whatsapp: false, linkClass: "text-white" })}
      </p>
      {hasLink(text) && (
        <div className="w-[min(100%,16rem)] overflow-hidden rounded-[18px] border border-black/10 bg-[#efefef]">
          <CardImage image={card.image} className="aspect-[1.91/1] w-full" />
          <div className="grid gap-0.5 px-3 py-2">
            <p className="line-clamp-2 text-[13px] leading-snug font-semibold">{card.title}</p>
            <p className="text-xs text-black/50">{card.host}</p>
          </div>
        </div>
      )}
      <p className="text-[11px] text-black/45">Terkirim</p>
    </div>
  );
}
