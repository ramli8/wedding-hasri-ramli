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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: "Hasri & Ramli — Undangan Pernikahan",
  description:
    "Undangan pernikahan Hasri & Ramli. Sabtu, 12 Desember 2026. Kami mohon doa dan restu.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Undangan Hasri & Ramli",
    title: "Hasri & Ramli — Undangan Pernikahan",
    description:
      "Undangan pernikahan Hasri & Ramli. Sabtu, 12 Desember 2026. Kami mohon doa dan restu.",
    images: [
      {
        url: "/images/cover-1.png",
        width: 1200,
        height: 630,
        alt: "Hasri & Ramli",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hasri & Ramli — Undangan Pernikahan",
    description:
      "Undangan pernikahan Hasri & Ramli. Sabtu, 12 Desember 2026. Kami mohon doa dan restu.",
    images: ["/images/cover-1.png"],
  },
};

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
