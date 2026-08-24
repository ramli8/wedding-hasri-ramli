import axios from 'axios';

export interface InvitationCoverContent {
  photos: string[];
  button_text: string;
}

export interface InvitationMusicContent {
  file_url: string | null;
}

export interface InvitationOpeningContent {
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
  gelar: string | null;
  photo_url: string | null;
  instagram_handle: string | null;
}

export interface InvitationEvent {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
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
}

export interface InvitationEwallet {
  provider_name: string;
  account_id: string;
  qr_code_image_url: string | null;
}

export interface InvitationWishlistItem {
  item_name: string;
  item_image_url: string | null;
  item_link: string | null;
  is_claimed: boolean;
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

export interface SubmitGuestbookPayload {
  guest_id?: string | null;
  guest_name: string;
  message_text: string;
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const invitationService = {
  async getPublicInvitation(_guestId?: string | null): Promise<InvitationDetail> {
    // TODO(api): swap ke GET /invitation?guest=<uuid> lewat axios polos
    // (tanpa interceptor auth) saat endpoint backend dirapikan.
    const { invitationStaticData } = await import('./invitation-static-data');
    return invitationStaticData;
  },

  async submitRsvp(payload: SubmitRsvpPayload): Promise<RsvpResponse> {
    const { data } = await http.post<RsvpResponse>('/invitation/rsvp', payload);
    return data;
  },

  async listGuestbook(limit = 20): Promise<GuestbookResponse> {
    const { data } = await http.get<GuestbookResponse>('/invitation/guestbook', {
      params: { limit },
    });
    return data;
  },

  async submitGuestbook(payload: SubmitGuestbookPayload): Promise<GuestbookEntry> {
    const { data } = await http.post<GuestbookEntry>('/invitation/guestbook', payload);
    return data;
  },
};
