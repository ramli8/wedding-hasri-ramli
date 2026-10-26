import { Link } from "@tanstack/react-router";
import type { SnapshotGuest } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Camera,
  CameraOff,
  ClipboardCheck,
  Flashlight,
  Minus,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { applyUpdate, usePwaState } from "../../lib/pwa.js";
import {
  changePax,
  checkIn,
  handleScan,
  isCheckedIn,
  type Outcome,
  undoCheckin,
  undoRemainingMs,
} from "../../lib/scan/actions.js";
import { useCamera } from "../../lib/scan/camera.js";
import { db, getMeta, setMeta } from "../../lib/scan/db.js";
import { type FeedbackKind, feedback } from "../../lib/scan/feedback.js";
import { searchGuests } from "../../lib/scan/search.js";
import { syncEngine, useSyncStatus } from "../../lib/scan/sync.js";
import { PaxPrompt } from "./pax-prompt.js";
import { ResultOverlay } from "./result-overlay.js";
import { SyncPill } from "./sync-pill.js";
import { WalkinDialog } from "./walkin-dialog.js";

type OkOutcome = Extract<Outcome, { status: "ok" }>;

export function ScannerPage() {
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
      if (result.status !== "need_pax") feedback(result.status as FeedbackKind, sound);
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

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
            H&amp;R
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{event?.name ?? "Memuat acara…"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {auth?.deviceName ?? "Perangkat"} · {guestCount} tamu
            </p>
          </div>
          <SyncPill />
          <Button
            variant="ghost"
            size="icon"
            aria-label={sound ? "Matikan suara" : "Nyalakan suara"}
            onClick={() => void setMeta("sound", !sound)}
          >
            {sound ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/scan/siap" aria-label="Uji kesiapan perangkat">
              <ClipboardCheck aria-hidden />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 pb-24 md:pb-6">
        {(status.revoked ||
          (status.outdated && !status.revoked) ||
          pwa.needRefresh ||
          rejected > 0 ||
          problem) && (
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

        <div className="grid flex-1 gap-4 md:grid-cols-2 md:items-start">
          {showScan && (
            <div className="flex flex-col gap-4">
              <Card className="gap-0 overflow-hidden p-0">
                <div className="relative aspect-square max-h-[62dvh] w-full bg-foreground md:max-h-none">
                  <video
                    ref={camera.videoRef}
                    playsInline
                    muted
                    className="size-full object-cover"
                  />
                  {camera.state === "running" && (
                    <>
                      <div aria-hidden className="pointer-events-none absolute inset-[16%]">
                        <span className="absolute top-0 left-0 size-8 rounded-tl-xl border-t-4 border-l-4 border-white" />
                        <span className="absolute top-0 right-0 size-8 rounded-tr-xl border-t-4 border-r-4 border-white" />
                        <span className="absolute bottom-0 left-0 size-8 rounded-bl-xl border-b-4 border-l-4 border-white" />
                        <span className="absolute right-0 bottom-0 size-8 rounded-br-xl border-r-4 border-b-4 border-white" />
                      </div>
                      <Badge className="absolute top-3 left-3 bg-black/60 text-white backdrop-blur">
                        <span className="size-1.5 animate-pulse rounded-full bg-success" />
                        Memindai
                      </Badge>
                      {camera.torch.supported && (
                        <Button
                          size="icon"
                          variant={camera.torch.on ? "default" : "secondary"}
                          onClick={() => void camera.toggleTorch()}
                          aria-pressed={camera.torch.on}
                          aria-label="Senter"
                          className="absolute top-3 right-3 size-11 rounded-full"
                        >
                          <Flashlight aria-hidden />
                        </Button>
                      )}
                    </>
                  )}
                  {camera.state !== "running" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
                      <span className="grid size-16 place-items-center rounded-full bg-muted">
                        <CameraOff className="size-7 text-muted-foreground" aria-hidden />
                      </span>
                      <div className="space-y-1">
                        <p className="font-semibold">Kamera belum aktif</p>
                        <p className="text-sm text-muted-foreground">
                          {camera.error ?? "Izinkan akses kamera untuk memindai QR tamu."}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="h-12 px-6"
                        onClick={() => void camera.start()}
                        disabled={camera.state === "starting" || status.revoked}
                      >
                        <Camera aria-hidden />
                        {camera.state === "starting" ? "Membuka…" : "Aktifkan kamera"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {camera.state === "running"
                      ? `Arahkan ke QR tamu${camera.detectorKind ? ` · pembaca ${camera.detectorKind === "native" ? "bawaan" : "WASM"}` : ""}`
                      : "Kamera mati"}
                  </p>
                  {camera.state === "running" && (
                    <Button size="sm" variant="outline" onClick={camera.stop}>
                      Matikan
                    </Button>
                  )}
                </div>
              </Card>
              {lastOk && <LastPanel key={lastOk.checkinId} last={lastOk} />}
            </div>
          )}

          {showSearch && (
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
          )}
        </div>
      </main>

      {/* Bilah tab bawah (HP): Pindai atau Cari. */}
      <nav
        aria-label="Mode"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
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
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${tab === value ? "text-foreground" : "text-muted-foreground"}`}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {outcome?.status === "need_pax" && (
        <PaxPrompt
          view={outcome.view}
          onCancel={closeResult}
          onConfirm={async (pax) => show(await checkIn(outcome.view.guest, outcome.method, pax))}
        />
      )}
      {outcome && outcome.status !== "need_pax" && (
        <ResultOverlay outcome={outcome} onClose={closeResult} />
      )}
      <WalkinDialog open={walkinOpen} onClose={() => setWalkinOpen(false)} onDone={show} />
    </div>
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
            className="h-11"
          />
          <Button type="submit" size="icon" aria-label="Cari" disabled={disabled || !query.trim()}>
            <Search aria-hidden />
          </Button>
        </form>

        {found.length > 0 && (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {found.map(({ guest, checkedIn }) => (
              <li key={guest.id}>
                <button
                  type="button"
                  onClick={() => pick(guest)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{guest.displayName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {guest.isRombongan ? "Rombongan · " : ""}
                      {guest.code ?? "tamu baru"}
                    </span>
                  </span>
                  {checkedIn && <Badge>Sudah masuk</Badge>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 && found.length === 0 && (
          <p className="text-sm text-muted-foreground">Tidak ada yang cocok.</p>
        )}

        <Button variant="outline" size="lg" className="h-12" onClick={onWalkin} disabled={disabled}>
          <UserPlus aria-hidden />
          Tamu baru (tidak di daftar)
        </Button>
      </CardContent>
    </Card>
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
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Terakhir masuk</p>
          <p className="text-lg leading-tight font-semibold break-words">
            {last.view.guest.displayName}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 font-mono">
          {pax} orang
        </Badge>
      </div>
      {done ? (
        <p className="text-sm text-muted-foreground">{done}</p>
      ) : canCorrect ? (
        <>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
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
            <Button
              size="icon"
              variant="outline"
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
            <Button
              variant="destructive"
              className="ms-auto"
              onClick={() =>
                void guarded(async () => {
                  await undoCheckin(last.checkinId);
                  setDone("Check-in dibatalkan.");
                })
              }
            >
              Batalkan
            </Button>
          </div>
          <div className="grid gap-1">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Bisa dikoreksi {Math.ceil(remaining / 1000)} detik lagi.
            </p>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Batas koreksi lewat. Minta admin.</p>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </Card>
  );
}
