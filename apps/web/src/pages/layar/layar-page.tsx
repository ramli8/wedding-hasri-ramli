import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { LayarFeed, LayarMode } from "@wedding/shared";
import { ChefHat, Expand, Hand, Loader2, Star, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDocumentTitle } from "@/lib/document-title";
import { cn } from "@/lib/utils";
import { ApiError } from "../../lib/api.js";
import { getLayarAuth, getLayarMode, setLayarAuth, setLayarMode } from "../../lib/layar.js";
import { deviceApi } from "../../lib/scan/device-api.js";
import { formatClock } from "../../lib/scan/format.js";

/** Lama satu nama tampil besar sebelum nama berikutnya di antrean. */
const SHOW_MS = 6_000;
/** Toolbar hilang sendiri bila tetikus diam selama ini. */
const IDLE_MS = 4_000;

type Arrival = LayarFeed["recent"][number];

/**
 * Layar hari-H di TV/proyektor (perangkat jenis "layar"). Sapa: nama tamu yang baru masuk tampil
 * besar satu per satu. Dapur: orang yang sudah datang dibanding porsi siap (diisi admin di Check-in).
 * Butuh internet; bila terputus, angka terakhir tetap tampil dengan tanda.
 */
export function LayarPage() {
  useDocumentTitle("Layar");
  const navigate = useNavigate();
  const [auth] = useState(getLayarAuth);
  const [mode, setMode] = useState<LayarMode>(getLayarMode);
  const query = useQuery({
    queryKey: ["layar", auth?.token],
    queryFn: () => deviceApi.layarFeed(auth?.token ?? ""),
    enabled: !!auth,
    refetchInterval: mode === "sapa" ? 5_000 : 10_000,
    refetchIntervalInBackground: true,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
  });

  // Dicabut admin atau token tidak dikenal: kembali ke halaman pasang.
  const revoked = query.error instanceof ApiError && query.error.status === 401;
  useEffect(() => {
    if (!auth || revoked) {
      setLayarAuth(null);
      void navigate({ to: "/layar/pasang" });
    }
  }, [auth, revoked, navigate]);

  useWakeLock();
  const idle = useIdle();

  function chooseMode(next: LayarMode) {
    setMode(next);
    setLayarMode(next);
  }

  const data = query.data;
  const offline = query.isError && !!data;

  return (
    <main
      className={cn(
        "relative flex min-h-svh flex-col overflow-hidden bg-neutral-950 text-neutral-50",
        idle && "cursor-none",
      )}
    >
      <div
        className={cn(
          "absolute end-4 top-4 z-10 flex items-center gap-2 transition-opacity duration-500",
          idle ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div className="flex rounded-full bg-white/10 p-1" role="tablist" aria-label="Mode layar">
          {(
            [
              ["sapa", "Sapa", Hand],
              ["dapur", "Dapur", ChefHat],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => chooseMode(value)}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium",
                mode === value ? "bg-white text-neutral-950" : "text-neutral-300 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
            else void document.documentElement.requestFullscreen().catch(() => {});
          }}
          className="flex min-h-12 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium text-neutral-200 hover:text-white"
        >
          <Expand className="size-4" aria-hidden />
          Layar penuh
        </button>
      </div>

      {offline && (
        <p className="absolute start-4 top-4 z-10 flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 text-sm text-amber-200">
          <WifiOff className="size-4" aria-hidden />
          Terputus, mencoba lagi…
        </p>
      )}

      {!data ? (
        <div className="grid flex-1 place-items-center p-8 text-center text-neutral-400">
          {query.isError ? (
            <p className="max-w-md text-lg">{query.error.message}</p>
          ) : (
            <Loader2 className="size-8 animate-spin" aria-label="Memuat" />
          )}
        </div>
      ) : mode === "sapa" ? (
        <SapaView data={data} />
      ) : (
        <DapurView data={data} />
      )}
    </main>
  );
}

/**
 * Nama tamu yang baru masuk tampil besar bergantian. Kedatangan baru masuk antrean (tertua dulu),
 * jadi rombongan yang masuk bersamaan tetap kebagian disapa satu per satu.
 */
function SapaView({ data }: { data: LayarFeed }) {
  const seen = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<Arrival[]>([]);
  const [current, setCurrent] = useState<Arrival | null>(data.recent[0] ?? null);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(data.recent.map((a) => a.id));
      return;
    }
    const known = seen.current;
    const fresh = data.recent.filter((a) => !known.has(a.id)).reverse();
    for (const a of fresh) known.add(a.id);
    if (fresh.length > 0) setQueue((old) => [...old, ...fresh]);
  }, [data]);

  // Nama pertama di antrean langsung tampil bila layar sedang diam; berikutnya tiap SHOW_MS.
  const lastShownAt = useRef(0);
  useEffect(() => {
    if (queue.length === 0) return;
    const wait = Math.max(0, lastShownAt.current + SHOW_MS - Date.now());
    const timer = setTimeout(() => {
      lastShownAt.current = Date.now();
      setCurrent(queue[0] ?? null);
      setQueue((old) => old.slice(1));
    }, wait);
    return () => clearTimeout(timer);
  }, [queue]);

  // Nama yang dibatalkan admin (undo) tidak lagi disapa.
  const visible = current && data.recent.some((a) => a.id === current.id) ? current : null;
  const others = data.recent.filter((a) => a.id !== visible?.id).slice(0, 6);

  return (
    <div className="flex flex-1 flex-col items-center justify-between gap-8 px-6 py-12 text-center sm:px-12">
      <p className="text-sm font-medium tracking-[0.4em] text-neutral-400 uppercase sm:text-base">
        {data.couple && `Pernikahan ${data.couple}`}
      </p>

      <div className="flex flex-col items-center gap-4">
        <p className="text-2xl text-neutral-400 sm:text-4xl">Selamat datang</p>
        {visible ? (
          <div
            key={visible.id}
            className="flex flex-col items-center gap-4 duration-700 animate-in fade-in zoom-in-95"
          >
            <h1 className="max-w-[18ch] text-[clamp(3rem,9vw,9rem)] leading-[1.05] font-bold tracking-tight break-words [overflow-wrap:anywhere]">
              {visible.name}
            </h1>
            {(visible.groupName || visible.isVip) && (
              <p className="flex items-center gap-2 text-xl text-neutral-300 sm:text-3xl">
                {visible.isVip && (
                  <Star className="size-6 fill-current text-amber-300" aria-hidden />
                )}
                {visible.groupName}
              </p>
            )}
          </div>
        ) : (
          <h1 className="text-[clamp(2.5rem,7vw,7rem)] leading-tight font-bold tracking-tight">
            {data.couple || "Selamat datang"}
          </h1>
        )}
      </div>

      <div className="flex min-h-16 flex-col items-center gap-2">
        {others.length > 0 && (
          <>
            <p className="text-xs tracking-[0.3em] text-neutral-500 uppercase">Baru saja tiba</p>
            <p className="max-w-5xl text-lg text-neutral-300 sm:text-2xl">
              {others.map((a) => a.name).join("  ·  ")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** Untuk dapur/katering: orang sudah datang dibanding porsi yang siap. */
function DapurView({ data }: { data: LayarFeed }) {
  const k = data.kitchen;
  const filled = k.portionsReady > 0;
  const remaining = k.portionsReady - k.arrivedPax;
  const tone = !filled
    ? "text-neutral-400"
    : remaining < 0
      ? "text-red-400"
      : remaining < Math.max(20, k.portionsReady * 0.1)
        ? "text-amber-300"
        : "text-emerald-300";
  const notYet = k.rsvpPax === null ? null : Math.max(0, k.rsvpPax - k.arrivedPax);

  return (
    <div className="flex flex-1 flex-col justify-center gap-8 px-6 py-16 sm:px-12">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.4em] text-neutral-400 uppercase sm:text-base">
          Dapur
        </p>
        {data.eventName && <p className="mt-1 text-xl text-neutral-300">{data.eventName}</p>}
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-3">
        <Tile label="Sudah datang" value={k.arrivedPax} unit="orang" />
        <Tile label="Porsi siap" value={filled ? k.portionsReady : null} unit="porsi" />
        <Tile
          label={remaining < 0 && filled ? "Kurang" : "Sisa porsi"}
          value={filled ? Math.abs(remaining) : null}
          unit="porsi"
          className={tone}
        />
      </div>
      <p className="text-center text-lg text-neutral-400 sm:text-xl">
        {[
          k.rsvpPax !== null && `RSVP hadir ${k.rsvpPax} orang`,
          notYet !== null && `belum datang ${notYet}`,
          filled && k.portionsUpdatedAt
            ? `porsi diperbarui ${formatClock(k.portionsUpdatedAt)}`
            : "porsi belum diisi admin",
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}

function Tile({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: number | null;
  unit: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-white/5 px-6 py-10">
      <p className="text-lg text-neutral-400 sm:text-2xl">{label}</p>
      <p
        className={cn(
          "text-[clamp(4rem,10vw,9rem)] leading-none font-bold tabular-nums",
          className,
        )}
      >
        {value === null ? "–" : value.toLocaleString("id-ID")}
      </p>
      <p className="text-base text-neutral-500 sm:text-xl">{unit}</p>
    </div>
  );
}

/** Layar tidak boleh mati sendiri selama acara. */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      void navigator.wakeLock
        ?.request("screen")
        .then((l) => {
          lock = l;
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => {});
    };
  }, []);
}

/** true bila tetikus/sentuhan diam selama IDLE_MS (toolbar disembunyikan). */
function useIdle() {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), IDLE_MS);
    };
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);
  return idle;
}
