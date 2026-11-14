import { Link } from "@tanstack/react-router";
import type { SnapshotGuest } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Camera,
  CameraOff,
  ClipboardCheck,
  Clock,
  Flashlight,
  History,
  Minus,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  SwitchCamera,
  Undo2,
  UserCheck,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { ThemeSwitch } from "@/components/theme-switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/context/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDocumentTitle } from "@/lib/document-title";
import { cn } from "@/lib/utils";
import { applyUpdate, usePwaState } from "../../lib/pwa.js";
import {
  changePax,
  checkIn,
  doorSummary,
  handleScan,
  isCheckedIn,
  isVipView,
  type Outcome,
  type RecentCheckin,
  undoCheckin,
  undoRemainingMs,
} from "../../lib/scan/actions.js";
import { useCamera } from "../../lib/scan/camera.js";
import { db, getMeta, pendingCount, setMeta } from "../../lib/scan/db.js";
import { type FeedbackKind, feedback } from "../../lib/scan/feedback.js";
import { formatAgo, formatClock } from "../../lib/scan/format.js";
import { searchGuests } from "../../lib/scan/search.js";
import { syncEngine, useSyncStatus } from "../../lib/scan/sync.js";
import { PaxPrompt } from "./pax-prompt.js";
import { ResultOverlay } from "./result-overlay.js";
import { SyncPill } from "./sync-pill.js";
import { WalkinDialog } from "./walkin-dialog.js";

type OkOutcome = Extract<Outcome, { status: "ok" }>;

/** Scanner memakai tema (terang/gelap) yang sama dengan panel admin. */
export function ScannerPage() {
  useDocumentTitle("Scanner");
  return (
    <ThemeProvider>
      <Scanner />
    </ThemeProvider>
  );
}

