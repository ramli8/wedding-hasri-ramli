const TIME_ZONE = "Asia/Jakarta";

export type TemplateVariables = {
  panggilan: string;
  link: string;
  acara: string;
  tanggal: string;
  jam_sesi: string;
};

/**
 * Mengganti {variabel} di template. Variabel yang tidak dikenal dibiarkan apa adanya.
 * Baris yang hanya berisi variabel kosong dibuang seluruhnya (mis. "Waktu: {jam_sesi}"
 * saat acara belum punya jam), supaya tidak tersisa label yang menggantung.
 */
export function renderTemplate(body: string, vars: TemplateVariables): string {
  return body
    .split("\n")
    .flatMap((line) => {
      let hasKnown = false;
      let keep = false;
      const rendered = line.replace(/\{(\w+)\}/g, (match, name: string) => {
        if (!(name in vars)) {
          keep = true;
          return match;
        }
        hasKnown = true;
        const value = vars[name as keyof TemplateVariables];
        if (value) keep = true;
        return value;
      });
      return hasKnown && !keep ? [] : [rendered];
    })
    .join("\n");
}

/** "Jumat, 21 Mei 2027" (WIB). Kosong bila tanggal tidak ada. */
export function formatEventDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

const clock = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(":", ".");

/** "10.00–12.00 WIB" */
export function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${clock(startsAt)}–${clock(endsAt)} WIB`;
}

export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function instagramDmUrl(username: string): string {
  return `https://ig.me/m/${username}`;
}
