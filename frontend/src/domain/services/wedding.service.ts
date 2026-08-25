import apiClient from './api-client';

// --- Shared content types (mirrors backend WeddingContent) ---

export interface CoverContent {
  image_desktop: string;
  image_tablet: string;
  image_mobile: string;
  button_text: string;
  save_the_date_label?: string | null;
  guest_greeting_label?: string | null;
}

export interface MusicContent {
  file_url: string | null;
}

export interface OpeningContent {
  salam: string | null;
  eyebrow: string | null;
  arabic: string | null;
  translation: string | null;
  source: string | null;
  greeting: string | null;
}

export interface DressCodeContent {
  description: string | null;
  color_palette: string[];
  image_url: string | null;
}

export interface LivestreamContent {
  platform: string | null;
  url: string | null;
  datetime: string | null;
  notes: string | null;
}

export interface FooterContent {
  thank_you_message: string | null;
  made_by_credit: string | null;
  social_links: { [key: string]: string }[];
}

export interface WeddingContent {
  cover: CoverContent;
  music: MusicContent;
  opening: OpeningContent;
  dress_code: DressCodeContent;
  livestream: LivestreamContent;
  footer: FooterContent;
}

export const DEFAULT_WEDDING_CONTENT: WeddingContent = {
  cover: {
    image_desktop: '',
    image_tablet: '',
    image_mobile: '',
    button_text: 'Buka Undangan',
  },
  music: { file_url: null },
  opening: { salam: null, eyebrow: null, arabic: null, translation: null, source: null, greeting: null },
  dress_code: { description: null, color_palette: [], image_url: null },
  livestream: { platform: null, url: null, datetime: null, notes: null },
  footer: { thank_you_message: null, made_by_credit: null, social_links: [] },
};

// --- Wedding singleton ---

