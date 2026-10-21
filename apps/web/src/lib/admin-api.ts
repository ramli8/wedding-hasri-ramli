import {
  adminGuestbookListResponseSchema,
  adminGuestbookResponseSchema,
  type CoupleProfileInput,
  type CoupleRole,
  coupleProfileResponseSchema,
  coupleResponseSchema,
  createDeviceResponseSchema,
  dashboardResponseSchema,
  deviceListResponseSchema,
  deviceResponseSchema,
  type EventInput,
  eventListResponseSchema,
  eventResponseSchema,
  type FaqInput,
  faqListResponseSchema,
  faqResponseSchema,
  type GalleryCaptionInput,
  type GalleryInput,
  type GiftInput,
  type GroupInput,
  type GuestInput,
  galleryItemResponseSchema,
  galleryListResponseSchema,
  giftListResponseSchema,
  giftResponseSchema,
  groupListResponseSchema,
  groupResponseSchema,
  guestListResponseSchema,
  guestResponseSchema,
  importCommitResponseSchema,
  importPreviewResponseSchema,
  logResponseSchema,
  type MarkSentRequest,
  mediaResponseSchema,
  type ResolveRequest,
  reviewListResponseSchema,
  rsvpListResponseSchema,
  type SettingsInput,
  type StoryInput,
  settingsResponseSchema,
  storyItemResponseSchema,
  storyListResponseSchema,
  type WishInput,
  wishListResponseSchema,
  wishResponseSchema,
} from "@wedding/shared";
import { okSchema, request, withBody } from "./api.js";

const base = "/v1/admin";

/** Filter daftar tamu di sisi klien (boolean/angka asli; server yang mengubahnya dari string). */
export type GuestQuery = {
  q?: string;
  groupId?: string;
  eventId?: string;
  sent?: "sent" | "unsent";
  onlyInstagram?: boolean;
  rombongan?: boolean;
  deleted?: boolean;
  page?: number;
  pageSize?: number;
};

function queryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === false) continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const adminApi = {
  settings: {
    get: () => request(`${base}/settings`, settingsResponseSchema),
    save: (input: SettingsInput) =>
      request(`${base}/settings`, settingsResponseSchema, withBody("PUT", input)),
  },

  events: {
    list: () => request(`${base}/events`, eventListResponseSchema),
    create: (input: EventInput) =>
      request(`${base}/events`, eventResponseSchema, withBody("POST", input)),
    update: (id: string, input: EventInput) =>
      request(`${base}/events/${id}`, eventResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/events/${id}`, okSchema, withBody("DELETE")),
  },

  groups: {
    list: () => request(`${base}/groups`, groupListResponseSchema),
    create: (input: GroupInput) =>
      request(`${base}/groups`, groupResponseSchema, withBody("POST", input)),
    update: (id: string, input: GroupInput) =>
      request(`${base}/groups/${id}`, groupResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/groups/${id}`, okSchema, withBody("DELETE")),
  },

  guests: {
    list: (query: GuestQuery) =>
      request(`${base}/guests${queryString(query)}`, guestListResponseSchema),
    create: (input: GuestInput) =>
      request(`${base}/guests`, guestResponseSchema, withBody("POST", input)),
    update: (id: string, input: GuestInput) =>
      request(`${base}/guests/${id}`, guestResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/guests/${id}`, okSchema, withBody("DELETE")),
    restore: (id: string) =>
      request(`${base}/guests/${id}/restore`, guestResponseSchema, withBody("POST", {})),
    markSent: (id: string, input: MarkSentRequest) =>
      request(`${base}/guests/${id}/sent`, guestResponseSchema, withBody("POST", input)),
    importPreview: (csv: string) =>
      request(
        `${base}/guests/import/preview`,
        importPreviewResponseSchema,
        withBody("POST", { csv }),
      ),
    importCommit: (csv: string, skipDuplicates: boolean) =>
      request(
        `${base}/guests/import/commit`,
        importCommitResponseSchema,
        withBody("POST", { csv, skipDuplicates }),
      ),
  },

  devices: {
    list: () => request(`${base}/devices`, deviceListResponseSchema),
    create: (name: string) =>
      request(`${base}/devices`, createDeviceResponseSchema, withBody("POST", { name })),
    revoke: (id: string) =>
      request(`${base}/devices/${id}/revoke`, deviceResponseSchema, withBody("POST", {})),
    remove: (id: string) => request(`${base}/devices/${id}`, okSchema, withBody("DELETE")),
  },

  rsvps: {
    list: (eventId?: string) =>
      request(`${base}/rsvps${queryString({ eventId })}`, rsvpListResponseSchema),
  },

  media: {
    /** Mengunggah satu gambar (resolusi asli dipertahankan oleh server). */
    upload: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request(`${base}/media`, mediaResponseSchema, { method: "POST", body: form });
    },
  },

  invitation: {
    couple: () => request(`${base}/invitation/couple`, coupleResponseSchema),
    saveCouple: (role: CoupleRole, input: CoupleProfileInput) =>
      request(
        `${base}/invitation/couple/${role}`,
        coupleProfileResponseSchema,
        withBody("PUT", input),
      ),
    story: () => request(`${base}/invitation/story`, storyListResponseSchema),
    createStory: (input: StoryInput) =>
      request(`${base}/invitation/story`, storyItemResponseSchema, withBody("POST", input)),
    updateStory: (id: string, input: StoryInput) =>
      request(`${base}/invitation/story/${id}`, storyItemResponseSchema, withBody("PUT", input)),
    removeStory: (id: string) =>
      request(`${base}/invitation/story/${id}`, okSchema, withBody("DELETE")),
    reorderStory: (ids: string[]) =>
      request(`${base}/invitation/story/order`, storyListResponseSchema, withBody("PUT", { ids })),
    gallery: () => request(`${base}/invitation/gallery`, galleryListResponseSchema),
    addGallery: (input: GalleryInput) =>
      request(`${base}/invitation/gallery`, galleryItemResponseSchema, withBody("POST", input)),
    captionGallery: (id: string, input: GalleryCaptionInput) =>
      request(
        `${base}/invitation/gallery/${id}`,
        galleryItemResponseSchema,
        withBody("PUT", input),
      ),
    removeGallery: (id: string) =>
      request(`${base}/invitation/gallery/${id}`, okSchema, withBody("DELETE")),
    reorderGallery: (ids: string[]) =>
      request(
        `${base}/invitation/gallery/order`,
        galleryListResponseSchema,
        withBody("PUT", { ids }),
      ),
    gifts: () => request(`${base}/invitation/gifts`, giftListResponseSchema),
    createGift: (input: GiftInput) =>
      request(`${base}/invitation/gifts`, giftResponseSchema, withBody("POST", input)),
    updateGift: (id: string, input: GiftInput) =>
      request(`${base}/invitation/gifts/${id}`, giftResponseSchema, withBody("PUT", input)),
    removeGift: (id: string) =>
      request(`${base}/invitation/gifts/${id}`, okSchema, withBody("DELETE")),
    reorderGifts: (ids: string[]) =>
      request(`${base}/invitation/gifts/order`, giftListResponseSchema, withBody("PUT", { ids })),
    faqs: () => request(`${base}/invitation/faqs`, faqListResponseSchema),
    createFaq: (input: FaqInput) =>
      request(`${base}/invitation/faqs`, faqResponseSchema, withBody("POST", input)),
    updateFaq: (id: string, input: FaqInput) =>
      request(`${base}/invitation/faqs/${id}`, faqResponseSchema, withBody("PUT", input)),
    removeFaq: (id: string) =>
      request(`${base}/invitation/faqs/${id}`, okSchema, withBody("DELETE")),
    reorderFaqs: (ids: string[]) =>
      request(`${base}/invitation/faqs/order`, faqListResponseSchema, withBody("PUT", { ids })),
    wishes: () => request(`${base}/invitation/wishes`, wishListResponseSchema),
    createWish: (input: WishInput) =>
      request(`${base}/invitation/wishes`, wishResponseSchema, withBody("POST", input)),
    updateWish: (id: string, input: WishInput) =>
      request(`${base}/invitation/wishes/${id}`, wishResponseSchema, withBody("PUT", input)),
    removeWish: (id: string) =>
      request(`${base}/invitation/wishes/${id}`, okSchema, withBody("DELETE")),
    removeWishClaim: (wishId: string, guestId: string) =>
      request(
        `${base}/invitation/wishes/${wishId}/claims/${guestId}`,
        wishResponseSchema,
        withBody("DELETE"),
      ),
    reorderWishes: (ids: string[]) =>
      request(`${base}/invitation/wishes/order`, wishListResponseSchema, withBody("PUT", { ids })),
  },

  guestbook: {
    list: (query: { page: number; hidden?: boolean }) =>
      request(
        `${base}/guestbook${queryString({
          page: query.page,
          pageSize: 20,
          hidden: query.hidden === undefined ? undefined : String(query.hidden),
        })}`,
        adminGuestbookListResponseSchema,
      ),
    reply: (id: string, reply: string) =>
      request(
        `${base}/guestbook/${id}/reply`,
        adminGuestbookResponseSchema,
        withBody("POST", { reply }),
      ),
    hide: (id: string, hidden: boolean) =>
      request(
        `${base}/guestbook/${id}/hide`,
        adminGuestbookResponseSchema,
        withBody("POST", { hidden }),
      ),
    remove: (id: string) => request(`${base}/guestbook/${id}`, okSchema, withBody("DELETE")),
  },

  checkins: {
    dashboard: () => request(`${base}/checkins/dashboard`, dashboardResponseSchema),
    review: () => request(`${base}/checkins/review`, reviewListResponseSchema),
    resolve: (input: ResolveRequest) =>
      request(`${base}/checkins/resolve`, okSchema, withBody("POST", input)),
    log: (page: number) =>
      request(`${base}/checkins/log?page=${page}&pageSize=30`, logResponseSchema),
    undo: (id: string) => request(`${base}/checkins/${id}/undo`, okSchema, withBody("POST", {})),
    setPax: (id: string, pax: number) =>
      request(`${base}/checkins/${id}/pax`, okSchema, withBody("POST", { pax })),
  },
};

/** Tautan unduhan (dibuka langsung oleh browser, cookie sesi ikut terkirim). */
export const downloads = {
  guestsCsv: `/api${base}/guests/export.csv`,
  templateCsv: `/api${base}/guests/template.csv`,
};
