import { MAX_PAX } from "@wedding/shared";
import { Minus, Plus, Users } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import type { GuestView } from "../../lib/scan/actions.js";

const DEFAULT_PAX = 2;
/** Jumlah yang paling sering muncul: satu ketukan mengisi, lalu tekan Catat masuk. */
const QUICK = [1, 2, 3, 4, 5, 6];

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
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-muted">
          <Users className="size-10" aria-hidden />
        </span>
        <p className="text-sm font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          Rombongan
        </p>
        <p className="text-5xl leading-tight font-bold break-words">{view.guest.displayName}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {view.group?.isVip && (
            <span className="rounded-full bg-warning px-4 py-1.5 text-sm font-bold text-black">
              VIP
            </span>
          )}
          {view.group && (
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: view.group.color }}
                aria-hidden
              />
              {view.group.name}
            </span>
          )}
        </div>
        {view.guest.usherNote && (
          <p className="w-full max-w-md rounded-2xl border bg-muted/50 p-4 text-start text-xl font-semibold">
            {view.guest.usherNote}
          </p>
        )}

        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <label htmlFor="jumlah-rombongan" className="text-sm font-medium">
            Berapa orang yang datang?
          </label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="size-16 rounded-full"
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
              className="h-20 w-28 rounded-2xl border bg-card text-center font-mono text-6xl font-bold"
            />
            <Button
              variant="outline"
              className="size-16 rounded-full"
              aria-label="Tambah satu orang"
              onClick={() => setPax((p) => clamp(p + 1))}
              disabled={pax >= MAX_PAX}
            >
              <Plus className="size-7" aria-hidden />
            </Button>
          </div>
          <fieldset className="m-0 grid w-full min-w-0 grid-cols-6 gap-2 border-0 p-0">
            <legend className="sr-only">Pilih cepat</legend>
            {QUICK.map((value) => (
              <Button
                key={value}
                variant={pax === value ? "default" : "outline"}
                className="h-12 text-lg"
                onClick={() => setPax(value)}
              >
                {value}
              </Button>
            ))}
          </fieldset>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
      </div>

      <div className="grid gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Button className="h-16 text-lg" onClick={() => void confirm()} disabled={busy}>
          Catat masuk · {pax} orang
        </Button>
        <Button variant="outline" className="h-12" onClick={onCancel} disabled={busy}>
          Batal
        </Button>
      </div>
    </div>
  );
}
