import {
  FREE_TIME_LABEL,
  formatEventDate,
  formatSessionTime,
  type TicketEvent,
} from "@wedding/shared";
import { CalendarPlus, MapPin } from "lucide-react";
import { buildIcs, downloadIcs, icsFilename } from "../../lib/ics.js";
import { safeHref } from "../../lib/safe-url.js";

export function EventCard({ event }: { event: TicketEvent }) {
  // Jam kedatangan dari kelompok tamu; tanpa sesi = jam bebas.
  const time = event.session
    ? {
        label: "Jam datang",
        value: formatSessionTime(event.session.startsAt, event.session.endsAt),
      }
    : { label: "Jam datang", value: FREE_TIME_LABEL };

  // Jam sesi kelompok tamu bila ada; kalau tidak, jam acara.
  const calendarStart = event.session?.startsAt ?? event.startsAt;
  const calendarEnd = event.session?.endsAt ?? event.endsAt;
  const location = [event.venueName, event.address].filter(Boolean).join(", ");

  function addToCalendar() {
    if (!calendarStart) return;
    downloadIcs(
      icsFilename(event.name),
      buildIcs({
        uid: `${event.id}@hasri-ramli`,
        title: event.name,
        startsAt: calendarStart,
        endsAt: calendarEnd,
        location,
        description: event.mapsUrl ? `Peta: ${event.mapsUrl}` : null,
        url: event.mapsUrl,
      }),
    );
  }

  return (
    <article className="grid gap-4 border-t border-ink/30 py-6 md:grid-cols-12 md:gap-6">
      <div className="flex flex-col gap-2 md:col-span-4">
        {event.startsAt && <p className="tag text-ink-soft">{formatEventDate(event.startsAt)}</p>}
        {time && (
          <p className="font-display text-4xl leading-[0.9] font-semibold tracking-h1 md:text-5xl">
            {time.value}
          </p>
        )}
        {time && <p className="tag text-ink-soft">{time.label}</p>}
      </div>
      <div className="flex flex-col gap-2 md:col-span-5">
        <h3 className="font-display text-2xl leading-none font-semibold tracking-h2 uppercase md:text-4xl">
          {event.name}
        </h3>
        {event.venueName && <p className="text-lg font-medium">{event.venueName}</p>}
        {event.address && <p className="text-ink-soft">{event.address}</p>}
      </div>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 md:col-span-3 md:flex-col md:items-start">
        {calendarStart && (
          <button
            type="button"
            onClick={addToCalendar}
            className="tag inline-flex items-center gap-2 underline underline-offset-4 max-md:min-h-11"
          >
            <CalendarPlus className="size-4" aria-hidden /> Tambah ke kalender
          </button>
        )}
        {event.mapsUrl && (
          <a
            href={safeHref(event.mapsUrl)}
            target="_blank"
            rel="noreferrer"
            className="tag inline-flex items-center gap-2 underline underline-offset-4 max-md:min-h-11"
          >
            <MapPin className="size-4" aria-hidden /> Buka peta
          </a>
        )}
      </div>
    </article>
  );
}
