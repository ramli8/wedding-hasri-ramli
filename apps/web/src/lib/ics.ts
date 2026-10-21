// Berkas kalender (.ics, RFC 5545) untuk satu acara. Dibuat di peramban tamu, jadi tidak
// butuh server dan tetap bisa diunduh walau sinyal buruk setelah halaman termuat.

export type IcsEvent = {
  /** Identitas stabil agar mengimpor ulang memperbarui, bukan menggandakan, entri kalender. */
  uid: string;
  title: string;
  startsAt: string;
  /** Kosong: dianggap berdurasi dua jam. */
  endsAt?: string | null;
  location?: string | null;
  description?: string | null;
  url?: string | null;
};

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/** 2027-05-21T03:00:00.000Z -> 20270521T030000Z */
function icsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Menetralkan karakter khusus nilai teks (RFC 5545 §3.3.11). */
function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, ";")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Melipat baris panjang: maksimal 75 byte UTF-8 per baris, lanjutan diawali satu spasi. */
function fold(line: string) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let limit = 75;
  for (const char of line) {
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
      limit = 74; // spasi awal baris lanjutan ikut dihitung
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(event: IcsEvent, now = new Date()): string {
  const start = new Date(event.startsAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + DEFAULT_DURATION_MS);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hasri & Ramli//Undangan//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/** Nama berkas aman: huruf, angka, dan tanda hubung. */
export function icsFilename(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "acara"}.ics`;
}

/** Memicu unduhan berkas di peramban. */
export function downloadIcs(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
