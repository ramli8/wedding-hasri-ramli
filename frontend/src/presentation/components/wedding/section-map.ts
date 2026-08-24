import type { ComponentType } from "react";
import { WeddingCover } from "./wedding-cover";
import { WeddingAyat } from "./wedding-ayat";
import { WeddingMempelai } from "./wedding-mempelai";
import { WeddingCountdown } from "./wedding-countdown";
import { WeddingAcara } from "./wedding-acara";
import { WeddingKisah } from "./wedding-kisah";
import { WeddingGaleri } from "./wedding-galeri";
import { WeddingRsvp } from "./wedding-rsvp";
import { WeddingUcapan } from "./wedding-ucapan";
import { WeddingHadiah } from "./wedding-hadiah";
import { WeddingDresscode } from "./wedding-dresscode";
import { WeddingFaq } from "./wedding-faq";
import { WeddingPenutup } from "./wedding-penutup";

export const weddingSectionComponents: Record<string, ComponentType> = {
  cover: WeddingCover,
  ayat: WeddingAyat,
  mempelai: WeddingMempelai,
  countdown: WeddingCountdown,
  acara: WeddingAcara,
  kisah: WeddingKisah,
  galeri: WeddingGaleri,
  rsvp: WeddingRsvp,
  ucapan: WeddingUcapan,
  hadiah: WeddingHadiah,
  dresscode: WeddingDresscode,
  faq: WeddingFaq,
  penutup: WeddingPenutup,
};