export interface WeddingResponse {
  groom_name: string;
  bride_name: string;
  wedding_date: string | null;
  content: WeddingContent | null;
  gift_shipping_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateWeddingRequest {
  groom_name: string;
  bride_name: string;
  wedding_date?: string | null;
  content?: WeddingContent;
  gift_shipping_address?: string | null;
}

// --- Couples ---

export type CoupleSide = 'pria' | 'wanita';

export interface CoupleResponse {
  id: string;
  side: CoupleSide;
  full_name: string;
  nickname: string | null;
  gelar: string | null;
  photo_url: string | null;
  instagram_handle: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCoupleRequest {
  side: CoupleSide;
  full_name: string;
  nickname?: string | null;
  gelar?: string | null;
  photo_url?: string | null;
  instagram_handle?: string | null;
}

export interface UpdateCoupleRequest {
  side?: CoupleSide;
  full_name?: string;
  nickname?: string | null;
  gelar?: string | null;
  photo_url?: string | null;
  instagram_handle?: string | null;
}

// --- Events ---

export interface EventResponse {
  id: string;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  address_full: string | null;
  gmaps_url: string | null;
  notes: string | null;
  is_main_event: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  name: string;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue_name?: string | null;
  address_full?: string | null;
  gmaps_url?: string | null;
  notes?: string | null;
  is_main_event?: boolean;
  order_index?: number;
}

export interface UpdateEventRequest {
  name?: string;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue_name?: string | null;
  address_full?: string | null;
  gmaps_url?: string | null;
  notes?: string | null;
  is_main_event?: boolean;
  order_index?: number;
}

// --- Story ---

export interface StoryResponse {
  id: string;
  event_date: string | null;
  title: string;
  description: string | null;
  detail: string | null;
  image_url: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStoryRequest {
  event_date?: string | null;
  title: string;
  description?: string | null;
  detail?: string | null;
  image_url?: string | null;
  order_index?: number;
}

export interface UpdateStoryRequest {
  event_date?: string | null;
  title?: string;
  description?: string | null;
  detail?: string | null;
  image_url?: string | null;
  order_index?: number;
}

// --- Gallery ---

export interface GalleryItemResponse {
  id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGalleryItemRequest {
  image_url: string;
  caption?: string | null;
  order_index?: number;
}

export interface UpdateGalleryItemRequest {
  image_url?: string;
  caption?: string | null;
  order_index?: number;
}

// --- FAQs ---

export interface FaqResponse {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFaqRequest {
  question: string;
  answer: string;
  order_index?: number;
}

export interface UpdateFaqRequest {
  question?: string;
  answer?: string;
  order_index?: number;
}

// --- Bank accounts ---

export interface BankAccountResponse {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountRequest {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  image_url?: string | null;
  is_active?: boolean;
}

export interface UpdateBankAccountRequest {
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  image_url?: string | null;
  is_active?: boolean;
}

// --- Ewallets ---

export interface EwalletResponse {
  id: string;
  provider_name: string;
  account_id: string;
  qr_code_image_url: string | null;
  is_qris: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEwalletRequest {
  provider_name: string;
  account_id: string;
  qr_code_image_url?: string | null;
  is_active?: boolean;
}

export interface UpdateEwalletRequest {
  provider_name?: string;
  account_id?: string;
  qr_code_image_url?: string | null;
  is_active?: boolean;
}

// --- Wishlist ---

export interface WishlistItemResponse {
  id: string;
  item_name: string;
  item_image_url: string | null;
  item_link: string | null;
  stock_total: number;
  claimed_count: number;
  claimed_by_names?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateWishlistItemRequest {
  item_name: string;
  item_image_url?: string | null;
  item_link?: string | null;
  stock_total?: number;
}

export interface UpdateWishlistItemRequest {
  item_name?: string;
  item_image_url?: string | null;
  item_link?: string | null;
  stock_total?: number;
}

// --- Sections ---

export interface SectionResponse {
  id: string;
  section_key: string;
  is_enabled: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSectionRequest {
  section_key: string;
  is_enabled?: boolean;
  order_index?: number;
}

export interface UpdateSectionRequest {
  is_enabled?: boolean;
  order_index?: number;
}

// --- Ucapan: balasan admin ---

export interface AdminGuestbookEntry {
  id: string;
  guest_name: string;
  message_text: string;
  reply_text: string | null;
  replied_at: string | null;
  is_hidden: boolean;
  created_at: string;
}

export interface GuestbookReplyRequest {
  reply_text: string;
}

// --- Ringkasan konfirmasi kehadiran ---

export interface RsvpSummaryItem {
  id: string;
  guest_name: string;
  category_name: string | null;
  event_name: string | null;
  attendance_status: string;
  number_of_guests: number;
  submitted_at: string;
}

export interface RsvpSummaryResponse {
  hadir: number;
  berhalangan: number;
  total_guests: number;
  belum_konfirmasi: number;
  total_orang_hadir: number;
  items: RsvpSummaryItem[];
}

const BASE = '/v1/wedding';

export const weddingService = {
  // Singleton
  async getWedding(): Promise<WeddingResponse> {
    const response = await apiClient.get<WeddingResponse>(BASE);
    return response.data;
  },
  async updateWedding(req: UpdateWeddingRequest): Promise<WeddingResponse> {
    const response = await apiClient.put<WeddingResponse>(BASE, req);
    return response.data;
  },

  // Couples
  async getCouples(): Promise<CoupleResponse[]> {
    const response = await apiClient.get<CoupleResponse[]>(`${BASE}/couples`);
    return response.data;
  },
  async createCouple(req: CreateCoupleRequest): Promise<CoupleResponse> {
    const response = await apiClient.post<CoupleResponse>(`${BASE}/couples`, req);
    return response.data;
  },
  async updateCouple(id: string, req: UpdateCoupleRequest): Promise<CoupleResponse> {
    const response = await apiClient.put<CoupleResponse>(`${BASE}/couples/${id}`, req);
    return response.data;
  },

  // Events
  async getEvents(): Promise<EventResponse[]> {
    const response = await apiClient.get<EventResponse[]>(`${BASE}/events`);
    return response.data;
  },
  async createEvent(req: CreateEventRequest): Promise<EventResponse> {
    const response = await apiClient.post<EventResponse>(`${BASE}/events`, req);
    return response.data;
  },
  async updateEvent(id: string, req: UpdateEventRequest): Promise<EventResponse> {
    const response = await apiClient.put<EventResponse>(`${BASE}/events/${id}`, req);
    return response.data;
  },
  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/events/${id}`);
  },

  // Story
  async getStories(): Promise<StoryResponse[]> {
    const response = await apiClient.get<StoryResponse[]>(`${BASE}/story`);
    return response.data;
  },
  async createStory(req: CreateStoryRequest): Promise<StoryResponse> {
    const response = await apiClient.post<StoryResponse>(`${BASE}/story`, req);
    return response.data;
  },
  async updateStory(id: string, req: UpdateStoryRequest): Promise<StoryResponse> {
    const response = await apiClient.put<StoryResponse>(`${BASE}/story/${id}`, req);
    return response.data;
  },
  async deleteStory(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/story/${id}`);
  },

