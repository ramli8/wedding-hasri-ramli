"use client";

import { useState } from "react";
import { CalendarCheck, Check, Clock, Inbox, Loader2, UserRound, Users, X } from "lucide-react";
import { useRsvpSummary } from "@/src/application/hooks/use-wedding-query";
import type { RsvpSummaryItem } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";

type ConfirmFilter = "all" | "hadir" | "tidak_hadir";

const FILTERS: { key: ConfirmFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "hadir", label: "Hadir" },
  { key: "tidak_hadir", label: "Berhalangan" },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  tone: "primary" | "emerald" | "destructive" | "amber";
}) {
  const tones = {
    primary: "border-primary/10 bg-primary/5 text-primary",
    emerald: "border-emerald-500/10 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    destructive: "border-destructive/10 bg-destructive/5 text-destructive",
    amber: "border-amber-500/10 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  } as const;
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/70">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 text-[22px] font-extrabold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

function SubmissionRow({ item }: { item: RsvpSummaryItem }) {
  const isHadir = item.attendance_status === "hadir";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isHadir
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isHadir ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold">{item.guest_name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
              {item.category_name && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {item.category_name}
                </span>
              )}
              {item.event_name && <span className="truncate">{item.event_name}</span>}
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3 w-3" /> {item.number_of_guests} orang
              </span>
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isHadir
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {isHadir ? "Hadir" : "Berhalangan"}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" /> {formatDateTime(item.submitted_at)}
      </p>
    </div>
  );
}

export function ConfirmTab() {
  const { data, isLoading } = useRsvpSummary();
  const [filter, setFilter] = useState<ConfirmFilter>("all");

  if (isLoading) return <TabLoading />;
  if (!data) return null;

  const items =
    filter === "all"
      ? data.items
      : data.items.filter((i) => i.attendance_status === filter);

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard icon={Check} label="Hadir" value={data.hadir} tone="emerald" />
        <SummaryCard icon={X} label="Berhalangan" value={data.berhalangan} tone="destructive" />
        <SummaryCard icon={Users} label="Total Tamu" value={data.total_guests} tone="primary" />
        <SummaryCard icon={CalendarCheck} label="Belum Konfirmasi" value={data.belum_konfirmasi} tone="amber" />
      </div>

      {/* Filter pill */}
      <div className="flex bg-muted/40 p-1 rounded-xl h-11">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 flex items-center justify-center gap-1 text-[13px] font-semibold rounded-lg transition-all ${
              filter === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Count row */}
      <div className="flex items-center justify-between px-2 min-h-[32px]">
        <span className="text-sm font-semibold tracking-tight">
          {filter === "all" ? "Semua Konfirmasi" : FILTERS.find((f) => f.key === filter)?.label} ({items.length})
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Total hadir: {data.total_orang_hadir} orang
        </span>
      </div>

      {/* Daftar submission */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-16 w-16 opacity-20" />
          <p className="text-[13px] text-muted-foreground">
            Belum ada konfirmasi kehadiran.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <SubmissionRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
