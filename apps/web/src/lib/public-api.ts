import {
  type GuestbookPostRequest,
  guestbookListResponseSchema,
  guestbookPostResponseSchema,
  invitationResponseSchema,
  myClaimsResponseSchema,
  type RsvpRequest,
  rsvpResponseSchema,
  ticketResponseSchema,
  type WishClaimRequest,
  wishClaimResponseSchema,
} from "@wedding/shared";
import { request, withBody } from "./api.js";

const base = "/v1/public";

/** API tanpa login untuk tamu (halaman /u/KODE). */
export const publicApi = {
  ticket: (code: string) => request(`${base}/ticket/${code}`, ticketResponseSchema),
  // `fresh` melewati cache peramban (max-age 30 detik) agar sisa wishlist terbaru terlihat.
  invitation: (fresh = false) =>
    request(
      `${base}/invitation`,
      invitationResponseSchema,
      fresh ? { cache: "no-cache" } : undefined,
    ),
  claims: (code: string) => request(`${base}/claims/${code}`, myClaimsResponseSchema),
  claim: (input: WishClaimRequest) =>
    request(`${base}/claims`, wishClaimResponseSchema, withBody("POST", input)),
  guestbook: (page: number, pageSize = 10) =>
    request(`${base}/guestbook?page=${page}&pageSize=${pageSize}`, guestbookListResponseSchema),
  postGuestbook: (input: GuestbookPostRequest) =>
    request(`${base}/guestbook`, guestbookPostResponseSchema, withBody("POST", input)),
  rsvp: (input: RsvpRequest) =>
    request(`${base}/rsvp`, rsvpResponseSchema, withBody("POST", input)),
};
