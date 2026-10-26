import { Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, CircleAlert, CircleCheck, CircleX, RefreshCw } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/kit/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { applyUpdate, usePwaState } from "../../lib/pwa.js";
import { clockOffset } from "../../lib/scan/clock.js";
import { db, getMeta, pendingCount } from "../../lib/scan/db.js";
import { formatAgo } from "../../lib/scan/format.js";
import { type QrSelfTest, runQrSelfTest } from "../../lib/scan/selftest.js";
import { syncEngine, useSyncStatus } from "../../lib/scan/sync.js";
import { APP_VERSION } from "../../lib/scan/version.js";

type State = "ok" | "warn" | "fail";
type Check = { id: string; label: string; state: State; detail: string; action?: ReactNode };

const ICON = {
  ok: <CircleCheck className="size-5 shrink-0" aria-label="Baik" />,
  warn: <CircleAlert className="size-5 shrink-0" aria-label="Perlu perhatian" />,
  fail: <CircleX className="size-5 shrink-0 text-destructive" aria-label="Bermasalah" />,
};

const STALE_SYNC_MS = 10 * 60 * 1000;

async function testCamera(): Promise<string> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    for (const track of stream.getTracks()) track.stop();
    return "ok";
  } catch (err) {
    return err instanceof DOMException && err.name === "NotAllowedError"
      ? "Izin kamera ditolak"
      : "Kamera tidak bisa dibuka";
  }
}

