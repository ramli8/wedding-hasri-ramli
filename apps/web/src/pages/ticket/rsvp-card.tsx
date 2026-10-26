import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MAX_PAX,
  RSVP_LABEL,
  RSVP_STATUSES,
  type RsvpStatus,
  type TicketEvent,
  type TicketResponse,
} from "@wedding/shared";
import { useState } from "react";
import { Alert } from "../../components/guest-ui/alert.js";
import { Button } from "../../components/guest-ui/button.js";
import { Input } from "../../components/guest-ui/input.js";
import { publicApi } from "../../lib/public-api.js";
import { saveTicket } from "../../lib/ticket-cache.js";
import { MagTitle } from "./mag.js";

/** Konfirmasi kehadiran untuk satu acara. Jawaban bisa diubah kapan saja. */
export function RsvpCard({
  code,
  event,
  isRombongan,
}: {
  code: string;
  event: TicketEvent;
  isRombongan: boolean;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RsvpStatus | null>(event.rsvp?.status ?? null);
  const [pax, setPax] = useState(String(event.rsvp && event.rsvp.pax > 0 ? event.rsvp.pax : 2));
  const [saved, setSaved] = useState(false);

  const send = useMutation({
    mutationFn: () => {
      if (!status) throw new Error("Pilih jawaban Anda dulu");
      return publicApi.rsvp({
        code,
        eventId: event.id,
        status,
        pax: isRombongan && status === "hadir" ? Math.max(1, Number(pax) || 1) : undefined,
      });
    },
    onSuccess: ({ rsvp }) => {
      setSaved(true);
      queryClient.setQueryData(
        ["ticket", code],
        (current: { data: TicketResponse } | undefined) => {
          if (!current) return current;
          const data = {
            ...current.data,
            events: current.data.events.map((e) => (e.id === event.id ? { ...e, rsvp } : e)),
          };
          saveTicket(code, data);
          return { ...current, data };
        },
      );
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <MagTitle>Konfirmasi kehadiran</MagTitle>
        <p className="tag text-ink-soft">{event.name}</p>
      </div>

      <fieldset className="flex flex-col border-t border-ink">
        <legend className="sr-only">Apakah Anda akan hadir?</legend>
        {RSVP_STATUSES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={status === option}
            onClick={() => {
              setStatus(option);
              setSaved(false);
            }}
            className={`flex min-h-16 items-center justify-between border-b border-ink/40 py-3 text-left font-display text-3xl transition-[padding] duration-200 hover:pl-3 ${
              status === option
                ? "pl-3 font-semibold underline decoration-1 underline-offset-8"
                : ""
            }`}
          >
            {RSVP_LABEL[option]}
            <span aria-hidden className="tag">
              {status === option ? "●" : "○"}
            </span>
          </button>
        ))}
      </fieldset>

      {isRombongan && status === "hadir" && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`pax-${event.id}`} className="tag">
            Berapa orang yang akan hadir?
          </label>
          <Input
            id={`pax-${event.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_PAX}
            className="max-w-32"
            value={pax}
            onChange={(e) => {
              setPax(e.target.value);
              setSaved(false);
            }}
          />
        </div>
      )}

      {send.error && <Alert tone="error">{send.error.message}</Alert>}
      {saved && !send.error && (
        <p className="font-display text-xl italic" role="status">
          Terima kasih, jawaban Anda tersimpan. Anda bisa mengubahnya kapan saja.
        </p>
      )}
      <Button onClick={() => send.mutate()} disabled={!status || send.isPending}>
        {send.isPending ? "Mengirim…" : event.rsvp ? "Perbarui jawaban" : "Kirim jawaban"}
      </Button>
    </section>
  );
}
