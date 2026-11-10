import { useParams } from "@tanstack/react-router";
import { IssueCover } from "./issue/cover.js";
import { InfoPenonton, Kredit, TandaKasih, Ulasan } from "./issue/extras.js";
import { Cuplikan } from "./issue/gallery.js";
import { Adegan, Jadwal, Pemeran, Sinopsis } from "./issue/sections.js";
import { Tiket } from "./issue/tiket.js";

/**
 * Satu halaman penuh untuk tamu, disusun seperti sebuah film: poster hitam putih selayar penuh,
 * sinopsis, jadwal tayang, tiket bioskop (QR) dan RSVP, pemeran utama, kisah sebagai adegan, cuplikan
 * galeri, tanda kasih, info penonton, ucapan, dan kredit akhir. Bagian gelap dan terang berselang.
 * Isinya masih contoh statis (issue/content.ts), belum dari database.
 */
export function InvitationPage() {
  const { code = "" } = useParams({ strict: false });
  return (
    <div className="mag film min-h-dvh">
      <IssueCover />
      <Sinopsis />
      <Jadwal />
      <Tiket code={code} />
      <Pemeran />
      <Adegan />
      <Cuplikan />
      <TandaKasih />
      <InfoPenonton />
      <Ulasan />
      <Kredit />
    </div>
  );
}
