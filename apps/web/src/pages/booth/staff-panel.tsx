import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
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

  const button =
    "min-h-11 border border-[#3a322b] px-4 text-left text-[15px] hover:border-[#a89a8a] disabled:opacity-40";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel petugas"
      className="absolute inset-0 z-10 overflow-y-auto bg-[#0e0c0a]/95 font-[Courier_Prime] text-[#efe6d6]"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[Bebas_Neue] text-5xl font-normal">PANEL PETUGAS</h2>
          <button type="button" onClick={onClose} className={button}>
            Tutup (Esc)
          </button>
        </div>

        <p className="text-sm text-[#a89a8a]">
          Perangkat: {auth?.deviceName ?? "-"} · {total} foto di laptop ini · {pending} menunggu
          unggah
        </p>
        {failed?.uploadError && (
          <p className="border border-[#c9784f] p-3 text-sm text-[#f0b08f]">
            Foto no. {formatPhotoNumber(failed.number)} ditolak server: {failed.uploadError}
          </p>
        )}
        {message && <p className="border border-[#c9784f] p-3 text-sm">{message}</p>}
        {authError && (
          <p className="border border-[#c9784f] p-3 text-sm text-[#f0b08f]">
            {authError} Buat kode pairing baru di admin (menu Perangkat), lalu buka{" "}
            <a href="/booth/pasang" className="underline">
              /booth/pasang
            </a>
            . Foto di laptop ini tidak dihapus dan ikut terunggah setelah dipasangkan ulang.
          </p>
        )}
        {persisted === false && (
          <p className="border border-[#c9784f] p-3 text-sm text-[#f0b08f]">
            Penyimpanan belum permanen: browser boleh menghapus foto bila disk hampir penuh. Pasang
            aplikasi (Install) atau pastikan ruang disk lega, dan jaga agar foto cepat terunggah.
          </p>
        )}

        <section className="flex flex-col gap-2">
          <label htmlFor="booth-camera" className="text-sm tracking-[.12em] text-[#a89a8a]">
            KAMERA
          </label>
          <select
            id="booth-camera"
            value={camera.deviceId ?? ""}
            onChange={(e) => void camera.choose(e.target.value)}
            className="min-h-11 border border-[#3a322b] bg-[#1a1612] px-3 text-base"
          >
            {camera.cameras.map((c) => (
              <option key={c.deviceId} value={c.deviceId}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-[#a89a8a]">
            {camera.size
              ? `Resolusi kamera: ${camera.size.width}×${camera.size.height}`
              : (camera.error ?? "Kamera belum menyala")}
          </p>
        </section>

        <section className="flex flex-wrap gap-2">
          <button type="button" onClick={toggleFullscreen} className={button}>
            Layar penuh
          </button>
          <button type="button" onClick={onSyncNow} className={button}>
            Unggah sekarang
          </button>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm tracking-[.12em] text-[#a89a8a]">CETAK ULANG</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-[#a89a8a]">Belum ada foto.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recent.map((row) => (
                <RecentPhoto key={row.id} row={row} onReprint={() => onReprint(row)} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2 border-t border-[#3a322b] pt-6">
          {confirmRelease ? (
            <div className="flex flex-col gap-3 border border-[#c9784f] p-4">
              <p className="text-sm">
                Semua foto di laptop ini akan dihapus dan booth harus dipasangkan ulang dengan kode
                baru. Lanjutkan?
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmRelease(false)} className={button}>
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => void release()}
                  className={`${button} border-[#c9784f]`}
                >
                  Ya, lepas
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmRelease(true)} className={button}>
              Lepas perangkat ini
            </button>
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
    <li className="flex flex-col gap-2 border border-[#3a322b] p-2">
      <img src={url} alt={`Foto no. ${formatPhotoNumber(row.number)}`} className="aspect-[3/2]" />
      <p className="text-xs text-[#a89a8a]">
        No. {formatPhotoNumber(row.number)} · {time} · dicetak {row.printCount}×
        {row.uploadedAt ? " · terunggah" : ""}
      </p>
      <button
        type="button"
        onClick={onReprint}
        className="min-h-11 border border-[#3a322b] text-sm"
      >
        Cetak ulang
      </button>
    </li>
  );
}
