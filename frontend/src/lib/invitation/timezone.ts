// Label zona waktu acara — tampil di samping jam (mis. "09.00 – 12.00 WIB").
// Override lewat NEXT_PUBLIC_EVENT_TZ_LABEL jika zona acara berubah.
export const EVENT_TIMEZONE_LABEL =
  process.env.NEXT_PUBLIC_EVENT_TZ_LABEL ?? "WIB";
