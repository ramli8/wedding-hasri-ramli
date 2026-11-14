import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "@/components/kit/toast";
import { vipQuery } from "@/lib/queries";
import { feedback } from "@/lib/scan/feedback";

/**
 * Pemberitahuan "tamu VIP datang" di semua halaman admin: membandingkan seq kedatangan terbaru
 * dengan yang sudah terlihat. Muatan pertama hanya jadi patokan, jadi membuka admin tidak memunculkan
 * kabar lama.
 */
export function VipWatcher() {
  const { data } = useQuery(vipQuery);
  const lastSeq = useRef<number | null>(null);

  useEffect(() => {
    if (!data) return;
    const newest = data.arrivals[0]?.seq ?? 0;
    if (lastSeq.current === null) {
      lastSeq.current = newest;
      return;
    }
    const fresh = data.arrivals.filter((a) => a.seq > (lastSeq.current ?? 0));
    lastSeq.current = Math.max(lastSeq.current, newest);
    if (fresh.length === 0) return;
    const names = fresh.map((a) => a.guestName);
    toast(
      names.length === 1
        ? `Tamu VIP datang: ${names[0]}`
        : `Tamu VIP datang: ${names.slice(0, 3).join(", ")}${names.length > 3 ? ` dan ${names.length - 3} lainnya` : ""}`,
      "success",
      10_000,
    );
    feedback("vip", true);
  }, [data]);

  return null;
}
