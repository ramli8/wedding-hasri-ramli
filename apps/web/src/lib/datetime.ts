// Semua jam di antarmuka admin adalah WIB (UTC+7, tanpa waktu musim panas).
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** ISO → nilai <input type="datetime-local"> dalam WIB: "2027-05-21T10:00". */
export function isoToWibInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + WIB_OFFSET_MS).toISOString().slice(0, 16);
}

/** Nilai <input type="datetime-local"> (dianggap WIB) → ISO UTC. Kosong → null. */
export function wibInputToIso(local: string): string | null {
  if (!local) return null;
  const date = new Date(`${local}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
