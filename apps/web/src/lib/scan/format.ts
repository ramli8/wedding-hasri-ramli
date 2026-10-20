const clock = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "10.42" (WIB) */
export const formatClock = (iso: string | number) => clock.format(new Date(iso)).replace(":", ".");

/** "3 menit lalu", "baru saja" */
export function formatAgo(ms: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - ms) / 1000));
  if (seconds < 10) return "baru saja";
  if (seconds < 60) return `${seconds} detik lalu`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  return `${Math.round(minutes / 60)} jam lalu`;
}
