import { MAX_PAX } from "@wedding/shared";
import {
  AlertTriangle,
  Check,
  Clock,
  Info,
  Minus,
  Plus,
  Smartphone,
  Sparkles,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/kit/button";
import { cn } from "@/lib/utils";
import { changePax, type Outcome, undoCheckin } from "../../lib/scan/actions.js";
import { formatClock } from "../../lib/scan/format.js";

// Check-in berhasil cukup sekilas supaya antrean jalan; hasil yang butuh dibaca (sudah masuk, tidak
// valid) lebih lama. VIP berhasil juga lebih lama agar penjaga sempat membaca catatan dan menyambut.
const AUTO_CLOSE_MS = { ok: 1_500, vip: 3_500, already: 3_500, invalid: 3_500 } as const;

type Skin = {
  /** Latar layar penuh dan warna teks. */
  root: string;
  /** Cahaya dekoratif di belakang isi. */
  glow: string;
  /** Lingkaran ikon. */
  badge: string;
  /** Denyut di sekitar ikon (hanya hasil berhasil). */
  ping?: string;
  label: string;
  name: string;
  chip: string;
  /** Kotak rincian (catatan, jumlah orang, info sudah masuk). */
  panel: string;
  /** Tombol sekunder di atas latar berwarna. */
  ghost: string;
  /** Tombol utama "Lanjut scan" / "Tutup". */
  primary: string;
};

// Warna penuh layar supaya hasilnya terbaca dari jauh: hijau masuk, kuning sudah masuk, merah tidak
// valid. VIP sengaja berbeda total (biru navy dan putih, ikon kilau) agar penjaga langsung tahu,
// tetapi tetap membawa pil hijau "Silakan masuk" supaya tidak tertukar dengan penolakan. Navy memakai
// warna tetap, bukan token tema, karena tampil sama di mode terang dan gelap.
const SKIN: Record<"ok" | "vip" | "already" | "invalid", Skin> = {
  ok: {
    root: "bg-success text-white",
    glow: "bg-[radial-gradient(120%_70%_at_50%_0%,rgb(255_255_255/0.28),transparent_60%)]",
    badge: "bg-white text-success shadow-[0_12px_40px_-8px_rgb(0_0_0/0.35)]",
    ping: "bg-white/40",
    label: "text-white/90",
    name: "text-white",
    chip: "bg-white/20 text-white",
    panel: "bg-black/15",
    ghost:
      "border border-white/35 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white disabled:opacity-40",
    primary: "bg-white text-black hover:bg-white/90",
  },
  vip: {
    root: "bg-[#0b1a3d] text-white",
    glow: "bg-[radial-gradient(90%_55%_at_50%_0%,rgb(96_165_250/0.30),transparent_65%),radial-gradient(70%_45%_at_50%_100%,rgb(30_64_175/0.45),transparent_70%)]",
    badge: "bg-white text-[#0b1a3d] shadow-[0_0_60px_-4px_rgb(147_197_253/0.6)]",
    ping: "bg-white/30",
    label: "text-blue-200",
    name: "text-white",
    chip: "border border-white/25 bg-white/10 text-white",
    panel: "border border-white/15 bg-white/[0.06]",
    ghost:
      "border border-white/30 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white disabled:opacity-40",
    primary: "bg-white text-[#0b1a3d] hover:bg-blue-50",
  },
  already: {
    root: "bg-warning text-black",
    glow: "bg-[radial-gradient(120%_70%_at_50%_0%,rgb(255_255_255/0.35),transparent_60%)]",
    badge: "bg-black text-warning shadow-[0_12px_40px_-8px_rgb(0_0_0/0.35)]",
    label: "text-black/80",
    name: "text-black",
    chip: "bg-black/10 text-black",
    panel: "bg-black/10",
    ghost:
      "border border-black/30 bg-black/5 text-black shadow-none hover:bg-black/10 hover:text-black",
    primary: "bg-black text-white hover:bg-black/85",
  },
  invalid: {
    root: "bg-destructive text-white",
    glow: "bg-[radial-gradient(120%_70%_at_50%_0%,rgb(255_255_255/0.22),transparent_60%)]",
    badge: "bg-white text-destructive shadow-[0_12px_40px_-8px_rgb(0_0_0/0.35)]",
    label: "text-white/90",
    name: "text-white",
    chip: "bg-white/20 text-white",
    panel: "bg-black/20",
    ghost:
      "border border-white/35 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white",
    primary: "bg-white text-black hover:bg-white/90",
  },
};

const LABEL = { ok: "Silakan masuk", already: "Sudah masuk", invalid: "Tidak valid" } as const;
const ICON = { ok: Check, already: AlertTriangle, invalid: X } as const;

/**
 * Hasil scan layar penuh dengan warna yang bisa dikenali dari jauh. Menutup sendiri agar antrean
 * jalan; menyentuh jumlah orang atau batal menghentikan penutupan otomatis.
 *
 * Tata letak: HP tegak = satu kolom, tombol di bawah. Layar lebar (tablet, laptop) dan HP mendatar =
 * dua kolom: identitas tamu di kiri, rincian dan tombol di kanan.
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

  const isVip = outcome.status !== "invalid" && outcome.view.group?.isVip === true;
  const vipOk = outcome.status === "ok" && isVip;
  const closeMs = AUTO_CLOSE_MS[vipOk ? "vip" : outcome.status];

  useEffect(() => {
    if (interacted) return;
    const timer = setTimeout(() => closeRef.current(), closeMs);
    return () => clearTimeout(timer);
  }, [interacted, closeMs]);

  const skin = vipOk ? SKIN.vip : SKIN[outcome.status];

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
    // biome-ignore lint/a11y/noStaticElementInteractions: ketuk di mana saja = lanjut; tombol tetap bisa dipakai lewat keyboard
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Hasil scan"
      onPointerDown={(event) => {
        if (!(event.target as HTMLElement).closest("button")) onClose();
      }}
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-y-auto pt-[env(safe-area-inset-top)] duration-150 animate-in fade-in",
        skin.root,
      )}
    >
      <div aria-hidden className={cn("pointer-events-none fixed inset-0", skin.glow)} />
      {vipOk && (
        // Bingkai tipis ganda berwarna putih: pembeda VIP yang terlihat dari jauh tanpa terasa kasar.
        <div aria-hidden className="pointer-events-none fixed inset-0">
          <div className="absolute inset-2.5 rounded-[28px] border-2 border-white/45 sm:inset-4" />
          <div className="absolute inset-4 rounded-[22px] border border-white/15 sm:inset-6" />
        </div>
      )}

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 sm:p-10 landscape:max-md:p-5 md:grid md:grid-cols-2 md:items-center md:gap-10 md:p-12 lg:gap-16">
        {/* Identitas: ikon, status, nama. */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center md:items-start md:text-start landscape:max-md:gap-2">
          <span className="relative grid size-24 place-items-center sm:size-28 landscape:max-md:size-16">
            {skin.ping && (
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-full [animation:ping_1.1s_cubic-bezier(0,0,0.2,1)_2]",
                  skin.ping,
                )}
              />
            )}
            <span
              className={cn(
                "relative grid size-full place-items-center rounded-full duration-300 animate-in zoom-in-50",
                skin.badge,
              )}
            >
              <Icon
                className="size-12 stroke-[2.75] sm:size-14 landscape:max-md:size-8"
                aria-hidden
              />
            </span>
          </span>

          {vipOk ? (
            <div className="flex flex-col items-center gap-3 md:items-start landscape:max-md:gap-2">
              <p
                className={cn(
                  "text-sm font-semibold tracking-[0.35em] uppercase sm:text-base",
                  skin.label,
                )}
              >
                Tamu VIP
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                <Check className="size-4 stroke-[3]" aria-hidden />
                Silakan masuk · {time}
              </span>
            </div>
          ) : (
            <p className={cn("text-sm font-semibold tracking-[0.2em] uppercase", skin.label)}>
              {LABEL[outcome.status]}
              {outcome.status === "ok" && ` · ${time}`}
            </p>
          )}

          {guest ? (
            <h2
              className={cn(
                "pb-1 text-4xl leading-[1.08] font-bold tracking-tight [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl landscape:max-md:text-3xl",
                vipOk && "sm:text-6xl lg:text-7xl",
                skin.name,
              )}
            >
              {guest.displayName}
            </h2>
          ) : (
            <h2 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl landscape:max-md:text-3xl">
              Kode tidak dikenal
            </h2>
          )}

          {guest && ((isVip && !vipOk) || group || guest.isRombongan) && (
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {isVip && !vipOk && (
                <Chip className="bg-[#0b1a3d] font-bold text-white">
                  <Sparkles className="size-4" aria-hidden />
                  VIP
                </Chip>
              )}
              {group && (
                <Chip className={skin.chip}>
                  <span
                    className="size-2.5 rounded-full ring-2 ring-current/40"
                    style={{ backgroundColor: group.color }}
                    aria-hidden
                  />
                  {group.name}
                </Chip>
              )}
              {guest.isRombongan && (
                <Chip className={skin.chip}>
                  <Users className="size-4" aria-hidden />
                  Rombongan
                </Chip>
              )}
            </div>
          )}
        </div>

        {/* Rincian dan tombol. */}
        <div className="flex flex-col gap-4">
          {guest?.usherNote && (
            <div className={cn("flex items-start gap-3 rounded-2xl p-4 text-start", skin.panel)}>
              <Info className="mt-0.5 size-5 shrink-0 opacity-80" aria-hidden />
              <div>
                <p className="text-xs font-medium tracking-wide uppercase opacity-75">
                  Catatan penjaga
                </p>
                <p className="text-xl font-semibold">{guest.usherNote}</p>
              </div>
            </div>
          )}

          {outcome.status === "already" && (
            <dl className={cn("grid gap-3 rounded-2xl p-4 text-start", skin.panel)}>
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
            <div className={cn("grid gap-3 rounded-2xl p-4 text-start", skin.panel)}>
              <p className="font-mono text-2xl font-semibold break-all">{outcome.code}</p>
              <p className="text-lg opacity-90">
                Minta tamu menunjukkan undangannya, atau cari namanya.
              </p>
            </div>
          )}

          {outcome.status === "ok" && (
            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-2xl p-3 ps-5",
                skin.panel,
              )}
            >
              <div>
                <p className="text-xs font-medium tracking-wide uppercase opacity-75">
                  Orang yang masuk
                </p>
                <p
                  className="font-mono text-5xl leading-none font-bold tabular-nums"
                  aria-live="polite"
                >
                  {pax}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className={cn("size-14 rounded-full", skin.ghost)}
                  aria-label="Kurangi satu orang"
                  onClick={() => adjust(-1)}
                  disabled={pax <= 1}
                >
                  <Minus className="size-6" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  className={cn("size-14 rounded-full", skin.ghost)}
                  aria-label="Tambah satu orang"
                  onClick={() => adjust(1)}
                  disabled={pax >= MAX_PAX}
                >
                  <Plus className="size-6" aria-hidden />
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-black/30 px-4 py-2 text-sm font-medium">
              {error}
            </p>
          )}

          <div
            className={cn(
              "mt-auto grid gap-3 pb-[env(safe-area-inset-bottom)] md:mt-2",
              outcome.status === "ok" &&
                "sm:grid-cols-[auto_1fr] landscape:max-md:grid-cols-[auto_1fr]",
            )}
          >
            <Button
              className={cn(
                "relative h-16 overflow-hidden rounded-xl text-lg font-semibold sm:order-2 landscape:max-md:order-2 landscape:max-md:h-12",
                skin.primary,
              )}
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
            {outcome.status === "ok" && (
              <Button
                variant="ghost"
                className={cn(
                  "h-12 rounded-xl sm:order-1 sm:h-16 sm:px-5 landscape:max-md:order-1 landscape:max-md:h-12",
                  skin.ghost,
                )}
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
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="opacity-70">{icon}</span>
      <dt className="text-base opacity-80">{label}</dt>
      <dd className="ms-auto text-xl font-bold">{children}</dd>
    </div>
  );
}