  // Gallery
  async getGalleryItems(): Promise<GalleryItemResponse[]> {
    const response = await apiClient.get<GalleryItemResponse[]>(`${BASE}/gallery`);
    return response.data;
  },
  async createGalleryItem(req: CreateGalleryItemRequest): Promise<GalleryItemResponse> {
    const response = await apiClient.post<GalleryItemResponse>(`${BASE}/gallery`, req);
    return response.data;
  },
  async updateGalleryItem(id: string, req: UpdateGalleryItemRequest): Promise<GalleryItemResponse> {
    const response = await apiClient.put<GalleryItemResponse>(`${BASE}/gallery/${id}`, req);
    return response.data;
  },
  async deleteGalleryItem(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/gallery/${id}`);
  },

  // FAQs
  async getFaqs(): Promise<FaqResponse[]> {
    const response = await apiClient.get<FaqResponse[]>(`${BASE}/faqs`);
    return response.data;
  },
  async createFaq(req: CreateFaqRequest): Promise<FaqResponse> {
    const response = await apiClient.post<FaqResponse>(`${BASE}/faqs`, req);
    return response.data;
  },
  async updateFaq(id: string, req: UpdateFaqRequest): Promise<FaqResponse> {
    const response = await apiClient.put<FaqResponse>(`${BASE}/faqs/${id}`, req);
    return response.data;
  },
  async deleteFaq(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/faqs/${id}`);
  },

  // Bank accounts
  async getBankAccounts(): Promise<BankAccountResponse[]> {
    const response = await apiClient.get<BankAccountResponse[]>(`${BASE}/bank-accounts`);
    return response.data;
  },
  async createBankAccount(req: CreateBankAccountRequest): Promise<BankAccountResponse> {
    const response = await apiClient.post<BankAccountResponse>(`${BASE}/bank-accounts`, req);
    return response.data;
  },
  async updateBankAccount(id: string, req: UpdateBankAccountRequest): Promise<BankAccountResponse> {
    const response = await apiClient.put<BankAccountResponse>(`${BASE}/bank-accounts/${id}`, req);
    return response.data;
  },
  async deleteBankAccount(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/bank-accounts/${id}`);
  },

  // Ewallets
  async getEwallets(): Promise<EwalletResponse[]> {
    const response = await apiClient.get<EwalletResponse[]>(`${BASE}/ewallets`);
    return response.data;
  },
  async createEwallet(req: CreateEwalletRequest): Promise<EwalletResponse> {
    const response = await apiClient.post<EwalletResponse>(`${BASE}/ewallets`, req);
    return response.data;
  },
  async updateEwallet(id: string, req: UpdateEwalletRequest): Promise<EwalletResponse> {
    const response = await apiClient.put<EwalletResponse>(`${BASE}/ewallets/${id}`, req);
    return response.data;
  },
  async deleteEwallet(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/ewallets/${id}`);
  },

  // Wishlist
  async getWishlistItems(): Promise<WishlistItemResponse[]> {
    const response = await apiClient.get<WishlistItemResponse[]>(`${BASE}/wishlist`);
    return response.data;
  },
  async createWishlistItem(req: CreateWishlistItemRequest): Promise<WishlistItemResponse> {
    const response = await apiClient.post<WishlistItemResponse>(`${BASE}/wishlist`, req);
    return response.data;
  },
  async updateWishlistItem(id: string, req: UpdateWishlistItemRequest): Promise<WishlistItemResponse> {
    const response = await apiClient.put<WishlistItemResponse>(`${BASE}/wishlist/${id}`, req);
    return response.data;
  },
  async deleteWishlistItem(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/wishlist/${id}`);
  },

  // Sections
  async getSections(): Promise<SectionResponse[]> {
    const response = await apiClient.get<SectionResponse[]>(`${BASE}/sections`);
    return response.data;
  },
  async createSection(req: CreateSectionRequest): Promise<SectionResponse> {
    const response = await apiClient.post<SectionResponse>(`${BASE}/sections`, req);
    return response.data;
  },
  async updateSection(id: string, req: UpdateSectionRequest): Promise<SectionResponse> {
    const response = await apiClient.put<SectionResponse>(`${BASE}/sections/${id}`, req);
    return response.data;
  },

  // Ucapan: daftar & balasan admin
  async getAdminGuestbook(): Promise<AdminGuestbookEntry[]> {
    const response = await apiClient.get<AdminGuestbookEntry[]>(`${BASE}/guestbook`);
    return response.data;
  },
  async replyGuestbook(id: string, req: GuestbookReplyRequest): Promise<AdminGuestbookEntry> {
    const response = await apiClient.put<AdminGuestbookEntry>(
      `${BASE}/guestbook/${id}/reply`,
      req,
    );
    return response.data;
  },
  async deleteGuestbook(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/guestbook/${id}`);
  },

  // Ringkasan konfirmasi kehadiran
  async getRsvpSummary(): Promise<RsvpSummaryResponse> {
    const response = await apiClient.get<RsvpSummaryResponse>(`${BASE}/rsvp/summary`);
    return response.data;
  },
};
