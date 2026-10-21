import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { InvitationCover, InvitationSections } from "./invitation-sections.js";
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
    <Shell couple={couple} tabs={{ code: data.guest.code, active: "undangan" }}>
      <InvitationCover />
      <InvitationSections code={data.guest.code} guestName={data.guest.displayName} />
    </Shell>
  );
}
