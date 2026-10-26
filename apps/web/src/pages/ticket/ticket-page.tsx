import { queryOptions, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { formatEventDate } from "@wedding/shared";
import { Alert } from "../../components/guest-ui/alert.js";
import { Badge } from "../../components/guest-ui/badge.js";
import { ApiError } from "../../lib/api.js";
import { publicApi } from "../../lib/public-api.js";
import { loadTicket, saveTicket } from "../../lib/ticket-cache.js";
import { Barcode, MagContainer, MagTitle } from "./mag.js";
import { RsvpCard } from "./rsvp-card.js";
import { TicketProblem } from "./ticket-problem.js";
import { TicketQr } from "./ticket-qr.js";

/** Tiket dari server; bila tak ada sinyal, salinan terakhir di perangkat. */
export const ticketQuery = (code: string) =>
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

/** Halaman pribadi tamu: hanya tiket QR dan konfirmasi kehadiran, dalam tata letak majalah. */
export function TicketPage() {
  const { code = "" } = useParams({ strict: false });
  const ticket = useQuery(ticketQuery(code));

  if (ticket.isPending) {
    return (
      <Shell>
        <Narrow>
          <p className="text-center text-ink-soft">Memuat undangan…</p>
        </Narrow>
      </Shell>
    );
  }
  if (ticket.isError) {
    return (
      <Shell>
        <Narrow>
          <TicketProblem error={ticket.error} code={code} onRetry={() => void ticket.refetch()} />
        </Narrow>
      </Shell>
    );
  }

  const { data, offline } = ticket.data;
  const hasQr = data.events.some((e) => e.checkinEnabled);
  const rsvpEvents = data.events.filter((event) => event.hasRsvp);
  const names = data.couple ? [data.couple.brideName, data.couple.groomName] : ["Undangan"];
  const firstStart = data.events
    .map((e) => e.startsAt)
    .filter((value): value is string => !!value)
    .sort()[0];

  return (
    <Shell couple={names.join(" & ")} tabs={{ code: data.guest.code, active: "tiket" }}>
      <section className="grid lg:min-h-[calc(100dvh-3.25rem)] lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-between gap-14 bg-ink px-5 pt-8 pb-10 text-paper md:px-10 lg:px-16 lg:py-14">
          <div className="tag flex justify-between gap-4">
            <span>Undangan pernikahan</span>
            {firstStart && <span>{formatEventDate(firstStart)}</span>}
          </div>
          <h1 className="font-display text-[clamp(4.5rem,18vw,12rem)] leading-[0.8] font-semibold tracking-h1 break-words uppercase">
            {names[0]}
            {names[1] && (
              <>
                <em className="my-3 block text-[0.4em] font-normal tracking-normal text-paper/60 normal-case italic">
                  dan
                </em>
                {names[1]}
              </>
            )}
          </h1>
          <div className="flex flex-col gap-3 border-t border-paper/40 pt-5">
            <p className="tag text-paper/60">Kepada Yth.</p>
            <p className="font-display text-4xl leading-tight font-medium break-words md:text-5xl">
              {data.guest.displayName}
            </p>
            {data.guest.groupName && (
              <Badge variant="pill" className="w-fit border-paper bg-transparent text-paper">
                {data.guest.groupName}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-14 px-5 py-10 md:px-10 lg:justify-center lg:px-16 lg:py-14">
          {offline && (
            <Alert>
              Anda sedang offline. Menampilkan salinan terakhir; tiket QR tetap bisa dipakai.
            </Alert>
          )}

          {hasQr && (
            <div className="flex flex-col gap-5">
              <MagTitle>Tiket masuk</MagTitle>
              <p className="max-w-md text-ink-soft">
                Tunjukkan QR ini kepada petugas di pintu masuk. Simpan gambarnya agar tetap bisa
                dibuka tanpa sinyal.
              </p>
              <TicketQr code={data.guest.code} />
              <div className="mx-auto flex w-full max-w-xs flex-col gap-1">
                <Barcode value={data.guest.code} />
                <p className="tag text-center text-ink-soft">Tiket {data.guest.code}</p>
              </div>
              {data.guest.isRombongan && (
                <p className="text-sm text-ink-soft">
                  Satu QR untuk seluruh rombongan. Petugas akan menanyakan jumlah orang.
                </p>
              )}
            </div>
          )}

          {rsvpEvents.map((event) => (
            <RsvpCard
              key={event.id}
              code={data.guest.code}
              event={event}
              isRombongan={data.guest.isRombongan}
            />
          ))}
        </div>
      </section>
    </Shell>
  );
}

/** Kolom sempit untuk keadaan memuat dan galat, di tengah layar. */
export function Narrow({ children }: { children: React.ReactNode }) {
  return <MagContainer className="max-w-xl py-16">{children}</MagContainer>;
}

type GuestTabs = { code: string; active: "tiket" | "undangan" };

const links = [
  { to: "/u/$code", key: "tiket", label: "Tiket" },
  { to: "/u/$code/undangan", key: "undangan", label: "Undangan" },
] as const;

/** Bilah bawah di HP, seperti aplikasi: pindah antara tiket dan halaman undangan. */
function GuestTabBar({ code, active }: GuestTabs) {
  return (
    <nav
      aria-label="Halaman undangan"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-bone pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex">
        {links.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            params={{ code }}
            aria-current={active === link.key ? "page" : undefined}
            className={`tag flex min-h-14 flex-1 items-center justify-center ${
              active === link.key ? "bg-ink text-paper" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Kerangka halaman tamu: bilah atas tipis (nama mempelai dan tautan) dan isi layar penuh. */
export function Shell({
  couple,
  tabs,
  theme,
  children,
}: {
  couple?: string | null;
  tabs?: GuestTabs;
  /** "vin": edisi majalah vintage untuk halaman undangan (lihat .vin di styles.css). */
  theme?: "vin";
  children: React.ReactNode;
}) {
  return (
    <div className={`mag ${theme ?? ""} min-h-dvh`}>
      <header className="sticky top-0 z-20 border-b border-ink bg-bone/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <MagContainer className="flex h-13 items-center justify-between gap-4">
          <span className="tag truncate">{couple ?? "Undangan pernikahan"}</span>
          {tabs && (
            <nav aria-label="Halaman undangan" className="hidden gap-8 md:flex">
              {links.map((link) => (
                <Link
                  key={link.key}
                  to={link.to}
                  params={{ code: tabs.code }}
                  aria-current={tabs.active === link.key ? "page" : undefined}
                  className={`tag underline-offset-8 ${
                    tabs.active === link.key ? "underline decoration-2" : "hover:underline"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </MagContainer>
      </header>
      <main className={tabs ? "pb-20 md:pb-0" : ""}>{children}</main>
      {tabs && <GuestTabBar {...tabs} />}
    </div>
  );
}
