// Label zona waktu acara — tampil di samping jam (mis. "Pukul 10.00 WITA").
// Override lewat NEXT_PUBLIC_EVENT_TZ_LABEL jika venue pindah zona.
export const EVENT_TIMEZONE_LABEL =
  process.env.NEXT_PUBLIC_EVENT_TZ_LABEL ?? "WITA";
