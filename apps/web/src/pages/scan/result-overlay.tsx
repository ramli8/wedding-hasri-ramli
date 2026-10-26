import { MAX_PAX } from "@wedding/shared";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Info,
  Minus,
  Plus,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/ui/badge";
import { changePax, type Outcome, undoCheckin } from "../../lib/scan/actions.js";
import { formatClock } from "../../lib/scan/format.js";

// Check-in berhasil cukup sekilas supaya antrean jalan; hasil yang butuh dibaca (sudah masuk, tidak valid) lebih lama.
const AUTO_CLOSE_MS = { ok: 1_500, already: 3_500, invalid: 3_500 } as const;

// Warna penuh layar supaya hasilnya terbaca dari jauh: hijau masuk, kuning sudah masuk, merah tidak valid.
// VIP tetap hijau tetapi berbingkai emas dan bermahkota.
const THEME = {
  ok: "bg-success text-white",
  vip: "bg-success text-white ring-[14px] ring-warning ring-inset",
  already: "bg-warning text-black",
  invalid: "bg-destructive text-white",
} as const;

const LABEL = { ok: "Masuk", already: "Sudah masuk", invalid: "Tidak valid" } as const;
const ICON = { ok: CheckCircle2, already: AlertTriangle, invalid: XCircle } as const;

// Tombol di atas latar berwarna: kaca tembus pandang yang mengikuti warna teks.
const glass =
  "border border-current/40 bg-white/15 text-current shadow-none hover:bg-white/25 hover:text-current";

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

  const Icon = isVip ? Crown : ICON[outcome.status];
  const guest = outcome.status === "invalid" ? null : outcome.view.guest;
  const group = outcome.status === "invalid" ? null : outcome.view.group;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ketuk di mana saja = lanjut; tombol tetap bisa dipakai lewat keyboard
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Hasil scan"
      onPointerDown={(event) => {
        if (!(event.target as HTMLElement).closest("button")) onClose();
      }}
      className={`fixed inset-0 z-50 flex flex-col ${theme}`}
    >
      {!interacted && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-black/20">
          <div
            className="h-full bg-white/80"
            style={{ animation: `shrink ${AUTO_CLOSE_MS[outcome.status]}ms linear forwards` }}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center">
        <span className="grid size-24 place-items-center rounded-full bg-white/20">
          <Icon className="size-14" aria-hidden />
        </span>
        <p className="text-sm font-semibold tracking-[0.25em] uppercase opacity-90">
          {LABEL[outcome.status]}
        </p>

        {outcome.status !== "invalid" && guest ? (
          <>
            <p className="text-5xl leading-tight font-bold break-words">{guest.displayName}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {isVip && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning px-4 py-1.5 text-sm font-bold text-black">
                  <Crown className="size-4" aria-hidden />
                  VIP
                </span>
              )}
              {group && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium">
                  <span
                    className="size-2.5 rounded-full ring-2 ring-white/70"
                    style={{ backgroundColor: group.color }}
                    aria-hidden
                  />
                  {group.name}
                </span>
              )}
              {guest.isRombongan && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium">
                  <Users className="size-4" aria-hidden />
                  Rombongan
                </span>
              )}
            </div>
            {guest.usherNote && (
              <div className="flex w-full max-w-md items-start gap-3 rounded-2xl bg-black/20 p-4 text-start">
                <Info className="mt-1 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-medium tracking-wide uppercase opacity-80">
                    Catatan penjaga
                  </p>
                  <p className="text-xl font-semibold">{guest.usherNote}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-4xl leading-tight font-bold">Kode tidak dikenal</p>
            <p className="rounded-xl bg-black/20 px-4 py-2 font-mono text-xl break-all">
              {outcome.status === "invalid" ? outcome.code : ""}
            </p>
            <p className="max-w-sm text-lg opacity-90">
              Minta tamu menunjukkan undangannya, atau cari namanya.
            </p>
          </>
        )}

        {outcome.status === "already" && (
          <p className="w-full max-w-md rounded-2xl bg-black/10 p-4 text-xl">
            Masuk pukul <b>{formatClock(outcome.scannedAt)}</b> lewat {outcome.by},{" "}
            <b>{outcome.pax} orang</b>.
          </p>
        )}

        {outcome.status === "ok" && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-medium tracking-wide uppercase opacity-80">
              Orang yang masuk
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className={`size-16 rounded-full ${glass}`}
                aria-label="Kurangi satu orang"
                onClick={() => adjust(-1)}
                disabled={pax <= 1}
              >
                <Minus className="size-7" aria-hidden />
              </Button>
              <span
                className="min-w-20 text-center font-mono text-7xl font-bold"
                aria-live="polite"
              >
                {pax}
              </span>
              <Button
                variant="ghost"
                className={`size-16 rounded-full ${glass}`}
                aria-label="Tambah satu orang"
                onClick={() => adjust(1)}
                disabled={pax >= MAX_PAX}
              >
                <Plus className="size-7" aria-hidden />
              </Button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-black/30 px-4 py-2 text-sm font-medium">
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Button
          className="h-16 bg-white text-lg font-semibold text-black hover:bg-white/90"
          onClick={onClose}
        >
          {outcome.status === "ok" ? "Lanjut scan" : "Tutup"}
        </Button>
        {outcome.status === "ok" && (
          <Button
            variant="ghost"
            className={`h-12 ${glass}`}
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
      </div>
    </div>
  );
}
