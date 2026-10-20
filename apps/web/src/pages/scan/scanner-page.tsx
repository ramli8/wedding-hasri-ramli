import { Link } from "@tanstack/react-router";
import type { SnapshotGuest } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Camera,
  CameraOff,
  ClipboardCheck,
  Flashlight,
  RefreshCw,
  Search,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Input } from "../../components/ui/input.js";
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
      feedback(result.status as FeedbackKind, sound);
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

  const camera = useCamera((raw) => void run(() => handleScan(raw, "qr")), outcome !== null);

  return (
    <div className="min-h-dvh bg-bone">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b-[3px] border-ink bg-bone px-3 py-2">
        <div className="min-w-0">
          <p className="tag truncate">{event?.name ?? "Memuat acara…"}</p>
          <p className="truncate text-xs text-ink-soft">
            {auth?.deviceName ?? "Perangkat"} · {guestCount} tamu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncPill />
          <button
            type="button"
            aria-label={sound ? "Matikan suara" : "Nyalakan suara"}
            onClick={() => void setMeta("sound", !sound)}
            className="grid size-9 shrink-0 place-items-center border-2 border-ink bg-paper hover:bg-acid"
          >
            {sound ? (
              <Volume2 className="size-4" aria-hidden />
            ) : (
              <VolumeX className="size-4" aria-hidden />
            )}
          </button>
          <Link
            to="/scan/siap"
            aria-label="Uji kesiapan perangkat"
            className="grid size-9 shrink-0 place-items-center border-2 border-ink bg-paper hover:bg-acid"
          >
            <ClipboardCheck className="size-4" aria-hidden />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-3 md:grid md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-3 md:col-span-2">
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
            <Card className="flex items-center justify-between gap-3 p-3">
              <p>Versi baru aplikasi tersedia.</p>
              <Button size="sm" onClick={() => void applyUpdate()}>
                <RefreshCw className="size-4" aria-hidden /> Perbarui
              </Button>
            </Card>
          )}
          {rejected > 0 && (
            <Alert>
              {rejected} perubahan ditolak server (mis. lewat batas koreksi). Lihat di Uji Kesiapan.
            </Alert>
          )}
          {problem && <Alert tone="error">{problem}</Alert>}
        </div>

        <Card className="overflow-hidden p-0">
          <div className="relative aspect-square bg-ink">
            <video ref={camera.videoRef} playsInline muted className="size-full object-cover" />
            {camera.state === "running" && (
              <>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-[18%] border-2 border-dashed border-acid"
                />
                {camera.torch.supported && (
                  <button
                    type="button"
                    onClick={() => void camera.toggleTorch()}
                    aria-pressed={camera.torch.on}
                    aria-label="Senter"
                    className={`absolute top-3 right-3 grid size-11 place-items-center border-2 border-ink ${camera.torch.on ? "bg-acid" : "bg-paper"}`}
                  >
                    <Flashlight className="size-5" aria-hidden />
                  </button>
                )}
              </>
            )}
            {camera.state !== "running" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink p-6 text-center text-bone">
                <CameraOff className="size-10" aria-hidden />
                {camera.error && <p className="text-sm">{camera.error}</p>}
                <Button
                  className="h-14 px-6"
                  onClick={() => void camera.start()}
                  disabled={camera.state === "starting" || status.revoked}
                >
                  <Camera className="size-5" aria-hidden />
                  {camera.state === "starting" ? "Membuka…" : "Aktifkan kamera"}
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t-2 border-ink px-3 py-2">
            <p className="text-xs text-ink-soft">
              {camera.state === "running"
                ? `Arahkan ke QR tamu${camera.detectorKind ? ` · pembaca ${camera.detectorKind === "native" ? "bawaan" : "WASM"}` : ""}`
                : "Kamera mati"}
            </p>
            {camera.state === "running" && (
              <Button size="sm" variant="secondary" onClick={camera.stop}>
                Matikan
              </Button>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <ManualPanel
            disabled={status.revoked}
            idle={outcome === null && !walkinOpen}
            onPick={(guest) => void run(() => checkIn(guest, "search"))}
            onCode={(code) => void run(() => handleScan(code, "code"))}
            onWalkin={() => setWalkinOpen(true)}
          />
          {lastOk && <LastPanel key={lastOk.checkinId} last={lastOk} />}
        </div>
      </main>

      {outcome && <ResultOverlay outcome={outcome} onClose={() => setOutcome(null)} />}
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
    <Card className="flex flex-col gap-3">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label htmlFor="cari-tamu" className="tag">
          Lupa QR? Cari nama atau ketik kode
        </label>
        <div className="flex gap-2">
          <Input
            id="cari-tamu"
            ref={inputRef}
            type="search"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Nama tamu atau kode 6 karakter"
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" aria-label="Cari" disabled={disabled || !query.trim()}>
            <Search className="size-4" aria-hidden />
          </Button>
        </div>
      </form>

      {found.length > 0 && (
        <ul className="flex flex-col border-2 border-ink">
          {found.map(({ guest, checkedIn }) => (
            <li key={guest.id} className="border-b border-bone-2 last:border-b-0">
              <button
                type="button"
                onClick={() => pick(guest)}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-acid"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{guest.displayName}</span>
                  <span className="block truncate text-xs text-ink-soft">
                    Kuota {guest.quota}
                    {guest.code ? ` · ${guest.code}` : " · tamu baru"}
                  </span>
                </span>
                {checkedIn && <Badge variant="solid">Sudah masuk</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && found.length === 0 && (
        <p className="text-sm text-ink-soft">Tidak ada yang cocok.</p>
      )}

      <Button variant="secondary" onClick={onWalkin} disabled={disabled}>
        <UserPlus className="size-4" aria-hidden />
        Tamu baru (tidak di daftar)
      </Button>
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
  return (
    <Card className="flex flex-col gap-3 p-3">
      <p className="tag">Terakhir masuk</p>
      <p className="font-display text-xl leading-tight font-bold">{last.view.guest.displayName}</p>
      {done ? (
        <p className="text-sm">{done}</p>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-lg font-semibold">{pax} orang</span>
          {canCorrect ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                aria-label="Kurangi satu orang"
                disabled={pax <= 1}
                onClick={() =>
                  void guarded(async () => {
                    await changePax(last.checkinId, pax - 1);
                    setPax(pax - 1);
                  })
                }
              >
                −
              </Button>
              <Button
                size="sm"
                variant="secondary"
                aria-label="Tambah satu orang"
                onClick={() =>
                  void guarded(async () => {
                    await changePax(last.checkinId, pax + 1);
                    setPax(pax + 1);
                  })
                }
              >
                +
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  void guarded(async () => {
                    await undoCheckin(last.checkinId);
                    setDone("Check-in dibatalkan.");
                  })
                }
              >
                Batal
              </Button>
            </div>
          ) : (
            <span className="text-xs text-ink-soft">Batas koreksi lewat. Minta admin.</span>
          )}
        </div>
      )}
      {canCorrect && (
        <p className="text-xs text-ink-soft">
          Bisa dikoreksi {Math.ceil(remaining / 1000)} detik lagi.
        </p>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </Card>
  );
}
