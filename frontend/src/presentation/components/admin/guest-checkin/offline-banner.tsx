"use client";

import { WifiOff } from "lucide-react";

export function OfflineBanner({ queueCount }: { queueCount: number }) {
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="text-[12px] leading-snug text-amber-700">
        <span className="font-bold">Anda offline.</span>{" "}
        {queueCount > 0
          ? `${queueCount} check-in masuk antrian dan terkirim otomatis saat koneksi kembali.`
          : "Check-in akan masuk antrian dan terkirim otomatis saat koneksi kembali."}
      </p>
    </div>
  );
}
