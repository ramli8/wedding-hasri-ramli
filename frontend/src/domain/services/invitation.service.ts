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
  /** Total unit yang tersedia. Fallback: 1 */
  stock_total?: number;
  /** Jumlah unit yang sudah diklaim tamu lain. Fallback: is_claimed ? 1 : 0 */
  claimed_count?: number;
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
  guest_id?: string | null;
  guest_name: string;
  message_text: string;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const DUMMY_THREADS: GuestbookThread[] = [
  {
    id: "dummy-th-01",
    guest_name: "Andi Pratama",
    messages: [
      {
        id: "dummy-th-01-m1",
        role: "guest",
        text: "Barakallahu laka wa baraka 'alaika. Selamat menempuh hidup baru, semoga menjadi keluarga sakinah, mawaddah, warahmah.",
        created_at: hoursAgo(1),
      },
    ],
  },
  {
    id: "dummy-th-02",
    guest_name: "Sari Wulandari",
    messages: [
      {
        id: "dummy-th-02-m1",
        role: "guest",
        text: "MasyaAllah, akhirnya! Barakallah Hasri & Ramli. Semoga langgeng sampai jannah-Nya Allah.",
        created_at: hoursAgo(5),
      },
    ],
  },
  {
    id: "dummy-th-03",
    guest_name: "Budi Santoso",
    messages: [
      {
        id: "dummy-th-03-m1",
        role: "guest",
        text: "Selamat atas pernikahannya! Turut berbahagia untuk kalian berdua.",
        created_at: hoursAgo(9),
      },
      {
        id: "dummy-th-03-m2",
        role: "couple",
        text: "Terima kasih banyak, Bang Budi. Doanya kami bawa pulang.",
        created_at: hoursAgo(8),
      },
      {
        id: "dummy-th-03-m3",
        role: "guest",
        text: "Sama-sama! Doanya kami terima dengan senang hati. Sampai ketemu di hari H ya!",
        created_at: hoursAgo(7),
      },
    ],
  },
  {
    id: "dummy-th-04",
    guest_name: "Dewi Lestari",
    messages: [
      {
        id: "dummy-th-04-m1",
        role: "guest",
        text: "Congrats! Dari jaman kuliah sampai akhirnya ke pelaminan juga. Bahagia selalu berdua!",
        created_at: hoursAgo(14),
      },
    ],
  },
  {
    id: "dummy-th-05",
    guest_name: "Keluarga Besar Hj. Maryam",
    messages: [
      {
        id: "dummy-th-05-m1",
        role: "guest",
        text: "Turut berbahagia. Semoga Allah memberkahi hubungan kalian dan dikaruniai keturunan yang sholeh & sholehah.",
        created_at: hoursAgo(22),
      },
    ],
  },
  {
    id: "dummy-th-06",
    guest_name: "Rizky Ramadhan",
    messages: [
      {
        id: "dummy-th-06-m1",
        role: "guest",
        text: "Selamat menempuh hidup baru, bro! Jangan lupa traktiran.",
        created_at: hoursAgo(30),
      },
      {
        id: "dummy-th-06-m2",
        role: "couple",
        text: "Siap, makasih ya! Traktirannya kita ganti katering resepsi.",
        created_at: hoursAgo(29),
      },
    ],
  },
  {
    id: "dummy-th-07",
    guest_name: "Fitri Handayani",
    messages: [
      {
        id: "dummy-th-07-m1",
        role: "guest",
        text: "MasyaAllah cantik banget undangannya. Barakallah, semoga samawa!",
        created_at: hoursAgo(46),
      },
    ],
  },
  {
    id: "dummy-th-08",
    guest_name: "Agus Wijaya",
    messages: [
      {
        id: "dummy-th-08-m1",
        role: "guest",
        text: "Barakallah! Semoga rezeki melimpah dan rumah tangga penuh keberkahan.",
        created_at: hoursAgo(60),
      },
    ],
  },
  {
    id: "dummy-th-09",
    guest_name: "Nadia Putri",
    messages: [
      {
        id: "dummy-th-09-m1",
        role: "guest",
        text: "Akhirnya sahur bareng bareng diganti acara resepsian. Selamat ya Hasri & Ramli, doa terbaik dari saya sekeluarga.",
        created_at: hoursAgo(80),
      },
    ],
  },
  {
    id: "dummy-th-10",
    guest_name: "Hendra Gunawan",
    messages: [
      {
        id: "dummy-th-10-m1",
        role: "guest",
        text: "Selamat menempuh hidup baru! Semoga langgeng dan bahagia selalu.",
        created_at: hoursAgo(110),
      },
    ],
  },
  {
    id: "dummy-th-11",
    guest_name: "Ibu Rina & Keluarga",
    messages: [
      {
        id: "dummy-th-11-m1",
        role: "guest",
        text: "Barakallah, anak-anak baik kami. Semoga menjadi pasangan yang saling menguatkan dalam kebaikan.",
        created_at: hoursAgo(150),
      },
    ],
  },
  {
    id: "dummy-th-12",
    guest_name: "Tim Basket SMA 5",
    messages: [
      {
        id: "dummy-th-12-m1",
        role: "guest",
        text: "Wih, kapten kita nikah duluan! Selamat ya bro, semoga samawa. Satu tim hadir semua nanti!",
        created_at: hoursAgo(200),
      },
      {
        id: "dummy-th-12-m2",
        role: "couple",
        text: "Jangan lupa bawa jersey lengkap ya, ada dresscode!",
        created_at: hoursAgo(199),
      },
    ],
  },
];

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
    // Data dinamis dari backend; jatuh ke data contoh bila backend offline.
    try {
      const { data } = await http.get<InvitationDetail>('/v1/invitation', {
        params: guestId ? { guest: guestId } : undefined,
        timeout: 8000,
      });
      if (data?.wedding) return data;
    } catch {
      // backend belum siap / offline
    }
    const { invitationStaticData } = await import('./invitation-static-data');
    return invitationStaticData;
  },

  async submitRsvp(payload: SubmitRsvpPayload): Promise<RsvpResponse> {
    const { data } = await http.post<RsvpResponse>('/v1/invitation/rsvp', payload);
    return data;
  },

  async listGuestbook(limit = 20): Promise<GuestbookThreadsResponse> {
    try {
      const { data } = await http.get<GuestbookResponse>('/v1/invitation/guestbook', {
        params: { limit },
      });
      if (data.entries?.length) return flattenToThreads(data.entries);
    } catch {
      // backend belum siap / offline — jatuh ke data contoh
    }
    const threads = DUMMY_THREADS.slice(0, limit);
    return {
      threads,
      total_messages: DUMMY_THREADS.reduce(
        (sum, thread) => sum + thread.messages.length,
        0,
      ),
      total_threads: DUMMY_THREADS.length,
    };
  },

  async submitGuestbook(payload: SubmitGuestbookPayload): Promise<GuestbookEntry> {
    const { data } = await http.post<GuestbookEntry>('/v1/invitation/guestbook', payload);
    return data;
  },
};
