import { MAX_PAX } from "@wedding/shared";
import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { changePax, type Outcome, undoCheckin } from "../../lib/scan/actions.js";
import { formatClock } from "../../lib/scan/format.js";

const AUTO_CLOSE_MS = { ok: 2_500, already: 3_500, invalid: 3_500 } as const;

const THEME = {
  ok: "bg-ok text-paper",
  vip: "bg-acid text-ink border-[10px] border-ink",
  already: "bg-tone-1 text-ink",
  invalid: "bg-alert text-paper",
} as const;

/**
 * Hasil scan layar penuh dengan warna yang bisa dikenali dari jauh. Menutup sendiri agar antrean
 * jalan; menyentuh jumlah orang atau batal menghentikan penutupan otomatis.
 */
export function ResultOverlay({
  outcome,
  onClose,
}: {
  outcome: Exclude<Outcome, { status: "need_pax" }>;
  onClose: () => void;
}) {
  const [pax, setPax] = useState(outcome.status === "invalid" ? 0 : outcome.pax);
  const [error, setError] = useState<string | null>(null);
  const [interacted, setInteracted] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (interacted) return;
    const timer = setTimeout(() => closeRef.current(), AUTO_CLOSE_MS[outcome.status]);
    return () => clearTimeout(timer);
  }, [interacted, outcome.status]);

  const isVip = outcome.status === "ok" && outcome.view.group?.isVip === true;
  const theme = outcome.status === "ok" && isVip ? THEME.vip : THEME[outcome.status];

  async function guarded(run: () => Promise<void>) {
    setInteracted(true);
    setError(null);
    try {
      await run();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal");
    }
  }

  const adjust = (delta: number) => {
    if (outcome.status !== "ok") return;
    const next = Math.min(MAX_PAX, Math.max(1, pax + delta));
    if (next === pax) return;
    void guarded(async () => {
      await changePax(outcome.checkinId, next);
      setPax(next);
    });
  };

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Hasil scan"
      className={`fixed inset-0 z-50 flex flex-col justify-between gap-4 p-5 ${theme}`}
    >
      {!interacted && (
        <div className="absolute inset-x-0 top-0 h-2 bg-ink/20">
          <div
            className="h-full bg-ink"
            style={{ animation: `shrink ${AUTO_CLOSE_MS[outcome.status]}ms linear forwards` }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="tag border-2 border-current px-2 py-1">
            {outcome.status === "ok" && "Masuk"}
            {outcome.status === "already" && "Sudah masuk"}
            {outcome.status === "invalid" && "Tidak valid"}
          </span>
          {isVip && <Badge variant="solid">VIP</Badge>}
        </div>

        {outcome.status === "invalid" ? (
          <>
            <p className="font-display text-4xl font-bold tracking-h1 uppercase">
              Kode tidak dikenal
            </p>
            <p className="font-mono text-xl break-all">{outcome.code}</p>
            <p className="text-lg">Minta tamu menunjukkan undangannya, atau cari namanya.</p>
          </>
        ) : (
          <>
            <p className="font-display text-5xl leading-none font-bold tracking-h1 break-words">
              {outcome.view.guest.displayName}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {outcome.view.group && (
                <span className="tag border-2 border-current px-2 py-1">
                  {outcome.view.group.name}
                </span>
              )}
              {outcome.view.guest.isRombongan && <span className="tag px-2 py-1">Rombongan</span>}
            </div>
            {outcome.view.guest.usherNote && (
              <p className="border-2 border-current p-3 text-xl font-semibold">
                {outcome.view.guest.usherNote}
              </p>
            )}
            {outcome.status === "already" && (
              <p className="text-xl">
                Masuk pukul <b>{formatClock(outcome.scannedAt)}</b> lewat {outcome.by},{" "}
                <b>{outcome.pax} orang</b>.
              </p>
            )}
          </>
        )}

        {outcome.status === "ok" && (
          <div className="flex flex-col gap-2">
            <p className="tag">Orang yang masuk</p>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                className="h-16 w-16 text-ink"
                aria-label="Kurangi satu orang"
                onClick={() => adjust(-1)}
                disabled={pax <= 1}
              >
                <Minus className="size-7" aria-hidden />
              </Button>
              <span
                className="min-w-16 text-center font-mono text-6xl font-bold"
                aria-live="polite"
              >
                {pax}
              </span>
              <Button
                variant="secondary"
                className="h-16 w-16 text-ink"
                aria-label="Tambah satu orang"
                onClick={() => adjust(1)}
                disabled={pax >= MAX_PAX}
              >
                <Plus className="size-7" aria-hidden />
              </Button>
            </div>
          </div>
        )}
        {error && <Alert tone="error">{error}</Alert>}
      </div>

      <div className="flex flex-col gap-3">
        {outcome.status === "ok" && (
          <Button
            variant="destructive"
            className="h-14"
            onClick={() =>
              void guarded(async () => {
                await undoCheckin(outcome.checkinId);
                onClose();
              })
            }
          >
            Batalkan check-in
          </Button>
        )}
        <Button className="h-16 text-base" onClick={onClose}>
          {outcome.status === "ok" ? "Lanjut scan" : "Tutup"}
        </Button>
      </div>
    </div>
  );
}
