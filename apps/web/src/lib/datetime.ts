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

/** Tanggal WIB dari ISO, untuk dipasangkan dengan jam: "2027-05-21". Kosong → "". */
export function isoToWibDate(iso: string | null | undefined): string {
  return isoToWibInput(iso).slice(0, 10);
}

/** ISO → nilai <input type="time"> dalam WIB: "10:00". */
export function isoToWibTime(iso: string | null | undefined): string {
  return isoToWibInput(iso).slice(11);
}

/** Tanggal WIB ("2027-05-21") + jam WIB ("10:00") → ISO UTC. Salah satu kosong → null. */
export function wibTimeToIso(date: string, time: string): string | null {
  return date && time ? wibInputToIso(`${date}T${time}`) : null;
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
