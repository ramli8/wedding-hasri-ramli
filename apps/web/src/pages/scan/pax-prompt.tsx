import { MAX_PAX } from "@wedding/shared";
import { Info, Minus, Plus, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { type GuestView, isVipView } from "../../lib/scan/actions.js";

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
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background pt-[env(safe-area-inset-top)] text-foreground duration-150 animate-in fade-in"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-5 sm:p-8 short:p-4 md:grid md:grid-cols-2 md:items-center md:gap-10 md:p-10 lg:gap-16">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center md:items-start md:text-start short:gap-2">
          <span className="grid size-20 place-items-center rounded-full bg-muted sm:size-24 short:size-14">
            <Users className="size-10 sm:size-12 short:size-7" aria-hidden />
          </span>
          <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Rombongan
          </p>
          <h2 className="text-4xl leading-[1.1] font-bold tracking-tight break-words [overflow-wrap:anywhere] sm:text-5xl short:text-3xl">
            {view.guest.displayName}
          </h2>
          {(view.group || isVipView(view)) && (
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {isVipView(view) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b1a3d] px-4 py-1.5 text-sm font-bold text-white">
                  <Sparkles className="size-4" aria-hidden />
                  VIP
                </span>
              )}
              {view.group && (
                <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
                  {view.group.name}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {view.guest.usherNote && (
            <div className="flex items-start gap-3 rounded-xl border bg-muted/50 p-4 text-start">
              <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Catatan penjaga
                </p>
                <p className="text-xl font-semibold">{view.guest.usherNote}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 rounded-xl border bg-card p-4 sm:p-6">
            <label htmlFor="jumlah-rombongan" className="text-sm font-medium">
              Berapa orang yang datang?
            </label>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                className="size-14 rounded-full"
                aria-label="Kurangi satu orang"
                onClick={() => setPax((p) => clamp(p - 1))}
                disabled={pax <= 1}
              >
                <Minus className="size-6" aria-hidden />
              </Button>
              <input
                id="jumlah-rombongan"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_PAX}
                value={pax}
                onChange={(e) => setPax(clamp(Math.trunc(Number(e.target.value)) || 1))}
                className="h-20 w-28 [appearance:textfield] rounded-xl border [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none bg-background text-center font-mono text-5xl font-bold tabular-nums focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              />
              <Button
                variant="outline"
                className="size-14 rounded-full"
                aria-label="Tambah satu orang"
                onClick={() => setPax((p) => clamp(p + 1))}
                disabled={pax >= MAX_PAX}
              >
                <Plus className="size-6" aria-hidden />
              </Button>
            </div>
            <fieldset className="m-0 grid w-full min-w-0 grid-cols-6 gap-2 border-0 p-0">
              <legend className="sr-only">Pilih cepat</legend>
              {QUICK.map((value) => (
                <Button
                  key={value}
                  variant={pax === value ? "default" : "outline"}
                  className="h-12 text-lg tabular-nums"
                  onClick={() => setPax(value)}
                >
                  {value}
                </Button>
              ))}
            </fieldset>
          </div>
          {error && <Alert tone="error">{error}</Alert>}

          <div className="mt-auto grid gap-3 pb-[env(safe-area-inset-bottom)] sm:grid-cols-[auto_1fr] md:mt-2 short:grid-cols-[auto_1fr]">
            <Button
              className="h-16 text-lg sm:order-2 short:order-2 short:h-12"
              onClick={() => void confirm()}
              disabled={busy}
            >
              Catat masuk · {pax} orang
            </Button>
            <Button
              variant="outline"
              className="h-12 sm:order-1 sm:h-16 sm:px-6 short:order-1 short:h-12"
              onClick={onCancel}
              disabled={busy}
            >
              Batal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
