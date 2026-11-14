import {
  type GuestbookPostRequest,
  guestbookListResponseSchema,
  guestbookPostResponseSchema,
  guestPhotoResponseSchema,
  invitationResponseSchema,
  myClaimsResponseSchema,
  myTasksResponseSchema,
  panitiaTaskResponseSchema,
  publicRundownSchema,
  type RsvpRequest,
  rsvpResponseSchema,
  siteInfoSchema,
  ticketResponseSchema,
  vipFeedSchema,
  voiceUploadResponseSchema,
  type WishClaimRequest,
  wishClaimResponseSchema,
} from "@wedding/shared";
import { request, withBody } from "./api.js";

const base = "/v1/public";

/** API tanpa login untuk tamu (halaman /u/KODE). */
export const publicApi = {
  site: () => request(`${base}/site`, siteInfoSchema),
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
  /** Foto photobooth dari QR di cetakan; 404 = belum terunggah dari laptop booth. */
  photo: (id: string) => request(`${base}/foto/${id}`, guestPhotoResponseSchema),
  /** Rundown baca-saja untuk MC dan panitia (tautan /rundown/TOKEN). */
  rundown: (token: string) => request(`${base}/rundown/${token}`, publicRundownSchema),
  /** Tugas milik anggota panitia (tautan /tugas/TOKEN). */
  myTasks: (token: string) => request(`${base}/tugas/${token}`, myTasksResponseSchema),
  setMyTaskDone: (token: string, id: string, done: boolean) =>
    request(
      `${base}/tugas/${token}/tasks/${id}/done`,
      panitiaTaskResponseSchema,
      withBody("POST", { done }),
    ),
  /** Kabar tamu VIP datang untuk HP keluarga (tautan /vip/TOKEN). */
  vip: (token: string) => request(`${base}/vip/${token}`, vipFeedSchema),
  /** Pesan suara tamu (rekaman ≤ 60 detik); hanya pengantin yang mendengarkan. */
  sendVoice: (code: string, audio: Blob, durationMs: number) => {
    const form = new FormData();
    form.append("code", code);
    form.append("durationMs", String(Math.round(durationMs)));
    const ext = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
    form.append("audio", audio, `pesan.${ext}`);
    return request(`${base}/voice`, voiceUploadResponseSchema, { method: "POST", body: form });
  },
  rsvp: (input: RsvpRequest) =>
    request(`${base}/rsvp`, rsvpResponseSchema, withBody("POST", input)),
};
