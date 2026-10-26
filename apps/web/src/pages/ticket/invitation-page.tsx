import { useParams } from "@tanstack/react-router";
import { IssueCover } from "./issue/cover.js";
import { Iklan, Kolofon, Kupon, Surat, Tanya } from "./issue/extras.js";
import { Foto } from "./issue/gallery.js";
import { Agenda, Kisah, Profil, Redaksi } from "./issue/sections.js";
import { Tiket } from "./issue/tiket.js";

/**
 * Satu halaman penuh untuk tamu: sebuah "edisi" majalah vintage yang memuat sampul, agenda, tiket
 * QR dan RSVP, profil, kisah, galeri, amplop, wishlist, tanya jawab, dan ucapan. Tanpa bilah
 * navigasi; daftar isi di sampul menjadi penunjuk arah. Isinya masih contoh statis
 * (issue/content.ts), belum dari database.
 */
export function InvitationPage() {
  const { code = "" } = useParams({ strict: false });
  return (
    <div className="mag vin flex min-h-dvh flex-col gap-2 md:gap-3">
      <IssueCover code={code} />
      <Redaksi />
      <Agenda />
      <Tiket code={code} />
      <Profil />
      <Kisah />
      <Foto />
      <Kupon />
      <Iklan />
      <Tanya />
      <Surat />
      <Kolofon code={code} />
    </div>
  );
}
