import { type RsvpRequest, rsvpResponseSchema, ticketResponseSchema } from "@wedding/shared";
import { request, withBody } from "./api.js";

const base = "/v1/public";

/** API tanpa login untuk tamu (halaman /u/KODE). */
export const publicApi = {
  ticket: (code: string) => request(`${base}/ticket/${code}`, ticketResponseSchema),
  rsvp: (input: RsvpRequest) =>
    request(`${base}/rsvp`, rsvpResponseSchema, withBody("POST", input)),
};
