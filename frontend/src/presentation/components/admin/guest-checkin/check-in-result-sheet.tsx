"use client";

import { useEffect } from "react";
import { XCircle, AlertTriangle, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Guest } from "@/src/domain/services/guest.service";
import { cn } from "@/src/lib/utils";

export type ResultStatus = "success" | "error" | "warning";

interface CheckInResultSheetProps {
  open: boolean;
  status: ResultStatus;
  message: string;
  at: string;
  guest: Guest | null;
  vip?: boolean;
  ctaLabel?: string;
  autoDismissMs?: number;
  onClose: () => void;
}

const STATUS_META: Record<
  ResultStatus,
  {
    title: string;
    Icon: LucideIcon | null;
    discClass: string;
    barClass: string;
    eyebrowClass: string;
  }
> = {
  success: {
    title: "Check-in Berhasil",
    Icon: null,
    discClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    barClass: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    eyebrowClass: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    title: "Check-In Gagal",
    Icon: XCircle,
    discClass: "bg-destructive/10 text-destructive",
    barClass: "bg-destructive",
    eyebrowClass: "text-destructive",
  },
  warning: {
    title: "Perhatian",
    Icon: AlertTriangle,
    discClass: "bg-orange-500/10 text-orange-500 dark:text-orange-400",
    barClass: "bg-orange-500",
    eyebrowClass: "text-orange-600 dark:text-orange-400",
  },
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

export function CheckInResultSheet({
  open,
  status,
  message,
  at,
  guest,
  vip = false,
  ctaLabel = "Pindai Tamu Berikutnya",
  autoDismissMs,
  onClose,
}: CheckInResultSheetProps) {
  const hasAutoDismiss = typeof autoDismissMs === "number";

  useEffect(() => {
    if (!open || !hasAutoDismiss) return;
    const timer = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(timer);
  }, [open, hasAutoDismiss, autoDismissMs]);

  if (!open) return null;

  const statusMeta = STATUS_META[status];
  const vipHighlight = vip && status === "success";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-in bg-black/70 fade-in backdrop-blur-md duration-200"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full overflow-hidden border bg-card shadow-[0_-12px_48px_rgba(0,0,0,0.28)] animate-in fade-in slide-in-from-bottom-8 duration-300 sm:max-w-[400px] sm:rounded-[28px] sm:slide-in-from-bottom-4",
          "rounded-t-[28px] pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5",
          vipHighlight ? "border-amber-400/40" : "border-border/50"
        )}
      >
        {/* Handle drag ala bottom sheet */}
        <div className="mx-auto mb-5 mt-3 h-1.5 w-10 rounded-full bg-muted-foreground/25 sm:hidden" />

        {/* Header status */}
        <div className="flex items-center gap-3.5 px-6 pt-6 text-left sm:pt-7">
          <div
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center rounded-2xl",
              vipHighlight
                ? "bg-gradient-to-br from-amber-400/25 to-yellow-500/10 text-amber-500 dark:text-amber-300"
                : statusMeta.discClass
            )}
          >
            {statusMeta.Icon ? (
              <statusMeta.Icon className="size-7" strokeWidth={1.9} />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="size-7"
              >
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={22}
                  strokeDashoffset={22}
                  style={{
                    animation: "drawStroke 0.45s ease-out 0.15s forwards",
                  }}
                />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-[11px] font-extrabold uppercase tracking-[0.14em]",
                vipHighlight
                  ? "text-amber-600 dark:text-amber-300"
                  : statusMeta.eyebrowClass
              )}
            >
              {vipHighlight ? "Selamat Datang, Tamu VIP!" : statusMeta.title}
            </p>
            {at ? (
              <p className="mt-1 truncate text-[12.5px] font-medium text-muted-foreground">
                Tercatat pukul {at}
              </p>
            ) : null}
          </div>
        </div>

        {guest ? (
          <>
            {/* Kartu tamu */}
            <div className="mx-6 mt-5 flex items-center gap-4 rounded-3xl border border-border/40 bg-muted/30 p-4 text-left">
              <div
                className={cn(
                  "relative flex size-14 shrink-0 items-center justify-center rounded-full text-[17px] font-extrabold text-white",
                  vipHighlight
                    ? "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/25"
                    : "bg-gradient-to-br from-primary to-primary/75 shadow-lg shadow-primary/20"
                )}
              >
                {initialsOf(guest.name) || "?"}
                {vipHighlight ? (
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-amber-400 text-amber-950">
                    <Crown
                      className="size-3"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </span>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-extrabold leading-snug tracking-tight text-foreground">
                  {guest.name}
                </p>
                <span
                  className={cn(
                    "mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                    vipHighlight
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                      : status === "success"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border/60 bg-muted/60 text-muted-foreground"
                  )}
                >
                  {vipHighlight ? (
                    <Crown
                      className="size-3 shrink-0"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ) : null}
                  <span className="truncate">{guest.category_name || "Tamu"}</span>
                </span>
              </div>
            </div>

            {/* Perforasi ala tiket */}
            <div
              aria-hidden
              className="mx-6 mt-5 border-t border-dashed border-border/60"
            />

            <p className="mt-4 px-6 text-left text-[13px] leading-snug text-muted-foreground">
              {message}
            </p>
          </>
        ) : (
          <p className="mt-4 px-6 text-left text-[13px] leading-snug text-muted-foreground">
            {message}
          </p>
        )}

        <div className="px-6">
          <button
            onClick={onClose}
            className="mt-5 h-[52px] w-full cursor-pointer rounded-2xl bg-primary text-[15px] font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
          >
            {ctaLabel}
          </button>
        </div>

        <style>{`
          @keyframes drawStroke {
            to { stroke-dashoffset: 0; }
          }
          @keyframes growWidth {
            from { width: 0%; }
            to { width: 100%; }
          }
          .animate-grow {
            animation: growWidth linear forwards;
          }
        `}</style>
        {hasAutoDismiss ? (
          <div
            className={cn(
              "absolute bottom-0 left-0 h-1 animate-grow",
              vipHighlight ? "bg-amber-400" : statusMeta.barClass
            )}
            style={{ animationDuration: `${autoDismissMs}ms` }}
          />
        ) : null}
      </div>
    </div>
  );
}
