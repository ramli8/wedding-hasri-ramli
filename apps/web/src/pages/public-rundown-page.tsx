import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { formatEventDate, type PublicRundown, shiftTime } from "@wedding/shared";
import { CalendarClock, Loader2, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Badge } from "@/components/ui/badge";
import { ThemeProvider } from "@/context/theme-provider";
import { useDocumentTitle } from "@/lib/document-title";
import { cn } from "@/lib/utils";
import { formatPhone } from "../lib/format.js";
import { publicApi } from "../lib/public-api.js";

const WIB_OFFSET_MS = 7 * 3600_000;
const wib = (ms: number) => new Date(ms + WIB_OFFSET_MS).toISOString();
/** Tanggal "YYYY-MM-DD" dan jam "HH:MM" sekarang di WIB. */
const nowWib = (ms: number) => ({ date: wib(ms).slice(0, 10), time: wib(ms).slice(11, 16) });

type Event = PublicRundown["events"][number];

/** Kegiatan yang sedang berlangsung: sudah mulai dan kegiatan berikutnya belum mulai. */
function currentId(event: Event, now: { date: string; time: string }): string | null {
  if (!event.startsAt || wib(Date.parse(event.startsAt)).slice(0, 10) !== now.date) return null;
  let current: string | null = null;
  for (const item of event.items) if (item.time <= now.time) current = item.id;
  return current;
}

/**
 * Rundown baca-saja untuk MC dan panitia (tautan dari admin, tanpa login). Diperbarui tiap 30 detik;
 * kegiatan yang sedang berlangsung di hari acara disorot.
 */
export function PublicRundownPage() {
  useDocumentTitle("Rundown");
  const { token } = useParams({ from: "/rundown/$token" });
  const query = useQuery({
    queryKey: ["public-rundown", token],
    queryFn: () => publicApi.rundown(token),
    retry: false,
    refetchInterval: 30_000,
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const clock = nowWib(now);
  const data = query.data;

  return (
    <ThemeProvider>
      <main className="min-h-svh bg-muted/40 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {query.isPending && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Memuat…
            </p>
          )}
          {query.isError && <Alert tone="error">{query.error.message}</Alert>}
          {data && (
            <>
              <header className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background">
                  <CalendarClock className="size-5" aria-hidden />
                </span>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Rundown</h1>
                  <p className="text-sm text-muted-foreground">
                    {data.couple ? `Pernikahan ${data.couple} · ` : ""}sekarang {clock.time} WIB
                  </p>
                </div>
              </header>
              {data.events.length === 0 && (
                <p className="rounded-xl bg-background p-4 text-sm text-muted-foreground">
                  Rundown belum diisi.
                </p>
              )}
              {data.events.map((event) => {
                const current = currentId(event, clock);
                return (
                  <section key={event.id} className="flex flex-col gap-2">
                    <h2 className="text-base font-semibold">
                      {event.name}
                      {event.startsAt && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {formatEventDate(event.startsAt)}
                        </span>
                      )}
                    </h2>
                    <ol className="overflow-hidden rounded-xl border bg-background">
                      {event.items.map((item) => {
                        const isNow = item.id === current;
                        return (
                          <li
                            key={item.id}
                            aria-current={isNow ? "step" : undefined}
                            className={cn(
                              "flex gap-4 border-b px-4 py-3 last:border-b-0",
                              isNow && "bg-primary/5",
                            )}
                          >
                            <div className="w-14 shrink-0 tabular-nums">
                              <p className="text-lg font-bold">{item.time}</p>
                              {item.durationMin && (
                                <p className="text-xs text-muted-foreground">
                                  s.d. {shiftTime(item.time, item.durationMin)}
                                </p>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="flex flex-wrap items-center gap-2 font-medium">
                                {item.title}
                                {isNow && <Badge>Sekarang</Badge>}
                              </p>
                              {item.pic && (
                                <p className="text-sm text-muted-foreground">PJ: {item.pic}</p>
                              )}
                              {item.vendor && (
                                <p className="text-sm text-muted-foreground">
                                  Vendor: {item.vendor.name}
                                  {item.vendor.picName ? ` (${item.vendor.picName})` : ""}
                                  {item.vendor.picPhone && (
                                    <a
                                      href={`tel:+${item.vendor.picPhone}`}
                                      className="ms-2 inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2"
                                    >
                                      <Phone className="size-3.5" aria-hidden />
                                      {formatPhone(item.vendor.picPhone)}
                                    </a>
                                  )}
                                </p>
                              )}
                              {item.note && <p className="mt-0.5 text-sm">{item.note}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
}
