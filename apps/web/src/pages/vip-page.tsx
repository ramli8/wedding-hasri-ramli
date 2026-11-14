import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Bell, BellOff, Loader2, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { ThemeProvider } from "@/context/theme-provider";
import { useDocumentTitle } from "@/lib/document-title";
import { cn } from "@/lib/utils";
import { publicApi } from "../lib/public-api.js";
import { feedback } from "../lib/scan/feedback.js";
import { formatAgo, formatClock } from "../lib/scan/format.js";

/**
 * Kabar VIP untuk HP keluarga (tautan rahasia dari admin, tanpa login): daftar tamu VIP yang sudah
 * datang, diperbarui tiap 10 detik. Setelah "Aktifkan suara" diketuk, kedatangan baru berbunyi dan
 * bergetar (peramban baru mengizinkan suara setelah ada ketukan).
 */
export function VipPage() {
  useDocumentTitle("Kabar VIP");
  const { token } = useParams({ from: "/vip/$token" });
  const query = useQuery({
    queryKey: ["public-vip", token],
    queryFn: () => publicApi.vip(token),
    retry: false,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
  const [sound, setSound] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lastSeq = useRef<number | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const data = query.data;
  useEffect(() => {
    if (!data) return;
    const newest = data.arrivals[0]?.seq ?? 0;
    if (lastSeq.current === null) {
      lastSeq.current = newest;
      return;
    }
    const fresh = data.arrivals.filter((a) => a.seq > (lastSeq.current ?? 0));
    lastSeq.current = Math.max(lastSeq.current, newest);
    if (fresh.length === 0) return;
    setFreshIds(new Set(fresh.map((a) => a.id)));
    // Getar tetap jalan walau suara mati (bila HP mendukung).
    feedback("vip", sound);
  }, [data, sound]);

  function toggleSound() {
    // Ketukan ini sekaligus membuka izin suara peramban; bunyikan sekali sebagai contoh.
    if (!sound) feedback("vip", true);
    setSound(!sound);
  }

  return (
    <ThemeProvider>
      <main className="min-h-svh bg-muted/40 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {query.isPending && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Memuat…
            </p>
          )}
          {query.isError && !data && <Alert tone="error">{query.error.message}</Alert>}
          {data && (
            <>
              <header className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background">
                  <Star className="size-5" aria-hidden />
                </span>
                <div className="flex-1">
                  <h1 className="text-xl font-bold tracking-tight">Kabar VIP</h1>
                  <p className="text-sm text-muted-foreground">
                    {data.arrivedCount} dari {data.vipCount} tamu VIP sudah datang
                  </p>
                </div>
              </header>
              <Button
                variant={sound ? "outline" : "default"}
                size="lg"
                onClick={toggleSound}
                aria-pressed={sound}
              >
                {sound ? <BellOff aria-hidden /> : <Bell aria-hidden />}
                {sound ? "Matikan suara" : "Aktifkan suara"}
              </Button>
              {query.isError && (
                <Alert tone="error">Koneksi terputus; mencoba lagi… ({query.error.message})</Alert>
              )}

              {data.arrivals.length === 0 ? (
                <p className="rounded-xl bg-background p-4 text-sm text-muted-foreground">
                  Belum ada tamu VIP yang datang.
                </p>
              ) : (
                <ol className="overflow-hidden rounded-xl border bg-background">
                  {data.arrivals.map((arrival) => (
                    <li
                      key={arrival.id}
                      className={cn(
                        "flex items-center gap-4 border-b px-4 py-3 last:border-b-0",
                        freshIds.has(arrival.id) && "bg-primary/5",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold break-words">{arrival.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          {[
                            arrival.groupName,
                            arrival.pax && arrival.pax > 1 ? `${arrival.pax} orang` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || " "}
                        </p>
                      </div>
                      <div className="shrink-0 text-end tabular-nums">
                        <p className="font-semibold">{formatClock(arrival.scannedAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAgo(Date.parse(arrival.scannedAt), now)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
}
