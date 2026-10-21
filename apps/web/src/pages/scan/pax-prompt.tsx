import { MAX_PAX } from "@wedding/shared";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import type { GuestView } from "../../lib/scan/actions.js";

const DEFAULT_PAX = 2;

/** Tamu rombongan: penjaga mengisi jumlah orang yang datang sebelum check-in dicatat. */
export function PaxPrompt({
  view,
  onConfirm,
  onCancel,
}: {
  view: GuestView;
  onConfirm: (pax: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [pax, setPax] = useState(DEFAULT_PAX);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clamp = (value: number) => Math.min(MAX_PAX, Math.max(1, value));

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(pax);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat");
      setBusy(false);
    }
  }

  return (
    <div
      role="alertdialog"
      aria-label="Jumlah orang rombongan"
      className="fixed inset-0 z-50 flex flex-col justify-between gap-4 bg-bone p-5 text-ink"
    >
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="tag border-2 border-current px-2 py-1">Rombongan</span>
          {view.group?.isVip && <Badge variant="solid">VIP</Badge>}
        </div>
        <p className="font-display text-5xl leading-none font-bold tracking-h1 break-words">
          {view.guest.displayName}
        </p>
        {view.group && (
          <span className="tag w-fit border-2 border-current px-2 py-1">{view.group.name}</span>
        )}
        {view.guest.usherNote && (
          <p className="border-2 border-current p-3 text-xl font-semibold">
            {view.guest.usherNote}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="jumlah-rombongan" className="tag">
            Berapa orang yang datang?
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="h-16 w-16"
              aria-label="Kurangi satu orang"
              onClick={() => setPax((p) => clamp(p - 1))}
              disabled={pax <= 1}
            >
              <Minus className="size-7" aria-hidden />
            </Button>
            <input
              id="jumlah-rombongan"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_PAX}
              value={pax}
              onChange={(e) => setPax(clamp(Math.trunc(Number(e.target.value)) || 1))}
              className="h-16 w-28 border-2 border-ink bg-paper text-center font-mono text-5xl font-bold"
            />
            <Button
              variant="secondary"
              className="h-16 w-16"
              aria-label="Tambah satu orang"
              onClick={() => setPax((p) => clamp(p + 1))}
              disabled={pax >= MAX_PAX}
            >
              <Plus className="size-7" aria-hidden />
            </Button>
          </div>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
      </div>

      <div className="flex flex-col gap-3">
        <Button className="h-16 text-base" onClick={() => void confirm()} disabled={busy}>
          Catat masuk · {pax} orang
        </Button>
        <Button variant="secondary" className="h-14" onClick={onCancel} disabled={busy}>
          Batal
        </Button>
      </div>
    </div>
  );
}