/** Dijalankan di H-1: memastikan perangkat benar-benar siap bila internet mati. */
export function ReadinessPage() {
  const status = useSyncStatus();
  const pwa = usePwaState();
  const guestCount = useLiveQuery(() => db.guests.count(), [], 0);
  const pending = useLiveQuery(() => pendingCount(), [], 0);
  const rejected = useLiveQuery(() => db.rejected.toArray(), [], []);
  const event = useLiveQuery(() => getMeta("event"), []);
  const auth = useLiveQuery(() => getMeta("auth"), []);

  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<string | null>(null);
  const [qr, setQr] = useState<QrSelfTest | "running" | null>(null);
  const [now, setNow] = useState(Date.now());

  const refreshPersisted = useCallback(async () => {
    setPersisted((await navigator.storage?.persisted?.()) ?? false);
  }, []);

  const testQr = useCallback(async () => {
    setQr("running");
    setQr(await runQrSelfTest());
  }, []);

  useEffect(() => {
    void syncEngine.start();
    void refreshPersisted();
    void testQr();
    const timer = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, [refreshPersisted, testQr]);

  const offsetSeconds = Math.round(clockOffset() / 1000);
  const hasWorker = !!navigator.serviceWorker?.controller;

  const checks: Check[] = [
    {
      id: "perangkat",
      label: "Perangkat aktif",
      state: status.revoked ? "fail" : auth ? "ok" : "fail",
      detail: status.revoked
        ? "Dicabut oleh admin"
        : auth
          ? `Terpasang sebagai “${auth.deviceName}”`
          : "Belum dipasangkan",
    },
    {
      id: "offline",
      label: "Aplikasi tersimpan untuk offline",
      state: hasWorker ? "ok" : "warn",
      detail: hasWorker
        ? "Service worker aktif; aplikasi terbuka tanpa internet"
        : "Belum ada service worker. Muat ulang halaman sekali saat online (atau ini mode pengembangan).",
    },
    {
      id: "data",
      label: "Daftar tamu di perangkat",
      state: guestCount > 0 ? "ok" : "fail",
      detail:
        guestCount > 0
          ? `${guestCount} tamu tersimpan`
          : "Belum ada data. Hubungkan internet lalu sinkron.",
    },
    {
      id: "acara",
      label: "Acara check-in",
      state: event ? "ok" : "fail",
      detail: event ? event.name : "Acara belum diunduh",
    },
    {
      id: "server",
      label: "Server terjangkau",
      state: status.online ? "ok" : "warn",
      detail: status.online
        ? "Sinkronisasi terakhir berhasil"
        : (status.lastError ?? "Belum bisa menghubungi server. Scan tetap berjalan offline."),
    },
    {
      id: "sinkron",
      label: "Sinkronisasi terakhir",
      state: status.lastSyncAt && now - status.lastSyncAt < STALE_SYNC_MS ? "ok" : "warn",
      detail: status.lastSyncAt ? formatAgo(status.lastSyncAt, now) : "Belum pernah",
    },
    {
      id: "antrean",
      label: "Antrean kirim",
      state: pending === 0 ? "ok" : "warn",
      detail:
        pending === 0 ? "Kosong, semua check-in sudah terkirim" : `${pending} menunggu dikirim`,
    },
    {
      id: "ditolak",
      label: "Perubahan yang ditolak server",
      state: rejected.length === 0 ? "ok" : "warn",
      detail:
        rejected.length === 0
          ? "Tidak ada"
          : `${rejected.length} ditolak: ${[...new Set(rejected.map((r) => r.reason))].join("; ")}`,
    },
    {
      id: "jam",
      label: "Jam perangkat",
      state: Math.abs(offsetSeconds) < 30 ? "ok" : "warn",
      detail:
        offsetSeconds === 0
          ? "Sama dengan server"
          : `Selisih ${offsetSeconds > 0 ? "+" : ""}${offsetSeconds} detik. Waktu check-in dikoreksi otomatis.`,
    },
    {
      id: "penyimpanan",
      label: "Penyimpanan permanen",
      state: persisted ? "ok" : "warn",
      detail: persisted
        ? "Data tidak akan dihapus browser saat ruang penuh"
        : "Browser boleh menghapus data bila ruang penuh. Minta penyimpanan permanen.",
      action: persisted ? null : (
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.storage?.persist?.();
            await refreshPersisted();
          }}
        >
          Minta
        </Button>
      ),
    },
    {
      id: "pembaca-qr",
      label: "Pembaca QR",
      state: qr === null || qr === "running" ? "warn" : qr.ok ? "ok" : "fail",
      detail:
        qr === null || qr === "running"
          ? "Sedang menguji…"
          : qr.ok
            ? `QR contoh terbaca dalam ${qr.ms} ms memakai mesin ${qr.engine === "native" ? "bawaan perangkat" : "WASM (tanpa internet)"}`
            : qr.error,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => void testQr()}
          disabled={qr === "running"}
        >
          Tes ulang
        </Button>
      ),
    },
    {
      id: "kamera",
      label: "Kamera",
      state: camera === null ? "warn" : camera === "ok" ? "ok" : "fail",
      detail: camera === null ? "Belum dites" : camera === "ok" ? "Kamera bisa dibuka" : camera,
      action: (
        <Button size="sm" variant="outline" onClick={async () => setCamera(await testCamera())}>
          Tes kamera
        </Button>
      ),
    },
    {
      id: "versi",
      label: "Versi aplikasi",
      state: status.outdated ? "fail" : pwa.needRefresh ? "warn" : "ok",
      detail: status.outdated
        ? `Versi ${APP_VERSION} terlalu lama untuk server. Perbarui.`
        : pwa.needRefresh
          ? `Versi ${APP_VERSION}; versi baru tersedia`
          : `Versi ${APP_VERSION}`,
      action: pwa.needRefresh ? (
        <Button size="sm" onClick={() => void applyUpdate()}>
          Perbarui
        </Button>
      ) : null,
    },
  ];

  const problems = checks.filter((c) => c.state !== "ok");
  const failed = checks.some((c) => c.state === "fail");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <PageHeader
        tag="Hari-H"
        title="Uji kesiapan"
        description="Jalankan di H-1 pada setiap perangkat, lalu sekali lagi sebelum pintu dibuka."
        actions={
          <Link to="/scan" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="size-4" aria-hidden /> Scanner
          </Link>
        }
      />

      <Card className="px-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium">
            {problems.length === 0 ? "Siap" : failed ? "Belum siap" : "Perlu perhatian"}
          </p>
          <p className="text-sm">
            {problems.length === 0
              ? "Semua pemeriksaan lulus."
              : `${problems.length} dari ${checks.length} pemeriksaan perlu dicek.`}
          </p>
        </div>
        <Button size="sm" onClick={() => void syncEngine.syncNow()} disabled={status.syncing}>
          <RefreshCw className={`size-4 ${status.syncing ? "animate-spin" : ""}`} aria-hidden />
          Sinkron sekarang
        </Button>
      </Card>

      <ul className="flex flex-col gap-3">
        {checks.map((check) => (
          <li key={check.id}>
            <Card className="flex items-start gap-3 p-3">
              {ICON[check.state]}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{check.label}</p>
                <p className="text-sm break-words text-muted-foreground">{check.detail}</p>
              </div>
              {check.action}
              <Badge variant={check.state === "ok" ? "secondary" : "outline"}>
                {check.state === "ok" ? "OK" : check.state === "warn" ? "Cek" : "Gagal"}
              </Badge>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
