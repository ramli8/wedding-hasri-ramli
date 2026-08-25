import axios from 'axios';

export interface InvitationCoverContent {
  image_desktop: string | null;
  image_tablet: string | null;
  image_mobile: string | null;
  button_text: string;
  save_the_date_label: string | null;
  guest_greeting_label: string | null;
}

export interface InvitationMusicContent {
  file_url: string | null;
}

export interface InvitationOpeningContent {
  salam: string | null;
  eyebrow: string | null;
  arabic: string | null;
  translation: string | null;
  source: string | null;
  greeting: string | null;
}

export interface InvitationDressCodeContent {
  description: string | null;
  color_palette: string[];
  image_url: string | null;
}

export interface InvitationLivestreamContent {
  platform: string | null;
  url: string | null;
  datetime: string | null;
  notes: string | null;
}

export interface InvitationFooterContent {
  thank_you_message: string | null;
  made_by_credit: string | null;
  social_links: { [key: string]: string }[];
}

export interface InvitationWeddingContent {
  cover: InvitationCoverContent;
  music: InvitationMusicContent;
  opening: InvitationOpeningContent;
  dress_code: InvitationDressCodeContent;
  livestream: InvitationLivestreamContent;
  footer: InvitationFooterContent;
}

export interface InvitationWedding {
  groom_name: string;
  bride_name: string;
  wedding_date: string | null;
  content: InvitationWeddingContent;
  gift_shipping_address: string | null;
}

export interface InvitationCouple {
  side: string;
  full_name: string;
  nickname: string | null;
  gelar: string | null;
  photo_url: string | null;
  instagram_handle: string | null;
  /** Sementara diisi static data — field backend permanen menyusul di tiket #15. */
  parents_line?: string | null;
}

export interface InvitationEvent {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  order_index: number;
  venue_name: string | null;
  address_full: string | null;
  gmaps_url: string | null;
  notes: string | null;
  is_main_event: boolean;
}

export interface InvitationStory {
  event_date: string | null;
  title: string;
  description: string | null;
  detail: string | null;
  image_url: string | null;
}

export interface InvitationGalleryItem {
  image_url: string;
  caption: string | null;
}

export interface InvitationFaq {
  question: string;
  answer: string;
}

export interface InvitationBankAccount {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  image_url: string | null;
}

export interface InvitationEwallet {
  provider_name: string;
  account_id: string;
  qr_code_image_url: string | null;
  is_qris: boolean;
}

export interface InvitationWishlistItem {
  id: string;
  item_name: string;
  item_image_url: string | null;
  item_link: string | null;
  is_claimed: boolean;
  /** Total unit yang tersedia. Fallback: 1 */
  stock_total?: number;
  /** Jumlah unit yang sudah diklaim tamu lain. Fallback: is_claimed ? 1 : 0 */
  claimed_count?: number;
  /** Nama-nama tamu yang mengklaim item ini. */
  claimed_by_names?: string[];
}

export interface InvitationSectionMeta {
  section_key: string;
  order_index: number;
}

export interface InvitationGuestInfo {
  id: string;
  name: string;
  qr_code: string;
  category: string;
}

/** Jawaban konfirmasi yang sudah tersimpan untuk tamu ini (jika ada). */
export interface InvitationGuestRsvp {
  attendance_status: string;
  number_of_guests: number;
}

export interface InvitationDetail {
  wedding: InvitationWedding;
  couples: InvitationCouple[];
  events: InvitationEvent[];
  story: InvitationStory[];
  gallery: InvitationGalleryItem[];
  faqs: InvitationFaq[];
  bank_accounts: InvitationBankAccount[];
  ewallets: InvitationEwallet[];
  wishlist: InvitationWishlistItem[];
  sections: InvitationSectionMeta[];
  countdown_target: string | null;
  guest: InvitationGuestInfo | null;
  guest_rsvp: InvitationGuestRsvp | null;
}