function Scanner() {
  const status = useSyncStatus();
  const pwa = usePwaState();
  const auth = useLiveQuery(() => getMeta("auth"), []);
  const event = useLiveQuery(() => getMeta("event"), []);
  const guestCount = useLiveQuery(() => db.guests.count(), [], 0);
  const rejected = useLiveQuery(() => db.rejected.count(), [], 0);
  const sound = useLiveQuery(async () => (await getMeta("sound")) ?? true, [], true);

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [lastOk, setLastOk] = useState<OkOutcome | null>(null);
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    void syncEngine.start();
  }, []);

  const show = useCallback(
    (result: Outcome) => {
      if (result.status !== "need_pax") {
        // Tamu VIP yang berhasil masuk punya bunyi dan getar sendiri.
        const kind: FeedbackKind =
          result.status === "ok" && isVipView(result.view) ? "vip" : result.status;
        feedback(kind, sound);
      }
      setOutcome(result);
      if (result.status === "ok") setLastOk(result);
    },
    [sound],
  );

  const run = useCallback(
    async (action: () => Promise<Outcome>) => {
      setProblem(null);
      try {
        show(await action());
      } catch (err) {
        setProblem(err instanceof Error ? err.message : "Gagal memproses");
      }
    },
    [show],
  );

  const isMobile = useIsMobile();
  const [tab, setTab] = useState<"pindai" | "cari">("pindai");
  // Di HP kamera berhenti membaca saat tab Cari terbuka; di layar lebar keduanya tampil bersamaan.
  const camera = useCamera(
    (raw) => void run(() => handleScan(raw, "qr")),
    outcome !== null || (isMobile && tab === "cari"),
  );
  // Setelah check-in manual di HP, kembali ke tab Pindai supaya tamu berikutnya langsung bisa dipindai.
  const returnToScan = useRef(false);
  const closeResult = useCallback(() => {
    setOutcome(null);
    if (returnToScan.current) {
      returnToScan.current = false;
      setTab("pindai");
    }
  }, []);

  // Izin kamera yang sudah diberikan: nyalakan otomatis agar penjaga tidak perlu mengetuk lagi.
  // biome-ignore lint/correctness/useExhaustiveDependencies: hanya dijalankan sekali saat halaman dibuka
  useEffect(() => {
    void navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((permission) => {
        if (permission.state === "granted") void camera.start();
      })
      .catch(() => {});
  }, []);

  const showScan = !isMobile || tab === "pindai";
  const showSearch = !isMobile || tab === "cari";
  const hasNotice =
    status.revoked || status.outdated || pwa.needRefresh || rejected > 0 || problem !== null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Bilah atas sepola Header admin: identitas acara di kiri, status dan aksi di kanan. */}
      <header className="sticky top-0 z-30 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3">
          <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            H&amp;R
          </div>
          <div className="grid min-w-0 flex-1 text-sm leading-tight">
            <span className="truncate font-semibold">{event?.name ?? "Memuat acara…"}</span>
            <span className="truncate text-xs text-muted-foreground">
              {auth?.deviceName ?? "Perangkat"} · {guestCount} tamu
            </span>
          </div>
          <SyncPill />
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={sound ? "Matikan suara" : "Nyalakan suara"}
              aria-pressed={sound}
              onClick={() => void setMeta("sound", !sound)}
            >
              {sound ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
            </Button>
            <ThemeSwitch />
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link to="/scan/siap" aria-label="Uji kesiapan perangkat">
                <ClipboardCheck aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:gap-6 md:py-6 md:pb-6">
        <div className="hidden flex-wrap items-end justify-between gap-2 md:flex [@media(max-height:500px)]:hidden">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pintu masuk</h1>
            <p className="text-muted-foreground">
              Pindai QR undangan, atau cari nama tamu yang lupa membawanya.
            </p>
          </div>
        </div>

        {hasNotice && (
          <div className="flex flex-col gap-3">
            {status.revoked && (
              <Alert tone="error">
                Perangkat ini sudah dicabut oleh admin. Scan dinonaktifkan; hubungi admin.
              </Alert>
            )}
            {status.outdated && !status.revoked && (
              <Alert tone="error">
                Aplikasi perlu diperbarui agar bisa sinkron. Scan tetap berjalan dan datanya aman
                tersimpan di perangkat.
              </Alert>
            )}
            {pwa.needRefresh && (
              <Card className="flex-row items-center justify-between gap-3 p-4">
                <p className="text-sm">Versi baru aplikasi tersedia.</p>
                <Button size="sm" onClick={() => void applyUpdate()}>
                  <RefreshCw aria-hidden /> Perbarui
                </Button>
              </Card>
            )}
            {rejected > 0 && (
              <Alert>
                {rejected} perubahan ditolak server (mis. lewat batas koreksi). Lihat di Uji
                Kesiapan.
              </Alert>
            )}
            {problem && <Alert tone="error">{problem}</Alert>}
          </div>
        )}

        {/* HP/tablet: ringkasan di atas, lalu kamera dan panel cari. Laptop (lg): kamera di kiri
            setinggi layar, ringkasan pindah ke atas kolom kanan supaya semuanya muat tanpa gulir. */}
        <div className="grid flex-1 grid-cols-1 content-start items-start gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-7">
          <DoorStats
            guestCount={guestCount}
            lastSyncAt={status.lastSyncAt}
            className="md:col-span-2 lg:col-span-3 lg:col-start-5 lg:row-start-1"
          />
          {/* Blok kamera tidak pernah dilepas dari halaman, hanya disembunyikan saat tab Cari terbuka:
              stream kamera menempel pada elemen <video> ini, dan elemen baru akan tampil hitam. */}
          <div
            className={cn(
              "flex min-w-0 flex-col gap-4 sm:gap-6 lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-1",
              !showScan && "hidden",
            )}
          >
            <Card className="gap-0 overflow-hidden py-0">
              <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
                <div className="min-w-0">
                  <p className="leading-none font-semibold">Pindai QR</p>
                  <p className="mt-1.5 truncate text-sm text-muted-foreground">
                    {camera.state === "running"
                      ? `Arahkan kamera ke QR tamu${camera.detectorKind ? ` · pembaca ${camera.detectorKind === "native" ? "bawaan" : "WASM"}` : ""}`
                      : "Kamera mati"}
                  </p>
                </div>
                {camera.state === "running" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    {camera.canSwitch && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          void camera.switchCamera().then((failure) => setProblem(failure))
                        }
                        aria-label={
                          camera.facing === "user"
                            ? "Ganti ke kamera belakang"
                            : "Ganti ke kamera depan"
                        }
                        title={camera.facing === "user" ? "Kamera depan" : "Kamera belakang"}
                      >
                        <SwitchCamera aria-hidden />
                      </Button>
                    )}
                    {camera.torch.supported && (
                      <Button
                        size="icon"
                        variant={camera.torch.on ? "default" : "outline"}
                        onClick={() => void camera.toggleTorch()}
                        aria-pressed={camera.torch.on}
                        aria-label="Senter"
                      >
                        <Flashlight aria-hidden />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={camera.stop}
                      aria-label="Matikan kamera"
                    >
                      <CameraOff aria-hidden />
                      <span className="max-sm:hidden">Matikan</span>
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="shrink-0 gap-1.5">
                    <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden />
                    Mati
                  </Badge>
                )}
              </div>
              <Viewfinder camera={camera} disabled={status.revoked} />
            </Card>
            {lastOk && isMobile && <LastPanel key={lastOk.checkinId} last={lastOk} />}
          </div>

          {showSearch && (
            <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:col-span-3 lg:col-start-5">
              <ManualPanel
                disabled={status.revoked}
                idle={outcome === null && !walkinOpen}
                onPick={(guest) => {
                  returnToScan.current = true;
                  void run(() => checkIn(guest, "search"));
                }}
                onCode={(code) => {
                  returnToScan.current = true;
                  void run(() => handleScan(code, "code"));
                }}
                onWalkin={() => setWalkinOpen(true)}
              />
              {lastOk && !isMobile && <LastPanel key={lastOk.checkinId} last={lastOk} />}
              <RecentPanel />
            </div>
          )}
        </div>
      </main>

      {/* Bilah tab bawah (HP): Pindai atau Cari. */}
      <nav
        aria-label="Mode"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-lg md:hidden"
      >
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ["pindai", "Pindai QR", ScanLine],
              ["cari", "Cari tamu", Search],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
                tab === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {outcome?.status === "need_pax" && (
        <PaxPrompt
          view={outcome.view}
          onCancel={closeResult}
          onConfirm={async (pax) => show(await checkIn(outcome.view.guest, outcome.method, pax))}
        />
      )}
      {outcome && outcome.status !== "need_pax" && (
        <ResultOverlay
          outcome={outcome}
          onClose={closeResult}
          onSearch={() => {
            setOutcome(null);
            setTab("cari");
            // Tunggu tab Cari tampil (HP) sebelum memfokuskan kolomnya.
            requestAnimationFrame(() => document.getElementById("cari-tamu")?.focus());
          }}
        />
      )}
      <WalkinDialog open={walkinOpen} onClose={() => setWalkinOpen(false)} onDone={show} />
    </div>
  );
}

