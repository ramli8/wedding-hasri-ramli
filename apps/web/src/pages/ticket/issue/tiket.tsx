import { RSVP_LABEL, RSVP_STATUSES, type RsvpStatus } from "@wedding/shared";
import { useState } from "react";
import { Barcode } from "../mag.js";
import { TicketQr } from "../ticket-qr.js";
import { ISSUE, pageOf } from "./content.js";
import { IssueHead, Sheet, Stamp } from "./parts.js";

/** Tiket masuk (QR sungguhan dari kode di alamat) dan konfirmasi kehadiran, di halaman yang sama. */
export function Tiket({ code }: { code: string }) {
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <Sheet id="tiket" page={pageOf("tiket")}>
      <IssueHead
        eyebrow="Rubrik 03 · Tiket & RSVP"
        title="Tiket masuk & RSVP"
        deck="Tunjukkan QR kepada petugas di pintu masuk. Simpan gambarnya agar tetap bisa dibuka tanpa sinyal."
      />
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="relative lg:col-span-5">
          <div className="wobble -rotate-1 border-[3px] border-dashed border-ink/70 bg-[#fbf8ef] p-6 shadow-[0_18px_36px_-22px_rgba(20,14,6,0.6)] md:p-8">
            <p className="tag text-ink-soft">Tiket masuk · Edisi pernikahan No. 1</p>
            <p className="mt-2 font-display text-4xl leading-tight font-black md:text-5xl">
              {ISSUE.guest.name}
            </p>
            <p className="tag mt-1 text-ink-soft">
              {ISSUE.guest.group} · {ISSUE.dateLabel}
            </p>
            <div className="my-6 border-y border-ink/40 py-6">
              <TicketQr code={code} />
            </div>
            <Barcode value={code} className="h-10" />
          </div>
          <Stamp className="absolute -top-5 right-4 rotate-[6deg] bg-paper/80">Tanda masuk</Stamp>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-7">
          <p className="tag text-ink-soft">
            Apakah Anda akan hadir? Jawaban bisa diubah kapan saja.
          </p>
          <fieldset className="m-0 flex flex-col border-0 border-t-[3px] border-double border-ink/60 p-0">
            <legend className="sr-only">Konfirmasi kehadiran</legend>
            {RSVP_STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={status === option}
                onClick={() => {
                  setStatus(option);
                  setSaved(false);
                }}
                className={`flex min-h-20 items-center justify-between gap-4 border-b border-ink/40 py-4 text-left transition-[padding] duration-200 hover:pl-3 ${
                  status === option ? "pl-3" : ""
                }`}
              >
                <span
                  className={`font-display text-4xl leading-none md:text-6xl ${status === option ? "font-black" : "font-normal italic"}`}
                >
                  {RSVP_LABEL[option]}
                </span>
                <span
                  aria-hidden
                  className={`grid size-10 shrink-0 place-items-center rounded-full border-2 ${status === option ? "border-stamp bg-stamp text-paper" : "border-ink/50"}`}
                >
                  {status === option ? "✓" : ""}
                </span>
              </button>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              disabled={!status}
              onClick={() => setSaved(true)}
              className="tag h-12 bg-ink px-8 text-paper disabled:opacity-40"
            >
              Kirim jawaban
            </button>
            {saved && (
              <p role="status" className="font-display text-xl text-stamp italic">
                Terima kasih, jawaban Anda sudah kami catat.
              </p>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
