import { queryOptions, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { formatEventDate, formatTimeRange, type TicketEvent } from "@wedding/shared";
import { MapPin } from "lucide-react";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Card } from "../../components/ui/card.js";
import { ApiError } from "../../lib/api.js";
import { publicApi } from "../../lib/public-api.js";
import { loadTicket, saveTicket } from "../../lib/ticket-cache.js";
import { GuestbookCard } from "./guestbook-card.js";
import { RsvpCard } from "./rsvp-card.js";
import { TicketProblem } from "./ticket-problem.js";
import { TicketQr } from "./ticket-qr.js";

/** Tiket dari server; bila tak ada sinyal, salinan terakhir di perangkat. */
const ticketQuery = (code: string) =>
  queryOptions({
    queryKey: ["ticket", code],
    retry: false,
    queryFn: async () => {
      try {
        const data = await publicApi.ticket(code);
        saveTicket(code, data);
        return { data, offline: false };
      } catch (err) {
        if (err instanceof ApiError && err.code === "NETWORK") {
          const cached = loadTicket(code);
          if (cached) return { data: cached, offline: true };
        }
        throw err;
      }
    },
  });

function EventCard({ event }: { event: TicketEvent }) {
  const time = event.session
    ? { label: "Sesi Anda", value: formatTimeRange(event.session.startsAt, event.session.endsAt) }
    : event.startsAt && event.endsAt
      ? { label: "Waktu", value: formatTimeRange(event.startsAt, event.endsAt) }
      : null;

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold tracking-h2 uppercase">{event.name}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {event.startsAt && (
          <>
            <dt className="text-ink-soft">Tanggal</dt>
            <dd>{formatEventDate(event.startsAt)}</dd>
          </>
        )}
        {time && (
          <>
            <dt className="text-ink-soft">{time.label}</dt>
            <dd className="font-semibold">{time.value}</dd>
          </>
        )}
        {event.venueName && (
          <>
            <dt className="text-ink-soft">Tempat</dt>
            <dd>{event.venueName}</dd>
          </>
        )}
        {event.address && (
          <>
            <dt className="text-ink-soft">Alamat</dt>
            <dd>{event.address}</dd>
          </>
        )}
      </dl>
      {event.mapsUrl && (
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-paper px-3 py-2 text-sm font-semibold hover:bg-acid"
        >
          <MapPin className="size-4" aria-hidden /> Buka peta
        </a>
      )}
    </Card>
  );
}

/** Halaman pribadi tamu: tiket QR, info acara, konfirmasi kehadiran, dan buku ucapan. */
export function TicketPage() {
  const { code = "" } = useParams({ strict: false });
  const ticket = useQuery(ticketQuery(code));

  if (ticket.isPending) {
    return (
      <Shell>
        <p className="text-center text-ink-soft">Memuat undangan…</p>
      </Shell>
    );
  }
  if (ticket.isError) {
    return (
      <Shell>
        <TicketProblem error={ticket.error} code={code} onRetry={() => void ticket.refetch()} />
      </Shell>
    );
  }

  const { data, offline } = ticket.data;
  const hasQr = data.events.some((e) => e.checkinEnabled);
  const couple = data.couple ? `${data.couple.brideName} & ${data.couple.groomName}` : null;

  return (
    <Shell couple={couple}>
      {offline && (
        <Alert>
          Anda sedang offline. Menampilkan salinan terakhir; tiket QR tetap bisa dipakai.
        </Alert>
      )}

      <Card tone="acid" className="flex flex-col gap-2">
        <p className="tag">Undangan untuk</p>
        <p className="font-display text-3xl leading-tight font-bold tracking-h1 break-words">
          {data.guest.displayName}
        </p>
        {data.guest.groupName && (
          <Badge variant="pill" className="w-fit">
            {data.guest.groupName}
          </Badge>
        )}
      </Card>

      {hasQr && (
        <Card className="flex flex-col items-center gap-4 text-center">
          <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Tiket masuk</h2>
          <p className="text-sm text-ink-soft">
            Tunjukkan QR ini kepada petugas di pintu masuk. Simpan gambarnya agar tetap bisa dibuka
            tanpa sinyal.
          </p>
          <TicketQr code={data.guest.code} />
          {data.guest.isRombongan && (
            <p className="text-sm text-ink-soft">
              Satu QR untuk seluruh rombongan. Petugas akan menanyakan jumlah orang.
            </p>
          )}
        </Card>
      )}

      {data.events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}

      {data.events
        .filter((event) => event.hasRsvp)
        .map((event) => (
          <RsvpCard
            key={event.id}
            code={data.guest.code}
            event={event}
            isRombongan={data.guest.isRombongan}
          />
        ))}

      <GuestbookCard code={data.guest.code} defaultName={data.guest.displayName} />
    </Shell>
  );
}

function Shell({ couple, children }: { couple?: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bone">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <Badge variant="tag">Undangan pernikahan</Badge>
          {couple && (
            <h1 className="font-display text-4xl leading-none font-bold tracking-h1 uppercase">
              {couple}
            </h1>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}
