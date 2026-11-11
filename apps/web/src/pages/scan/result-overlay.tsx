import { MAX_PAX } from "@wedding/shared";
import {
  AlertTriangle,
  Check,
  Clock,
  Info,
  Minus,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/kit/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { changePax, type Outcome, undoCheckin } from "../../lib/scan/actions.js";
import { formatClock } from "../../lib/scan/format.js";

// Check-in berhasil cukup sekilas supaya antrean jalan; hasil yang butuh dibaca (sudah masuk, tidak
// valid) lebih lama. VIP berhasil juga lebih lama agar penjaga sempat membaca catatan dan menyambut.
const AUTO_CLOSE_MS = { ok: 1_500, vip: 6_000, already: 3_500, invalid: 3_500 } as const;

type Tone = "ok" | "vip" | "already" | "invalid";

// Gaya kartu admin di atas latar yang diberi warna lembut sesuai hasil: hijau masuk, kuning sudah
// masuk, merah tidak valid. Warna utamanya ada di lingkaran ikon besar dan label status, supaya
// tetap terbaca sekilas dari jauh. Di mode gelap tint dipertebal agar warnanya tetap terlihat.
// VIP: latar biru langit (bukan hijau, supaya beda dari tamu biasa), lingkaran navy dengan kilau emas (mode
// gelap dibalik), plus lencana hijau "Silakan masuk" agar tidak tertukar dengan penolakan.
const TONE: Record<Tone, { tint: string; icon: string; ring: string; label: string }> = {
  ok: {
    tint: "bg-success/10 dark:bg-success/25",
    icon: "bg-success text-white",
    ring: "ring-success/15",
    label: "text-success",
  },
  vip: {
    tint: "bg-sky-500/15 dark:bg-sky-500/25",
    icon: "bg-[#0f172a] text-amber-200 dark:bg-amber-200 dark:text-[#0f172a]",
    ring: "ring-[#0f172a]/10 dark:ring-amber-200/20",
    label: "text-success",
  },
  already: {
    tint: "bg-warning/15 dark:bg-warning/25",
    icon: "bg-warning text-black",
    ring: "ring-warning/20",
    label: "text-amber-700 dark:text-warning",
  },
  invalid: {
    tint: "bg-destructive/10 dark:bg-destructive/25",
    icon: "bg-destructive text-white",
    ring: "ring-destructive/15",
    label: "text-destructive",
  },
};

const LABEL = { ok: "Silakan masuk", already: "Sudah masuk", invalid: "Tidak valid" } as const;
const ICON = { ok: Check, already: AlertTriangle, invalid: X } as const;

/** Kotak gaya `Card` admin. */
const CARD = "rounded-xl border bg-card text-card-foreground shadow-sm";

/**
 * Hasil scan layar penuh. Menutup sendiri agar antrean jalan; menyentuh jumlah orang atau batal
 * menghentikan penutupan otomatis.
 *
 * Tata letak: HP tegak = satu kolom, tombol di bawah. Layar lebar (tablet, laptop) dan HP mendatar =
 * dua kolom: identitas tamu di kiri, rincian dan tombol di kanan.
 */
export function ResultOverlay({
  outcome,
  onClose,
  onSearch,
}: {
  outcome: Exclude<Outcome, { status: "need_pax" }>;
  onClose: () => void;
  /** Kode tidak dikenal: tutup hasil lalu buka pencarian nama. */
  onSearch?: () => void;
}) {
  const [pax, setPax] = useState(outcome.status === "invalid" ? 0 : outcome.pax);
  const [error, setError] = useState<string | null>(null);
  const [interacted, setInteracted] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const isVip = outcome.status !== "invalid" && outcome.view.group?.isVip === true;
  const vipOk = outcome.status === "ok" && isVip;
  const closeMs = AUTO_CLOSE_MS[vipOk ? "vip" : outcome.status];

  useEffect(() => {
    if (interacted) return;
    const timer = setTimeout(() => closeRef.current(), closeMs);
    return () => clearTimeout(timer);
  }, [interacted, closeMs]);

  const tone = TONE[vipOk ? "vip" : outcome.status];

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

  const Icon = vipOk ? Sparkles : ICON[outcome.status];
  const guest = outcome.status === "invalid" ? null : outcome.view.guest;
  const group = outcome.status === "invalid" ? null : outcome.view.group;
  const time = outcome.status === "invalid" ? null : formatClock(outcome.scannedAt);

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Hasil scan"
      onPointerDown={(event) => {
        if (!(event.target as HTMLElement).closest("button")) onClose();
      }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background pt-[env(safe-area-inset-top)] text-foreground duration-150 animate-in fade-in"
    >
      <div aria-hidden className={cn("pointer-events-none fixed inset-0", tone.tint)} />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-5 pt-10 sm:p-8 short:max-w-4xl short:p-4 md:grid md:max-w-5xl md:grid-cols-2 md:items-center md:gap-10 md:p-12 lg:gap-16 short:grid short:grid-cols-2 short:items-center short:gap-6">
        {/* Identitas: ikon, status, nama. */}
        <div className="flex flex-col items-center gap-3 pt-6 text-center md:items-start md:pt-0 short:pt-0 md:text-start short:items-start short:text-start">
          <span
            className={cn(
              "relative grid size-22 place-items-center rounded-full ring-[10px] duration-300 animate-in zoom-in-50 short:size-14 short:ring-[6px]",
              tone.icon,
              tone.ring,
            )}
          >
            <Icon
              className={cn("size-11 short:size-7", vipOk ? "stroke-2" : "stroke-[2.75]")}
              aria-hidden
            />
          </span>

          {vipOk ? (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Badge className="px-2.5 py-1 text-xs font-semibold tracking-widest">TAMU VIP</Badge>
              <Badge className="border-transparent bg-success px-2.5 py-1 text-xs font-semibold text-white">
                <Check className="stroke-[3]" aria-hidden />
                Silakan masuk · {time}
              </Badge>
            </div>
          ) : (
            <p className={cn("mt-1 text-sm font-semibold tracking-[0.12em] uppercase", tone.label)}>
              {LABEL[outcome.status]}
              {outcome.status === "ok" && ` · ${time}`}
            </p>
          )}

          <h2
            className={cn(
              "text-[2.125rem] leading-[1.1] font-bold tracking-tight [overflow-wrap:anywhere] sm:text-5xl short:text-3xl",
              vipOk && "text-4xl sm:text-6xl",
            )}
          >
            {guest ? guest.displayName : "Kode tidak dikenal"}
          </h2>

          {guest && ((isVip && !vipOk) || group || guest.isRombongan) && (
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {isVip && !vipOk && (
                <Chip className="border-transparent bg-primary text-primary-foreground">
                  <Sparkles aria-hidden />
                  VIP
                </Chip>
              )}
              {group && <Chip>{group.name}</Chip>}
              {guest.isRombongan && (
                <Chip>
                  <Users aria-hidden />
                  Rombongan
                </Chip>
              )}
            </div>
          )}
        </div>

        {/* Rincian dan tombol (tombol menempel di dasar layar HP). */}
        <div className="flex flex-1 flex-col gap-4 md:flex-none">
          {guest?.usherNote && (
            <div className={cn(CARD, "flex items-start gap-3 p-4", vipOk && "border-primary")}>
              <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Catatan penjaga</p>
                <p className="text-lg font-semibold">{guest.usherNote}</p>
              </div>
            </div>
          )}

          {outcome.status === "already" && (
            <dl className={cn(CARD, "divide-y px-4")}>
              <Row icon={<Clock className="size-5" aria-hidden />} label="Masuk pukul">
                {formatClock(outcome.scannedAt)}
              </Row>
              <Row icon={<Smartphone className="size-5" aria-hidden />} label="Lewat">
                {outcome.by}
              </Row>
              <Row icon={<Users className="size-5" aria-hidden />} label="Jumlah">
                {outcome.pax} orang
              </Row>
            </dl>
          )}

          {outcome.status === "invalid" && (
            <div className={cn(CARD, "grid gap-1.5 p-4")}>
              <p className="text-xs font-medium text-muted-foreground">Kode yang terbaca</p>
              <p className="font-mono text-2xl font-semibold break-all">{outcome.code}</p>
              <p className="mt-1 text-muted-foreground">
                Minta tamu menunjukkan undangannya, atau cari namanya.
              </p>
            </div>
          )}

          {outcome.status === "ok" && (
            <div className={cn(CARD, "flex items-center justify-between gap-4 p-3 ps-4")}>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Orang yang masuk</p>
                <p className="text-4xl leading-none font-bold tabular-nums" aria-live="polite">
                  {pax}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="size-13"
                  aria-label="Kurangi satu orang"
                  onClick={() => adjust(-1)}
                  disabled={pax <= 1}
                >
                  <Minus className="size-5" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  className="size-13"
                  aria-label="Tambah satu orang"
                  onClick={() => adjust(1)}
                  disabled={pax >= MAX_PAX}
                >
                  <Plus className="size-5" aria-hidden />
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}

          <div
            className={cn(
              "mt-auto grid gap-2.5 pb-[env(safe-area-inset-bottom)] md:mt-2",
              outcome.status === "ok" && "grid-cols-[auto_1fr]",
              outcome.status === "invalid" && onSearch && "grid-cols-2",
            )}
          >
            {outcome.status === "ok" && (
              <Button
                variant="outline"
                className="h-13 px-4 text-base short:h-11"
                onClick={() =>
                  void guarded(async () => {
                    await undoCheckin(outcome.checkinId);
                    onClose();
                  })
                }
              >
                <Undo2 aria-hidden />
                Batalkan check-in
              </Button>
            )}
            {outcome.status === "invalid" && onSearch && (
              <Button variant="outline" className="h-13 text-base short:h-11" onClick={onSearch}>
                <Search aria-hidden />
                Cari nama
              </Button>
            )}
            <Button
              className="relative h-13 overflow-hidden text-base short:h-11"
              onClick={onClose}
            >
              {/* Sisa waktu sebelum menutup sendiri: garis tipis di dasar tombol yang menyusut. */}
              {!interacted && (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
                  style={{
                    animation: `shrink ${closeMs}ms linear forwards`,
                  }}
                />
              )}
              <span className="relative">{outcome.status === "ok" ? "Lanjut scan" : "Tutup"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Badge variant="outline" className={cn("bg-card px-2.5 py-1 text-sm", className)}>
      {children}
    </Badge>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="text-muted-foreground">{icon}</span>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ms-auto text-lg font-semibold">{children}</dd>
    </div>
  );
}
