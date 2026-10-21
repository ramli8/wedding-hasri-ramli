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
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Input } from "../../components/ui/input.js";
import { publicApi } from "../../lib/public-api.js";
import { saveTicket } from "../../lib/ticket-cache.js";

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
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-bold tracking-h2 uppercase">
          Konfirmasi kehadiran
        </h2>
        <p className="text-sm text-ink-soft">{event.name}</p>
      </div>

      <fieldset className="flex flex-col gap-2">
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
            className={`h-12 border-2 border-ink px-4 text-left font-display text-sm font-bold tracking-button uppercase ${
              status === option ? "bg-acid shadow-hard-sm" : "bg-paper hover:bg-bone"
            }`}
          >
            {RSVP_LABEL[option]}
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
        <Alert>Terima kasih, jawaban Anda tersimpan. Anda bisa mengubahnya kapan saja.</Alert>
      )}
      <Button onClick={() => send.mutate()} disabled={!status || send.isPending}>
        {send.isPending ? "Mengirim…" : event.rsvp ? "Perbarui jawaban" : "Kirim jawaban"}
      </Button>
    </Card>
  );
}
