"use client";

import Link from "next/link";
import { CalendarDays, Gift } from "lucide-react";

export function IdentityForm() {
  return (
    <div className="space-y-4">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Pengaturan di halaman ini telah dipindahkan ke menu yang lebih relevan:
      </p>

      <Link
        href="/admin/undangan/acara"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 active:scale-[0.98]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-bold text-foreground">
            Tanggal Pernikahan
          </span>
          <span className="block truncate text-[11.5px] text-muted-foreground">
            Sekarang berada di menu Acara
          </span>
        </span>
      </Link>

      <Link
        href="/admin/undangan/hadiah"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 active:scale-[0.98]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-bold text-foreground">
            Alamat Pengiriman Kado
          </span>
          <span className="block truncate text-[11.5px] text-muted-foreground">
            Sekarang berada di menu Hadiah
          </span>
        </span>
      </Link>
    </div>
  );
}
