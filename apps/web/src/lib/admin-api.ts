import {
  type AdminRsvpRequest,
  adminGuestbookListResponseSchema,
  adminGuestbookResponseSchema,
  type BoothConfigInput,
  type BuwuhAddressListInput,
  type BuwuhCatalogInput,
  type BuwuhInput,
  boothConfigResponseSchema,
  boothPhotoListResponseSchema,
  buwuhAddressListResponseSchema,
  buwuhCatalogResponseSchema,
  buwuhListResponseSchema,
  buwuhResponseSchema,
  type CoupleProfileInput,
  type CoupleRole,
  type CoverInput,
  coupleProfileResponseSchema,
  coupleResponseSchema,
  coverResponseSchema,
  createDeviceResponseSchema,
  type DeviceKind,
  type DoorprizeInput,
  dashboardResponseSchema,
  deviceListResponseSchema,
  deviceResponseSchema,
  doorprizeDrawResponseSchema,
  doorprizeListSchema,
  doorprizeResponseSchema,
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
  type GuestBulkRequest,
  type GuestDuplicatesQuery,
  type GuestInput,
  galleryItemResponseSchema,
  galleryListResponseSchema,
  giftListResponseSchema,
  giftResponseSchema,
  groupListResponseSchema,
  groupResponseSchema,
  guestBulkResponseSchema,
  guestDuplicatesResponseSchema,
  guestListResponseSchema,
  guestResponseSchema,
  homeResponseSchema,
  importCommitResponseSchema,
  importPreviewResponseSchema,
  type LayarPortionsInput,
  type LiveInput,
  layarPortionsResponseSchema,
  layoutResponseSchema,
  liveResponseSchema,
  logResponseSchema,
  type MarkSentRequest,
  mediaResponseSchema,
  type PanitiaMemberInput,
  type PanitiaTaskInput,
  pairingCardsResponseSchema,
  panitiaMemberResponseSchema,
  panitiaResponseSchema,
  panitiaTaskResponseSchema,
  type ReceivedGiftInput,
  type ReceivedGiftKind,
  type ResolveRequest,
  type RundownItemInput,
  receivedGiftListResponseSchema,
  receivedGiftResponseSchema,
  reviewListResponseSchema,
  rsvpListResponseSchema,
  rsvpResponseSchema,
  rundownAdminResponseSchema,
  rundownItemResponseSchema,
  type Section,
  type SeoInput,
  type SeserahanInput,
  type SeserahanStatus,
  type SettingsInput,
  type StoryInput,
  sectionsResponseSchema,
  seoResponseSchema,
  seserahanListResponseSchema,
  seserahanResponseSchema,
  settingsResponseSchema,
  storyItemResponseSchema,
  storyListResponseSchema,
  thanksTemplateResponseSchema,
  type VendorInput,
  type VendorPaymentInput,
  vendorCategoryResponseSchema,
  vendorOverviewSchema,
  vendorResponseSchema,
  vipAdminFeedSchema,
  voiceListSchema,
  voiceMessageResponseSchema,
  type WishInput,
  wishListResponseSchema,
  wishResponseSchema,
} from "@wedding/shared";
import { z } from "zod";
import { okSchema, request, withBody } from "./api.js";

const addedSchema = z.object({ added: z.number() });

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

