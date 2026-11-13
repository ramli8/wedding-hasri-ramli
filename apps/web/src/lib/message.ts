import {
  DEFAULT_MESSAGE_TEMPLATE,
  type Event,
  FREE_TIME_LABEL,
  formatEventDate,
  formatSessionTime,
  type Group,
  type Guest,
  renderTemplate,
  type Settings,
} from "@wedding/shared";

/** Link undangan personal tamu: alamat situs + /u/KODE. Null bila belum bisa dibuat. */
export function guestLink(guest: Pick<Guest, "code">, settings: Settings | null | undefined) {
  return settings && guest.code ? `${settings.publicBaseUrl}/u/${guest.code}` : null;
}

/**
 * Jam kedatangan tamu di acara ini, dari jam sesi kelompoknya ("10.00–12.00 WIB" atau
 * "10.00 WIB – sampai selesai"). Kelompok tanpa jam (atau tamu tanpa kelompok): jam bebas.
 */
export function sessionLabel(event: Event, group: Group | null | undefined) {
  const session = group?.sessions.find((s) => s.eventId === event.id);
  return session ? formatSessionTime(session.startsAt, session.endsAt) : FREE_TIME_LABEL;
}

/** "Hasri Wiji Aqsari & Mohamad Rizal Ramli" dari Pengaturan → Situs. */
export function coupleNames(settings: Settings | null | undefined) {
  return settings ? `${settings.brideName} & ${settings.groomName}` : "";
}

/** Mengisi variabel template untuk satu tamu di satu acara. */
export function renderGuestText(
  template: string,
  input: {
    guest: Pick<Guest, "displayName" | "code">;
    event: Event;
    group: Group | null | undefined;
    settings: Settings | null | undefined;
  },
) {
  const { guest, event, group, settings } = input;
  return renderTemplate(template, {
    panggilan: guest.displayName,
    link: guestLink(guest, settings) ?? "(isi alamat situs di Pengaturan)",
    acara: event.name,
    tanggal: formatEventDate(event.startsAt),
    jam_sesi: sessionLabel(event, group),
    tempat: event.venueName ?? "",
    mempelai: coupleNames(settings),
  });
}

export function buildMessage(input: {
  guest: Guest;
  event: Event;
  group: Group | null | undefined;
  settings: Settings | null | undefined;
}) {
  return renderGuestText(input.event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE, input);
}
