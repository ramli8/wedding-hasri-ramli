import { type TicketResponse, ticketResponseSchema } from "@wedding/shared";

const key = (code: string) => `ticket:${code}`;

/**
 * Salinan tiket terakhir di perangkat tamu, supaya QR tetap bisa dibuka di pintu saat sinyal
 * hilang. localStorage bisa tidak tersedia (mode privat), jadi semuanya dibungkus try/catch.
 */
export function saveTicket(code: string, ticket: TicketResponse) {
  try {
    localStorage.setItem(key(code), JSON.stringify(ticket));
  } catch {
    // tidak apa-apa: tanpa salinan, tiket hanya bisa dibuka saat online
  }
}

export function loadTicket(code: string): TicketResponse | null {
  try {
    const raw = localStorage.getItem(key(code));
    if (!raw) return null;
    const parsed = ticketResponseSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
