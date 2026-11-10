import { RSVP_LABEL, RSVP_STATUSES, type RsvpStatus } from "@wedding/shared";
import { useState } from "react";
import { Barcode } from "../mag.js";
import { TicketQr } from "../ticket-qr.js";
import { ISSUE } from "./content.js";
import { PRIMARY, Scene } from "./parts.js";

/**
 * Tiket bioskop sungguhan: QR dari kode di alamat, dengan potongan tiket berlubang berisi nama tamu
 * dan jam tayang. Di sebelahnya konfirmasi kehadiran.
 */
export function Tiket({ code }: { code: string }) {
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const first = ISSUE.events[0];

  return (
    <Scene id="tiket" label="Tiket & konfirmasi" title="Tiket masuk Anda" tone="sand">
      <div className="grid gap-16 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20">
        <div className="mx-auto flex w-full max-w-md flex-col bg-reel text-screen shadow-[0_24px_40px_-28px_rgb(14_12_10/0.8)]">
          <div className="flex flex-col gap-1 border-b border-screen/15 px-6 pt-6 pb-5">
            <p className="tag text-ember">Pemutaran perdana · Undangan</p>
            <p className="poster-font text-5xl leading-none">
              {ISSUE.bride.short} &amp; {ISSUE.groom.short}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-6 py-5">
            {[
              ["Penonton", ISSUE.guest.name],
              ["Kelompok", ISSUE.guest.group],
              ["Tanggal", ISSUE.dateParts.join(".")],
              ["Jam tayang", first ? `${first.time} WIB` : "-"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <dt className="tag text-screen/55">{label}</dt>
                <dd className="text-lg leading-tight">{value}</dd>
              </div>
            ))}
          </dl>
          <div aria-hidden className="perforation h-4 border-y border-dashed border-screen/25" />
          <div className="flex flex-col items-center gap-3 px-6 py-6 [&_a]:border-screen/60 [&_a]:bg-transparent [&_a]:text-screen [&_img]:border-0 [&_img]:bg-white [&_p]:text-screen">
            <TicketQr code={code} />
            <Barcode value={code} className="h-8 text-screen/70" />
            <p className="tag text-center text-screen/60">
              Tunjukkan QR ini kepada petugas. Simpan gambarnya agar tetap bisa dibuka tanpa sinyal.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <p className="max-w-md text-2xl leading-snug">
            Apakah Anda akan hadir di pemutaran perdana kami? Jawaban bisa diubah kapan saja.
          </p>
          <fieldset className="m-0 flex flex-col border-0 border-t border-umber/25 p-0">
            <legend className="sr-only">Konfirmasi kehadiran</legend>
            {RSVP_STATUSES.map((option) => {
              const on = status === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setStatus(option);
                    setSaved(false);
                  }}
                  className="flex min-h-20 items-center justify-between gap-4 border-b border-umber/25 text-left"
                >
                  <span
                    className={`poster-font text-5xl leading-none transition-colors ${on ? "text-ember" : "text-umber/45"}`}
                  >
                    {RSVP_LABEL[option]}
                  </span>
                  <span
                    aria-hidden
                    className={`grid size-8 place-items-center rounded-full border-2 text-sm ${on ? "border-ember bg-ember text-screen" : "border-umber/35"}`}
                  >
                    {on ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </fieldset>
          <div className="flex flex-col items-start gap-4">
            <button
              type="button"
              disabled={!status}
              onClick={() => setSaved(true)}
              className={PRIMARY}
            >
              Kirim jawaban
            </button>
            {saved && (
              <p role="status" className="text-xl text-ember italic">
                Terima kasih, jawaban Anda sudah kami catat.
              </p>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}