// --- Jendela kamera -------------------------------------------------------------------------------

function Viewfinder({
  camera,
  disabled,
}: {
  camera: ReturnType<typeof useCamera>;
  disabled: boolean;
}) {
  const running = camera.state === "running";
  return (
    // HP: persegi selebar layar. Layar lebar: 4:3 dan tidak lebih tinggi dari sisa layar.
    <div
      className={cn(
        "relative aspect-square max-h-[60dvh] w-full overflow-hidden md:aspect-[4/3] md:max-h-[calc(100dvh-22rem)] md:min-h-72 lg:max-h-[calc(100dvh-16rem)]",
        running ? "bg-neutral-950" : "bg-muted/50",
      )}
    >
      <video
        ref={camera.videoRef}
        playsInline
        muted
        // Kamera depan dicerminkan seperti kaca agar arah gerak tangan tidak terbalik.
        className={cn(
          "size-full object-cover",
          camera.facing === "user" && "-scale-x-100",
          !running && "invisible",
        )}
      />
      {running && (
        <>
          {/* Bingkai bidik: area di luar kotak diredupkan supaya mata langsung ke tengah. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative aspect-square w-[64%] max-w-80 rounded-3xl shadow-[0_0_0_100vmax_rgb(0_0_0/0.45)]">
              <span className="absolute -top-0.5 -left-0.5 size-10 rounded-tl-3xl border-t-4 border-l-4 border-white" />
              <span className="absolute -top-0.5 -right-0.5 size-10 rounded-tr-3xl border-t-4 border-r-4 border-white" />
              <span className="absolute -bottom-0.5 -left-0.5 size-10 rounded-bl-3xl border-b-4 border-l-4 border-white" />
              <span className="absolute -right-0.5 -bottom-0.5 size-10 rounded-br-3xl border-r-4 border-b-4 border-white" />
              <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-white/90 shadow-[0_0_12px_2px_rgb(255_255_255/0.6)] [animation:scan-sweep_2.4s_ease-in-out_infinite]" />
            </div>
          </div>
          <Badge className="absolute top-3 left-3 border-transparent bg-black/60 text-white backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden />
            Memindai
          </Badge>
        </>
      )}
      {!running && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="grid size-16 place-items-center rounded-full border bg-background">
            <Camera className="size-7 text-muted-foreground" aria-hidden />
          </span>
          <div className="max-w-xs space-y-1">
            <p className="font-semibold">Kamera belum aktif</p>
            <p className="text-sm text-muted-foreground">
              {camera.error ?? "Izinkan akses kamera untuk memindai QR tamu."}
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 px-6"
            onClick={() => void camera.start()}
            disabled={camera.state === "starting" || disabled}
          >
            <Camera aria-hidden />
            {camera.state === "starting" ? "Membuka…" : "Aktifkan kamera"}
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Ringkasan pintu masuk ------------------------------------------------------------------------

function DoorStats({
  guestCount,
  lastSyncAt,
  className,
}: {
  guestCount: number;
  lastSyncAt: number | null | undefined;
  className?: string;
}) {
  const summary = useLiveQuery(() => doorSummary(0), [], null);
  const pending = useLiveQuery(() => pendingCount(), [], 0);
  // Teks "x menit lalu" ikut diperbarui walau tidak ada data baru.
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, []);

  const checkedIn = summary?.checkedIn ?? 0;
  const percent = guestCount > 0 ? Math.round((checkedIn / guestCount) * 100) : 0;
  const items = [
    {
      label: "Tamu masuk",
      short: "Masuk",
      value: `${checkedIn}`,
      suffix: `/${guestCount}`,
      note: `${percent}% dari daftar`,
      icon: UserCheck,
      progress: percent,
    },
    {
      label: "Orang hadir",
      short: "Orang",
      value: `${summary?.pax ?? 0}`,
      note: "termasuk rombongan",
      icon: Users,
    },
    {
      label: "Antrean kirim",
      short: "Antre",
      value: `${pending}`,
      note: lastSyncAt ? `sinkron ${formatAgo(lastSyncAt)}` : "belum sinkron",
      icon: RefreshCw,
    },
  ];

  return (
    <section
      aria-label="Ringkasan"
      className={cn("grid min-w-0 grid-cols-3 gap-2 sm:gap-4", className)}
    >
      {items.map(({ label, short, value, suffix, note, icon: Icon, progress }) => (
        <Card key={label} className="min-w-0 gap-0 py-3 sm:py-6 lg:py-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 sm:px-6 sm:pb-2 lg:px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm sm:text-foreground">
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </CardTitle>
            <Icon className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 lg:px-4">
            <div className="text-xl font-bold tabular-nums sm:text-2xl">
              {value}
              {suffix && (
                <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
              )}
            </div>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{note}</p>
            {progress !== undefined && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

// --- Cari nama / ketik kode ---------------------------------------------------------------------

type Found = { guest: SnapshotGuest; checkedIn: boolean };

function ManualPanel({
  disabled,
  idle,
  onPick,
  onCode,
  onWalkin,
}: {
  disabled: boolean;
  /** Tidak ada hasil scan yang sedang tampil. */
  idle: boolean;
  onPick: (guest: SnapshotGuest) => void;
  onCode: (code: string) => void;
  onWalkin: () => void;
}) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Laptop dengan keyboard atau scanner USB: kolom cari siap menerima ketikan berikutnya.
  // Di HP tidak difokuskan otomatis agar keyboard layar tidak menutupi kamera.
  useEffect(() => {
    if (idle && window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, [idle]);

  const pick = (guest: SnapshotGuest) => {
    setQuery("");
    onPick(guest);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const guests = await searchGuests(query);
      const withState = await Promise.all(
        guests.map(async (guest) => ({ guest, checkedIn: await isCheckedIn(guest.id) })),
      );
      if (!cancelled) setFound(withState);
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (found.length === 1 && found[0]) pick(found[0].guest);
    else if (query.trim()) {
      const code = query;
      setQuery("");
      onCode(code);
    }
  }

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Cari tamu</CardTitle>
        <CardDescription>Lupa QR? Cari nama atau ketik kode 6 karakter.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={onSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="cari-tamu"
              ref={inputRef}
              type="search"
              aria-label="Cari nama atau kode"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Nama tamu atau kode"
              value={query}
              disabled={disabled}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 ps-9 text-base md:text-sm"
            />
          </div>
          <Button type="submit" className="h-11" disabled={disabled || !query.trim()}>
            Catat
          </Button>
        </form>

        {found.length > 0 && (
          <ul className="-mx-2 grid gap-1">
            {found.map(({ guest, checkedIn }) => (
              <li key={guest.id}>
                <button
                  type="button"
                  onClick={() => pick(guest)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <Initials name={guest.displayName} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{guest.displayName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {guest.isRombongan ? "Rombongan · " : ""}
                      <span className="font-mono">{guest.code ?? "tamu baru"}</span>
                    </span>
                  </span>
                  {checkedIn ? (
                    <Badge variant="secondary">Sudah masuk</Badge>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">Catat</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 && found.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Tidak ada yang cocok. Tekan Catat untuk mencoba sebagai kode.
          </p>
        )}

        <Button variant="outline" size="lg" className="h-12" onClick={onWalkin} disabled={disabled}>
          <UserPlus aria-hidden />
          Tamu baru (tidak di daftar)
        </Button>
      </CardContent>
    </Card>
  );
}

function Initials({ name, className }: { name: string; className?: string }) {
  const initials =
    name
      .replace(/^(bpk|bp|pak|ibu|bu|sdr|sdri|kel)\.?\s+/i, "")
      .split(/\s+/)
      .filter((part) => /^[\p{L}\p{N}]/u.test(part))
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold",
        className,
      )}
    >
      {initials}
    </span>
  );
}

// --- Riwayat masuk --------------------------------------------------------------------------------

function RecentPanel() {
  const summary = useLiveQuery(() => doorSummary(8), [], null);
  const recent = summary?.recent ?? [];
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Baru masuk</CardTitle>
        <CardDescription>
          {summary ? `${summary.checkedIn} tamu tercatat di semua pintu.` : "Memuat…"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <History className="size-5 shrink-0" aria-hidden />
            Belum ada tamu yang masuk.
          </div>
        ) : (
          <ul className="space-y-5">
            {recent.map((item) => (
              <RecentRow key={item.checkinId} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentRow({ item }: { item: RecentCheckin }) {
  return (
    <li className="flex items-center gap-4">
      <Initials name={item.guest.displayName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-none font-medium">{item.guest.displayName}</p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <span className="truncate">
            {item.group?.name ?? "Tanpa grup"} · {item.mine ? "pintu ini" : "pintu lain"}
          </span>
        </p>
      </div>
      <div className="shrink-0 text-end">
        <p className="text-sm font-medium tabular-nums">{item.pax} org</p>
        <p className="text-xs text-muted-foreground tabular-nums">{formatClock(item.scannedAt)}</p>
      </div>
    </li>
  );
}

// --- Check-in terakhir: koreksi dalam 2 menit ----------------------------------------------------

function LastPanel({ last }: { last: OkOutcome }) {
  const [remaining, setRemaining] = useState(() => undoRemainingMs(last.scannedAt));
  const [pax, setPax] = useState(last.pax);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setRemaining(undoRemainingMs(last.scannedAt)), 1000);
    return () => clearInterval(timer);
  }, [last.scannedAt]);

  async function guarded(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal");
    }
  }

  const canCorrect = remaining > 0 && !done;
  const percent = Math.max(0, Math.min(100, (remaining / 120_000) * 100));
  const group = last.view.group;
  return (
    <Card className="gap-4 py-5">
      <CardContent className="grid gap-4 px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/15 text-success">
            <UserCheck className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Terakhir masuk · {formatClock(last.scannedAt)}
            </p>
            <p className="truncate font-semibold">{last.view.guest.displayName}</p>
            {group && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {group.name}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {pax} orang
          </Badge>
        </div>
        {done ? (
          <p className="text-sm text-muted-foreground">{done}</p>
        ) : canCorrect ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-e-none"
                  aria-label="Kurangi satu orang"
                  disabled={pax <= 1}
                  onClick={() =>
                    void guarded(async () => {
                      await changePax(last.checkinId, pax - 1);
                      setPax(pax - 1);
                    })
                  }
                >
                  <Minus aria-hidden />
                </Button>
                <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                  {pax}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-s-none"
                  aria-label="Tambah satu orang"
                  onClick={() =>
                    void guarded(async () => {
                      await changePax(last.checkinId, pax + 1);
                      setPax(pax + 1);
                    })
                  }
                >
                  <Plus aria-hidden />
                </Button>
              </div>
              <Button
                variant="outline"
                className="ms-auto text-destructive hover:text-destructive"
                onClick={() =>
                  void guarded(async () => {
                    await undoCheckin(last.checkinId);
                    setDone("Check-in dibatalkan.");
                  })
                }
              >
                <Undo2 aria-hidden /> Batalkan
              </Button>
            </div>
            <div className="grid gap-1.5">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" aria-hidden />
                Bisa dikoreksi {Math.ceil(remaining / 1000)} detik lagi.
              </p>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Batas koreksi lewat. Minta admin.</p>
        )}
        {error && <Alert tone="error">{error}</Alert>}
      </CardContent>
    </Card>
  );
}
