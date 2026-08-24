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
  title: "Hasri & Ramli — Undangan Pernikahan",
  description:
    "Undangan pernikahan Hasri & Ramli. Sabtu, 12 Desember 2026. Kami mohon doa dan restu.",
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
