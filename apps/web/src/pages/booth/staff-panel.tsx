import { useLiveQuery } from "dexie-react-hooks";
import { Maximize, Printer, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/ui/card";
import type { useBoothCamera } from "../../lib/booth/camera.js";
import {
  type BoothPhotoRow,
  boothDb,
  countPending,
  getBoothMeta,
  releaseBooth,
  requestPersistentStorage,
} from "../../lib/booth/db.js";
import { formatPhotoNumber } from "../../lib/booth/frames.js";

const RECENT = 12;

/**
 * Panel petugas booth: pilih kamera, layar penuh, cetak ulang, status unggah, dan lepas perangkat.
 * Sengaja tersembunyi di balik tombol kecil agar tamu tidak membukanya.
 */
export function StaffPanel({
  camera,
  onClose,
  onReprint,
  onSyncNow,
  onUnpaired,
}: {
  camera: ReturnType<typeof useBoothCamera>;
  onClose: () => void;
  onReprint: (row: BoothPhotoRow) => void;
  onSyncNow: () => void;
  onUnpaired: () => void;
}) {
  const auth = useLiveQuery(() => getBoothMeta("auth"), []);
  const recent = useLiveQuery(
    () => boothDb.photos.orderBy("takenAt").reverse().limit(RECENT).toArray(),
    [],
    [],
  );
  const total = useLiveQuery(() => boothDb.photos.count(), [], 0);
  const pending = useLiveQuery(() => countPending(), [], 0);
  const failed = useLiveQuery(
    () => boothDb.photos.filter((p) => !p.uploadedAt && !!p.uploadError).first(),
    [],
  );
  const authError = useLiveQuery(() => getBoothMeta("authError"), [], null);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    void requestPersistentStorage().then(setPersisted);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function release() {
    try {
      // Pengecekan foto tertunda ada di dalam releaseBooth (bukan dari hitungan layar yang bisa
      // belum termuat), jadi foto yang belum terunggah tidak mungkin ikut terhapus.
      await releaseBooth();
      onUnpaired();
    } catch (err) {
      setConfirmRelease(false);
      setMessage(err instanceof Error ? err.message : "Gagal melepas perangkat");
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel petugas"
      className="fixed inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Panel petugas</h2>
            <p className="text-muted-foreground">
              {auth?.deviceName ?? "-"} · {total} foto di laptop ini · {pending} menunggu unggah
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Tutup (Esc)
          </Button>
        </div>

        {failed?.uploadError && (
          <Alert tone="error">
            Foto no. {formatPhotoNumber(failed.number)} ditolak server: {failed.uploadError}
          </Alert>
        )}
        {message && <Alert tone="error">{message}</Alert>}
        {authError && (
          <Alert tone="error">
            {authError} Buat kode pairing baru di admin (menu Perangkat, jenis Photobooth), lalu
            buka{" "}
            <a href="/booth/pasang" className="underline">
              /booth/pasang
            </a>
            . Foto di laptop ini tidak dihapus dan ikut terunggah setelah dipasangkan ulang.
          </Alert>
        )}
        {persisted === false && (
          <Alert>
            Penyimpanan belum permanen: browser boleh menghapus foto bila disk hampir penuh. Pasang
            aplikasi (Install) atau pastikan ruang disk lega, dan jaga agar foto cepat terunggah.
          </Alert>
        )}

        <Card className="gap-4 p-5">
          <div className="grid gap-2">
            <label htmlFor="booth-camera" className="text-sm font-medium">
              Kamera
            </label>
            <select
              id="booth-camera"
              value={camera.deviceId ?? ""}
              onChange={(e) => void camera.choose(e.target.value)}
              className="min-h-11 rounded-md border bg-background px-3 text-base"
            >
              {camera.cameras.map((c) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {camera.size
                ? `Resolusi kamera: ${camera.size.width}×${camera.size.height}`
                : (camera.error ?? "Kamera belum menyala")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={toggleFullscreen}>
              <Maximize aria-hidden />
              Layar penuh
            </Button>
            <Button variant="outline" onClick={onSyncNow}>
              <Upload aria-hidden />
              Unggah sekarang
            </Button>
          </div>
        </Card>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">Cetak ulang</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada foto.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recent.map((row) => (
                <RecentPhoto key={row.id} row={row} onReprint={() => onReprint(row)} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2 border-t pt-6">
          {confirmRelease ? (
            <Card className="gap-3 border-destructive/40 p-4">
              <p className="text-sm">
                Semua foto di laptop ini akan dihapus dan booth harus dipasangkan ulang dengan kode
                baru. Lanjutkan?
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfirmRelease(false)}>
                  Batal
                </Button>
                <Button variant="destructive" onClick={() => void release()}>
                  Ya, lepas
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="self-start"
              onClick={() => setConfirmRelease(true)}
            >
              Lepas perangkat ini
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}

function RecentPhoto({ row, onReprint }: { row: BoothPhotoRow; onReprint: () => void }) {
  const url = useMemo(() => URL.createObjectURL(row.blob), [row.blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const time = new Date(row.takenAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li>
      <Card className="gap-2 p-2">
        <img
          src={url}
          alt={`Foto no. ${formatPhotoNumber(row.number)}`}
          className="aspect-[3/2] rounded-sm"
        />
        <p className="text-xs text-muted-foreground">
          No. {formatPhotoNumber(row.number)} · {time} · dicetak {row.printCount}×
          {row.uploadedAt ? " · terunggah" : ""}
        </p>
        <Button variant="outline" size="sm" onClick={onReprint}>
          <Printer aria-hidden />
          Cetak ulang
        </Button>
      </Card>
    </li>
  );
}
