import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GuestbookCard } from "./guestbook-card.js";
import { InvitationSections } from "./invitation-sections.js";
import { Shell, ticketQuery } from "./ticket-page.js";
import { TicketProblem } from "./ticket-problem.js";

/** Halaman cerita untuk tamu: perkenalan mempelai, linimasa, dan buku ucapan. */
export function InvitationPage() {
  const { code = "" } = useParams({ strict: false });
  const ticket = useQuery(ticketQuery(code));

  if (ticket.isPending) {
    return (
      <Shell>
        <p className="text-center text-ink-soft">Memuat…</p>
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

  const { data } = ticket.data;
  const couple = data.couple ? `${data.couple.brideName} & ${data.couple.groomName}` : null;

  return (
    <Shell couple={couple}>
      <Link
        to="/u/$code"
        params={{ code: data.guest.code }}
        className="flex w-fit items-center gap-2 border-2 border-ink bg-paper px-3 py-2 text-sm font-semibold hover:bg-acid"
      >
        <ArrowLeft className="size-4" aria-hidden /> Kembali ke tiket
      </Link>
      <InvitationSections />
      <GuestbookCard code={data.guest.code} defaultName={data.guest.displayName} />
    </Shell>
  );
}
