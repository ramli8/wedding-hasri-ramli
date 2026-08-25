import type { Metadata } from "next";
import { Amiri, Great_Vibes } from "next/font/google";
import { WeddingPage } from "@/src/presentation/components/wedding/wedding-page";
import "./wedding.css";

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

interface InvitationMeta {
  wedding?: {
    groom_name?: string;
    bride_name?: string;
    wedding_date?: string | null;
    content?: {
      cover?: { image_desktop?: string | null } | null;
    } | null;
  } | null;
  couples?: {
    side: string;
    nickname?: string | null;
    full_name?: string;
  }[];
}

/**
 * Ambil data undangan langsung dari backend untuk preview share (WA/IG/dll).
 * Gagal / timeout → jatuh ke nilai default agar link tetap cantik.
 */
async function fetchInvitationMeta(): Promise<InvitationMeta | null> {
  const rawBase =
    process.env.BACKEND_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080";
  const apiBase = `${rawBase.replace(/\/v1\/?$/, "").replace(/\/$/, "")}/v1`;
  try {
    const res = await fetch(`${apiBase}/invitation`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as InvitationMeta;
  } catch {
    return null;
  }
}

function formatWeddingDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  // Acara diselenggarakan di zona WITA — tampilkan sesuai zona itu, bukan server.
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(date);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}): Promise<Metadata> {
  // searchParams dibaca supaya URL dengan ?guest= punya preview sama rapi;
  // isi metadata selalu generik — nama tamu tidak ikut ke preview share.
  await searchParams;

  const data = await fetchInvitationMeta();
  // Tampilkan panggilan (nickname) seperti di cover — fallback ke nama lengkap.
  const pick = (side: string, fallback: string) =>
    data?.couples?.find((c) => c.side === side)?.nickname ||
    data?.couples?.find((c) => c.side === side)?.full_name ||
    fallback;
  const bride = pick("wanita", data?.wedding?.bride_name || "Hasri");
  const groom = pick("pria", data?.wedding?.groom_name || "Ramli");
  const dateLabel = formatWeddingDate(data?.wedding?.wedding_date) || "Sabtu, 12 Desember 2026";
  const coverImage =
    data?.wedding?.content?.cover?.image_desktop || "/images/cover-1.png";

  const title = `${bride} & ${groom} — Undangan Pernikahan`;
  const description = `Undangan pernikahan ${bride} & ${groom}. ${dateLabel}. Kami mohon doa dan restu.`;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: `Undangan ${bride} & ${groom}`,
      url: "/",
      title,
      description,
      images: [
        {
          url: coverImage,
          alt: `${bride} & ${groom}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverImage],
    },
  };
}

export default async function WeddingRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}) {
  const { guest } = await searchParams;

  return (
    <div className={`${greatVibes.variable} ${amiri.variable}`}>
      <WeddingPage guest={guest} />
    </div>
  );
}
