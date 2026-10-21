import {
  DEFAULT_MESSAGE_TEMPLATE,
  type Event,
  formatEventDate,
  formatTimeRange,
  type Group,
  type Guest,
  renderTemplate,
  type Settings,
} from "@wedding/shared";

/** Link undangan personal tamu: alamat situs + /u/KODE. Null bila belum bisa dibuat. */
export function guestLink(guest: Pick<Guest, "code">, settings: Settings | null | undefined) {
  return settings && guest.code ? `${settings.publicBaseUrl}/u/${guest.code}` : null;
}

/** Jam sesi tamu di acara ini: jam kelompoknya, atau jam acara bila kelompok tak punya sesi. */
export function sessionLabel(event: Event, group: Group | null | undefined) {
  const session = group?.sessions.find((s) => s.eventId === event.id);
  if (session) return formatTimeRange(session.startsAt, session.endsAt);
  if (event.startsAt && event.endsAt) return formatTimeRange(event.startsAt, event.endsAt);
  return "";
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