export interface SubmitRsvpPayload {
  guest_id: string;
  attendance_status: 'hadir' | 'tidak_hadir' | 'ragu';
  number_of_guests: number;
  wedding_event_id?: string | null;
}

export interface RsvpResponse {
  id: string;
  guest_id: string;
  wedding_event_id: string | null;
  attendance_status: string;
  number_of_guests: number;
  submitted_at: string;
}

export interface GuestbookEntry {
  id: string;
  guest_name: string;
  message_text: string;
  reply_text: string | null;
  created_at: string;
}

export interface GuestbookResponse {
  entries: GuestbookEntry[];
  total: number;
}

export interface GuestbookThreadMessage {
  id: string;
  role: "guest" | "couple";
  text: string;
  created_at: string;
}

export interface GuestbookThread {
  id: string;
  guest_name: string;
  messages: GuestbookThreadMessage[];
}

export interface GuestbookThreadsResponse {
  threads: GuestbookThread[];
  total_messages: number;
  total_threads: number;
}

export interface SubmitGuestbookPayload {
  /** Wajib: hanya tamu resmi yang bisa mengirim ucapan. */
  guest_id: string;
  message_text: string;
}

export interface ClaimWishlistResponse {
  item_id: string;
  item_name: string;
  stock_total: number;
  claimed_count: number;
}



function flattenToThreads(entries: GuestbookEntry[]): GuestbookThreadsResponse {
  const threads: GuestbookThread[] = entries.map((entry) => ({
    id: entry.id,
    guest_name: entry.guest_name,
    messages: [
      {
        id: `${entry.id}-m1`,
        role: "guest",
        text: entry.message_text,
        created_at: entry.created_at,
      },
      ...(entry.reply_text
        ? [
            {
              id: `${entry.id}-m2`,
              role: "couple" as const,
              text: entry.reply_text,
              created_at: entry.created_at,
            },
          ]
        : []),
    ],
  }));
  return {
    threads,
    total_messages: threads.reduce((sum, thread) => sum + thread.messages.length, 0),
    total_threads: threads.length,
  };
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const invitationService = {
  async getPublicInvitation(guestId?: string | null): Promise<InvitationDetail> {
    // Semua konten WAJIB dari backend — tanpa fallback statis.
    // Kegagalan jaringan diteruskan sebagai error agar UI menampilkan state gagal.
    const { data } = await http.get<InvitationDetail>('/v1/invitation', {
      params: guestId ? { guest: guestId } : undefined,
      timeout: 8000,
    });
    if (!data?.wedding) {
      throw new Error('Data undangan tidak valid');
    }
    return data;
  },

  async submitRsvp(payload: SubmitRsvpPayload): Promise<RsvpResponse> {
    const { data } = await http.post<RsvpResponse>('/v1/invitation/rsvp', payload);
    return data;
  },

  async listGuestbook(limit = 20): Promise<GuestbookThreadsResponse> {
    const { data } = await http.get<GuestbookResponse>('/v1/invitation/guestbook', {
      params: { limit },
    });
    if (data.entries?.length) return flattenToThreads(data.entries);
    return { threads: [], total_messages: 0, total_threads: 0 };
  },

  async submitGuestbook(payload: SubmitGuestbookPayload): Promise<GuestbookEntry> {
    const { data } = await http.post<GuestbookEntry>('/v1/invitation/guestbook', payload);
    return data;
  },

  /** Tamu mengklaim satu barang wishlist (1 tamu = maksimal 1 barang). */
  async claimWishlistItem(itemId: string, guestId: string): Promise<ClaimWishlistResponse> {
    const { data } = await http.post<ClaimWishlistResponse>(
      `/v1/invitation/wishlist/${itemId}/claim`,
      { guest_id: guestId },
    );
    return data;
  },

  /** Tamu membatalkan klaim wishlist. */
  async unclaimWishlistItem(itemId: string, guestId: string): Promise<void> {
    await http.delete(`/v1/invitation/wishlist/${itemId}/claim`, {
      data: { guest_id: guestId },
    });
  },
};
