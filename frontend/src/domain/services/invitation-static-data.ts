import type { InvitationDetail } from './invitation.service';

export const invitationStaticData: InvitationDetail = {
  wedding: {
    groom_name: 'Ramli',
    bride_name: 'Hasri',
    wedding_date: '2026-12-12T08:00:00+07:00',
    content: {
      cover: {
        photos: [
          '/images/cover-1.png',
          '/images/cover-2.png',
          '/images/cover-3.png',
          '/images/cover-4.png',
          '/images/cover-5.png',
        ],
        button_text: 'Buka Undangan',
      },
      music: { file_url: '/audio/musik-undangan.mp3' },
      opening: {
        eyebrow: 'Firman Allah',
        arabic:
          'وَمِنْ ءَايَـٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِى ذَٰلِكَ لَـَٔايَـٰتٍ لِّقَوْمٍ يَتَفَكَّرُونَ',
        translation:
          'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.',
        source: 'Ar Rum: 21',
        greeting:
          'Dengan memohon rahmat dan ridho Allah SWT, tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami.',
      },
      dress_code: {
        description:
          'Kami akan berbahagia jika Anda hadir dengan nuansa warna netral earth tone.',
        color_palette: ['#4a3b3b', '#2f3e4e', '#5b6151', '#232c3d', '#7a6a54'],
        image_url: null,
      },
      livestream: {
        platform: null,
        url: null,
        datetime: null,
        notes: null,
      },
      footer: {
        thank_you_message:
          'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
        made_by_credit: 'Hasri & Ramli — 2026',
        social_links: [],
      },
    },
    gift_shipping_address:
      'Jl. Contoh Alamat No. 123, Kelurahan Sukamaju, Kota, 12345 — a/n Keluarga Ramli',
  },
  couples: [
    {
      side: 'wanita',
      full_name: 'Hasri',
      gelar: null,
      photo_url: '/images/cover-2.png',
      instagram_handle: null,
      parents_line: 'Putri dari Bpk. Ahmad & Ibu Siti',
    },
    {
      side: 'pria',
      full_name: 'Ramli',
      gelar: null,
      photo_url: '/images/cover-3.png',
      instagram_handle: null,
      parents_line: 'Putra dari Bpk. Hasan & Ibu Maryam',
    },
  ],
  events: [
    {
      id: 'evt-akad',
      name: 'Akad Nikah',
      event_date: '2026-12-12T08:00:00+07:00',
      start_time: '2026-12-12T08:00:00+07:00',
      venue_name: 'Ballroom Nama Venue',
      address_full: 'Jl. Contoh Alamat No. 123, Kota',
      gmaps_url: 'https://maps.google.com/?q=Ballroom+Nama+Venue',
      notes: 'Kehadiran hanya untuk keluarga dan kerabat terdekat.',
      is_main_event: false,
    },
    {
      id: 'evt-resepsi',
      name: 'Resepsi',
      event_date: '2026-12-12T11:00:00+07:00',
      start_time: '2026-12-12T11:00:00+07:00',
      venue_name: 'Ballroom Nama Venue',
      address_full: 'Jl. Contoh Alamat No. 123, Kota',
      gmaps_url: 'https://maps.google.com/?q=Ballroom+Nama+Venue',
      notes: 'Resepsi dilanjutkan hingga pukul 14.00 WITA.',
      is_main_event: true,
    },
  ],
  story: [
    {
      event_date: '2013',
      title: 'Awal Bertemu',
      description:
        'Kami pertama kali dipertemukan di sebuah kejadian sederhana yang tidak pernah kami duga akan menjadi awal dari segalanya.',
      image_url: '/images/cover-2.png',
    },
    {
      event_date: '2019',
      title: 'Menjalin Komitmen',
      description:
        'Tahun demi tahun kami lalui bersama, saling mengenal lebih dalam, hingga akhirnya memutuskan untuk berjalan ke arah yang sama.',
      image_url: '/images/cover-3.png',
    },
    {
      event_date: '2026',
      title: 'Lamaran & Selamanya',
      description:
        'Dengan restu kedua keluarga, kami sepakat mengikat janji suci untuk membangun keluarga yang sakinah, mawaddah, warahmah.',
      image_url: '/images/cover-4.png',
    },
  ],
  gallery: [
    { image_url: '/images/cover-1.png', caption: null },
    { image_url: '/images/cover-2.png', caption: null },
    { image_url: '/images/cover-3.png', caption: null },
    { image_url: '/images/cover-4.png', caption: null },
    { image_url: '/images/cover-5.png', caption: null },
    { image_url: '/images/cover-ori.jpg', caption: null },
  ],
  faqs: [
    {
      question: 'Apakah saya bisa membawa pendamping?',
      answer:
        'Mohon datang sesuai jumlah yang tertera pada undangan agar akomodasi tempat dapat kami siapkan dengan nyaman.',
    },
    {
      question: 'Kapan saya harus hadir?',
      answer:
        'Kami menyarankan untuk hadir 15 menit sebelum acara dimulai agar prosesi dapat berjalan lancar.',
    },
    {
      question: 'Apakah tersedia parkir?',
      answer:
        'Ya, area parkir tersedia di lokasi venue dan gratis untuk seluruh tamu undangan.',
    },
  ],
  bank_accounts: [
    {
      bank_name: 'BCA',
      account_number: '1234567890',
      account_holder_name: 'Ramli',
    },
    {
      bank_name: 'Mandiri',
      account_number: '0987654321',
      account_holder_name: 'Hasri',
    },
  ],
  ewallets: [
    {
      provider_name: 'QRIS',
      account_id: 'Hasri & Ramli',
      qr_code_image_url: null,
    },
  ],
  wishlist: [],
  sections: [
    { section_key: 'cover', order_index: 1 },
    { section_key: 'ayat', order_index: 2 },
    { section_key: 'mempelai', order_index: 3 },
    { section_key: 'countdown', order_index: 4 },
    { section_key: 'acara', order_index: 5 },
    { section_key: 'kisah', order_index: 6 },
    { section_key: 'galeri', order_index: 7 },
    { section_key: 'rsvp', order_index: 8 },
    { section_key: 'ucapan', order_index: 9 },
    { section_key: 'hadiah', order_index: 10 },
    { section_key: 'dresscode', order_index: 11 },
    { section_key: 'faq', order_index: 12 },
    { section_key: 'penutup', order_index: 13 },
  ],
  countdown_target: '2026-12-12T08:00:00+07:00',
  guest: null,
};