export type ReceivedGiftFilter = {
  q?: string;
  kind?: ReceivedGiftKind;
  /** true: sudah dibalas; false: belum. */
  thanked?: boolean;
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
  seo: {
    get: () => request(`${base}/seo`, seoResponseSchema),
    save: (input: SeoInput) => request(`${base}/seo`, seoResponseSchema, withBody("PUT", input)),
  },
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
    /** Pesan undangan acara ini (Pengaturan → Pesan undangan). Kosong = bawaan. */
    saveMessage: (id: string, messageTemplate: string) =>
      request(
        `${base}/events/${id}/message`,
        eventResponseSchema,
        withBody("PUT", { messageTemplate }),
      ),
    /** Pesan pengingat RSVP acara ini (Pengaturan → Pesan). Kosong = bawaan. */
    saveReminder: (id: string, reminderTemplate: string) =>
      request(
        `${base}/events/${id}/reminder`,
        eventResponseSchema,
        withBody("PUT", { reminderTemplate }),
      ),
    remove: (id: string) => request(`${base}/events/${id}`, okSchema, withBody("DELETE")),
  },

  groups: {
    list: () => request(`${base}/groups`, groupListResponseSchema),
    create: (input: GroupInput) =>
      request(`${base}/groups`, groupResponseSchema, withBody("POST", input)),
    update: (id: string, input: GroupInput) =>
      request(`${base}/groups/${id}`, groupResponseSchema, withBody("PUT", input)),
    /** `moveTo`: id kelompok tujuan atau "none" (tanpa kelompok); tanpa itu, kelompok berisi ditolak. */
    remove: (id: string, moveTo?: string) =>
      request(`${base}/groups/${id}${queryString({ moveTo })}`, okSchema, withBody("DELETE")),
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
    bulk: (input: GuestBulkRequest) =>
      request(`${base}/guests/bulk`, guestBulkResponseSchema, withBody("POST", input)),
    /** Tamu lain dengan HP/Instagram yang sama (nilai mentah dari formulir). */
    duplicates: (query: GuestDuplicatesQuery) =>
      request(`${base}/guests/duplicates${queryString(query)}`, guestDuplicatesResponseSchema),
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
    create: (name: string, kind: DeviceKind) =>
      request(`${base}/devices`, createDeviceResponseSchema, withBody("POST", { name, kind })),
    /** Kartu pasang dengan kode tersimpan (tidak membuat kode baru). */
    cards: (ids: string[]) =>
      request(`${base}/devices/cards`, pairingCardsResponseSchema, withBody("POST", { ids })),
    /** Kode pairing baru untuk perangkat yang belum dipasang. */
    newPairingCode: (id: string) =>
      request(
        `${base}/devices/${id}/pairing-code`,
        createDeviceResponseSchema,
        withBody("POST", {}),
      ),
    revoke: (id: string) =>
      request(`${base}/devices/${id}/revoke`, deviceResponseSchema, withBody("POST", {})),
    remove: (id: string) => request(`${base}/devices/${id}`, okSchema, withBody("DELETE")),
  },

  rsvps: {
    list: (eventId?: string) =>
      request(`${base}/rsvps${queryString({ eventId })}`, rsvpListResponseSchema),
    /** Admin mencatat jawaban atas nama tamu. */
    record: (input: AdminRsvpRequest) =>
      request(`${base}/rsvps`, rsvpResponseSchema, withBody("PUT", input)),
    markReminded: (guestId: string, eventId: string, reminded = true) =>
      request(
        `${base}/rsvps/${guestId}/reminded`,
        okSchema,
        withBody("POST", { eventId, reminded }),
      ),
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
    receiveWishClaim: (wishId: string, guestId: string) =>
      request(
        `${base}/invitation/wishes/${wishId}/claims/${guestId}/received`,
        wishResponseSchema,
        withBody("POST", {}),
      ),
    reorderWishes: (ids: string[]) =>
      request(`${base}/invitation/wishes/order`, wishListResponseSchema, withBody("PUT", { ids })),
    layout: () => request(`${base}/invitation/layout`, layoutResponseSchema),
    saveCover: (input: CoverInput) =>
      request(`${base}/invitation/cover`, coverResponseSchema, withBody("PUT", input)),
    saveLive: (input: LiveInput) =>
      request(`${base}/invitation/live`, liveResponseSchema, withBody("PUT", input)),
    saveSections: (items: Section[]) =>
      request(`${base}/invitation/sections`, sectionsResponseSchema, withBody("PUT", { items })),
  },

  home: () => request(`${base}/home`, homeResponseSchema),

  vendors: {
    overview: () => request(`${base}/vendors`, vendorOverviewSchema),
    createCategory: (name: string) =>
      request(
        `${base}/vendors/categories`,
        vendorCategoryResponseSchema,
        withBody("POST", { name }),
      ),
    renameCategory: (id: string, name: string) =>
      request(
        `${base}/vendors/categories/${id}`,
        vendorCategoryResponseSchema,
        withBody("PUT", { name }),
      ),
    removeCategory: (id: string) =>
      request(`${base}/vendors/categories/${id}`, okSchema, withBody("DELETE")),
    addCommonCategories: () =>
      request(`${base}/vendors/categories/common`, addedSchema, withBody("POST", {})),
    create: (input: VendorInput) =>
      request(`${base}/vendors`, vendorResponseSchema, withBody("POST", input)),
    update: (id: string, input: VendorInput) =>
      request(`${base}/vendors/${id}`, vendorResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/vendors/${id}`, okSchema, withBody("DELETE")),
    select: (id: string, selected: boolean) =>
      request(`${base}/vendors/${id}/select`, vendorResponseSchema, withBody("POST", { selected })),
    addPayment: (id: string, input: VendorPaymentInput) =>
      request(`${base}/vendors/${id}/payments`, vendorResponseSchema, withBody("POST", input)),
    updatePayment: (id: string, paymentId: string, input: VendorPaymentInput) =>
      request(
        `${base}/vendors/${id}/payments/${paymentId}`,
        vendorResponseSchema,
        withBody("PUT", input),
      ),
    removePayment: (id: string, paymentId: string) =>
      request(
        `${base}/vendors/${id}/payments/${paymentId}`,
        vendorResponseSchema,
        withBody("DELETE"),
      ),
  },

  receivedGifts: {
    list: (query: ReceivedGiftFilter) => {
      // `thanked=false` harus ikut terkirim, padahal queryString membuang nilai false.
      const search = new URLSearchParams();
      if (query.q) search.set("q", query.q);
      if (query.kind) search.set("kind", query.kind);
      if (query.thanked !== undefined) search.set("thanked", String(query.thanked));
      const text = search.toString();
      return request(
        `${base}/received-gifts${text ? `?${text}` : ""}`,
        receivedGiftListResponseSchema,
      );
    },
    create: (input: ReceivedGiftInput) =>
      request(`${base}/received-gifts`, receivedGiftResponseSchema, withBody("POST", input)),
    update: (id: string, input: ReceivedGiftInput) =>
      request(`${base}/received-gifts/${id}`, receivedGiftResponseSchema, withBody("PUT", input)),
    thank: (id: string, thanked: boolean) =>
      request(
        `${base}/received-gifts/${id}/thanked`,
        receivedGiftResponseSchema,
        withBody("POST", { thanked }),
      ),
    remove: (id: string) => request(`${base}/received-gifts/${id}`, okSchema, withBody("DELETE")),
    thanksTemplate: () =>
      request(`${base}/received-gifts/thanks-template`, thanksTemplateResponseSchema),
    saveThanksTemplate: (body: string) =>
      request(
        `${base}/received-gifts/thanks-template`,
        thanksTemplateResponseSchema,
        withBody("PUT", { body }),
      ),
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

  rundown: {
    get: () => request(`${base}/rundown`, rundownAdminResponseSchema),
    create: (input: RundownItemInput) =>
      request(`${base}/rundown/items`, rundownItemResponseSchema, withBody("POST", input)),
    update: (id: string, input: RundownItemInput) =>
      request(`${base}/rundown/items/${id}`, rundownItemResponseSchema, withBody("PUT", input)),
    shift: (id: string, minutes: number) =>
      request(
        `${base}/rundown/items/${id}/shift`,
        z.object({ shifted: z.number() }),
        withBody("POST", { minutes }),
      ),
    remove: (id: string) => request(`${base}/rundown/items/${id}`, okSchema, withBody("DELETE")),
    resetToken: () =>
      request(`${base}/rundown/token`, z.object({ token: z.string() }), withBody("POST", {})),
  },

  doorprize: {
    list: () => request(`${base}/doorprize`, doorprizeListSchema),
    create: (input: DoorprizeInput) =>
      request(`${base}/doorprize/prizes`, doorprizeResponseSchema, withBody("POST", input)),
    update: (id: string, input: DoorprizeInput) =>
      request(`${base}/doorprize/prizes/${id}`, doorprizeResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/doorprize/prizes/${id}`, okSchema, withBody("DELETE")),
    draw: (id: string) =>
      request(
        `${base}/doorprize/prizes/${id}/draw`,
        doorprizeDrawResponseSchema,
        withBody("POST", {}),
      ),
    redraw: (winnerId: string) =>
      request(
        `${base}/doorprize/winners/${winnerId}/redraw`,
        doorprizeDrawResponseSchema,
        withBody("POST", {}),
      ),
    removeWinner: (winnerId: string) =>
      request(`${base}/doorprize/winners/${winnerId}`, okSchema, withBody("DELETE")),
  },

  voice: {
    list: () => request(`${base}/voice`, voiceListSchema),
    hide: (id: string, hidden: boolean) =>
      request(`${base}/voice/${id}/hide`, voiceMessageResponseSchema, withBody("POST", { hidden })),
    remove: (id: string) => request(`${base}/voice/${id}`, okSchema, withBody("DELETE")),
  },

  layar: {
    getPortions: () => request(`${base}/layar`, layarPortionsResponseSchema),
    savePortions: (input: LayarPortionsInput) =>
      request(`${base}/layar`, layarPortionsResponseSchema, withBody("PUT", input)),
  },

  vip: {
    get: () => request(`${base}/vip`, vipAdminFeedSchema),
    resetToken: () =>
      request(`${base}/vip/token`, z.object({ token: z.string() }), withBody("POST", {})),
  },

  panitia: {
    get: () => request(`${base}/panitia`, panitiaResponseSchema),
    createMember: (input: PanitiaMemberInput) =>
      request(`${base}/panitia/members`, panitiaMemberResponseSchema, withBody("POST", input)),
    updateMember: (id: string, input: PanitiaMemberInput) =>
      request(`${base}/panitia/members/${id}`, panitiaMemberResponseSchema, withBody("PUT", input)),
    resetToken: (id: string) =>
      request(
        `${base}/panitia/members/${id}/token`,
        panitiaMemberResponseSchema,
        withBody("POST", {}),
      ),
    removeMember: (id: string) =>
      request(`${base}/panitia/members/${id}`, okSchema, withBody("DELETE")),
    createTask: (input: PanitiaTaskInput) =>
      request(`${base}/panitia/tasks`, panitiaTaskResponseSchema, withBody("POST", input)),
    updateTask: (id: string, input: PanitiaTaskInput) =>
      request(`${base}/panitia/tasks/${id}`, panitiaTaskResponseSchema, withBody("PUT", input)),
    setDone: (id: string, done: boolean) =>
      request(
        `${base}/panitia/tasks/${id}/done`,
        panitiaTaskResponseSchema,
        withBody("POST", { done }),
      ),
    removeTask: (id: string) =>
      request(`${base}/panitia/tasks/${id}`, okSchema, withBody("DELETE")),
  },

  seserahan: {
    list: () => request(`${base}/seserahan`, seserahanListResponseSchema),
    create: (input: SeserahanInput) =>
      request(`${base}/seserahan`, seserahanResponseSchema, withBody("POST", input)),
    update: (id: string, input: SeserahanInput) =>
      request(`${base}/seserahan/${id}`, seserahanResponseSchema, withBody("PUT", input)),
    setStatus: (id: string, status: SeserahanStatus) =>
      request(
        `${base}/seserahan/${id}/status`,
        seserahanResponseSchema,
        withBody("POST", { status }),
      ),
    remove: (id: string) => request(`${base}/seserahan/${id}`, okSchema, withBody("DELETE")),
  },

  buwuh: {
    list: () => request(`${base}/buwuh`, buwuhListResponseSchema),
    create: (input: BuwuhInput) =>
      request(`${base}/buwuh`, buwuhResponseSchema, withBody("POST", input)),
    update: (id: string, input: BuwuhInput) =>
      request(`${base}/buwuh/${id}`, buwuhResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/buwuh/${id}`, okSchema, withBody("DELETE")),
    catalog: () => request(`${base}/buwuh/catalog`, buwuhCatalogResponseSchema),
    saveCatalog: (input: BuwuhCatalogInput) =>
      request(`${base}/buwuh/catalog`, buwuhCatalogResponseSchema, withBody("PUT", input)),
    addresses: () => request(`${base}/buwuh/addresses`, buwuhAddressListResponseSchema),
    saveAddresses: (input: BuwuhAddressListInput) =>
      request(`${base}/buwuh/addresses`, buwuhAddressListResponseSchema, withBody("PUT", input)),
  },

  booth: {
    config: () => request(`${base}/booth/config`, boothConfigResponseSchema),
    saveConfig: (input: BoothConfigInput) =>
      request(`${base}/booth/config`, boothConfigResponseSchema, withBody("PUT", input)),
    photos: (page: number) =>
      request(
        `${base}/booth/photos${queryString({ page, pageSize: 24 })}`,
        boothPhotoListResponseSchema,
      ),
    remove: (id: string) => request(`${base}/booth/photos/${id}`, okSchema, withBody("DELETE")),
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
  guestsXlsx: `/api${base}/guests/export.xlsx`,
  templateXlsx: `/api${base}/guests/template.xlsx`,
  dataJson: `/api${base}/export/data.json`,
  mediaZip: `/api${base}/export/media.zip`,
  boothPhotosZip: `/api${base}/booth/photos.zip`,
  vendorsXlsx: `/api${base}/vendors/export.xlsx`,
  buwuhXlsx: `/api${base}/buwuh/export.xlsx`,
  seserahanXlsx: `/api${base}/seserahan/export.xlsx`,
  voiceZip: `/api${base}/voice/export.zip`,
  voiceAudio: (id: string) => `/api${base}/voice/${id}/audio`,
  /** Mengikuti filter yang sedang dipilih di halaman Hadiah. */
  receivedGiftsXlsx: (filter: ReceivedGiftFilter) => {
    const search = new URLSearchParams();
    if (filter.q) search.set("q", filter.q);
    if (filter.kind) search.set("kind", filter.kind);
    if (filter.thanked !== undefined) search.set("thanked", String(filter.thanked));
    const text = search.toString();
    return `/api${base}/received-gifts/export.xlsx${text ? `?${text}` : ""}`;
  },
};
