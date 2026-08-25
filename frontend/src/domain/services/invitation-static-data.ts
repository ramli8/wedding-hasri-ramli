import type { InvitationDetail } from "./invitation.service";

export const invitationStaticData: InvitationDetail = {
  wedding: {
    groom_name: "Ramli",
    bride_name: "Hasri",
    wedding_date: "2026-12-12T20:00:00+07:00",
    content: {
      cover: {
        image_desktop: "/images/cover-1.png",
        image_tablet: "/images/cover-3.png",
        image_mobile: "/images/cover-5.png",
        button_text: "Buka Undangan",
        save_the_date_label: null,
        guest_greeting_label: null,
      },
      music: { file_url: "/audio/musik-undangan.mp3" },
      opening: {
        salam: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
        eyebrow: "Firman Allah",
        arabic:
          "وَمِنْ ءَايَـٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِى ذَٰلِكَ لَـَٔايَـٰتٍ لِّقَوْمٍ يَتَفَكَّرُونَ",
        translation:
          "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
        source: "Ar Rum: 21",
        greeting:
          "Dengan memohon rahmat dan ridho Allah SWT, tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami.",
      },
      dress_code: {
        description:
          "Kami akan berbahagia jika Anda hadir dengan nuansa warna netral earth tone.",
        color_palette: ["#4a3b3b", "#2f3e4e", "#5b6151", "#232c3d", "#7a6a54"],
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
          "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
        made_by_credit: "Hasri & Ramli — 2026",
        social_links: [],
      },
    },
    gift_shipping_address:
      "Jl. Contoh Alamat No. 123, Kelurahan Sukamaju, Kota, 12345 — a/n Keluarga Ramli",
  },
  couples: [
    {
      side: "wanita",
      full_name: "Hasri",
      nickname: null,
      gelar: null,
      photo_url: "/images/cover-2.png",
      instagram_handle: null,
      parents_line: "Putri dari Bpk. Ahmad & Ibu Siti",
    },
    {
      side: "pria",
      full_name: "Ramli",
      nickname: null,
      gelar: null,
      photo_url: "/images/cover-3.png",
      instagram_handle: null,
      parents_line: "Putra dari Bpk. Hasan & Ibu Maryam",
    },
  ],
  events: [
    {
      id: "evt-akad",
      name: "Akad Nikah",
      event_date: "2026-12-11T08:00:00+07:00",
      start_time: "2026-12-11T08:00:00+07:00",
      venue_name: "Ballroom Nama Venue",
      address_full: "Jl. Contoh Alamat No. 123, Kota",
      gmaps_url: "https://maps.google.com/?q=Ballroom+Nama+Venue",
      notes: "Kehadiran hanya untuk keluarga dan kerabat terdekat.",
      is_main_event: false,
    },
    {
      id: "evt-resepsi",
      name: "Resepsi",
      event_date: "2026-12-12T11:00:00+07:00",
      start_time: "2026-12-12T11:00:00+07:00",
      venue_name: "Ballroom Nama Venue",
      address_full: "Jl. Contoh Alamat No. 123, Kota",
      gmaps_url: "https://maps.google.com/?q=Ballroom+Nama+Venue",
      notes: "Resepsi dilanjutkan hingga pukul 14.00 WITA.",
      is_main_event: true,
    },
  ],
  story: [
    {
      event_date: "2013",
      title: "Awal Bertemu",
      description:
        "Kami pertama kali dipertemukan di sebuah kejadian sederhana yang tidak pernah kami duga akan menjadi awal dari segalanya.",
      detail:
        "Dipertemukan di sebuah acara sederhana yang saat itu tidak kami anggap istimewa, kami sama sekali tidak menyangka bahwa pertemuan itu akan menjadi awal dari segalanya.\n\nSebuah obrolan singkat di sore hari ternyata menjadi pintu dari ribuan percakapan lain setelahnya — dari hal-hal ringan, tawa kecil, sampai cerita tentang rencana hidup masing-masing.\n\nTahun itu kami hanya saling mengenal sebagai teman. Namun waktu membuktikan bahwa benih yang ditanam dengan sederhana bisa tumbuh menjadi sesuatu yang besar.",
      image_url: "/images/cover-2.png",
    },
    {
      event_date: "2019",
      title: "Menjalin Komitmen",
      description:
        "Tahun demi tahun kami lalui bersama, saling mengenal lebih dalam, hingga akhirnya memutuskan untuk berjalan ke arah yang sama.",
      detail:
        "Tahun demi tahun kami lalui bersama — melengkapi satu sama lain, menumbuhkan yang baik, dan terkadang saling menegur demi kebaikan.\n\nDi masa inilah kami belajar bahwa hubungan bukan tentang kesempurnaan, melainkan tentang dua orang yang memilih untuk tetap bertahan dan berjalan ke arah yang sama.\n\nPerlahan kedua keluarga kami mulai saling mengenal. Doa-doa baik pun diucapkan dari banyak pihak yang menyaksikan perjalanan kami.",
      image_url: "/images/cover-3.png",
    },
    {
      event_date: "2026",
      title: "Lamaran & Selamanya",
      description:
        "Dengan restu kedua keluarga, kami sepakat mengikat janji suci untuk membangun keluarga yang sakinah, mawaddah, warahmah.",
      detail:
        "Dengan restu kedua keluarga, sebuah lamaran sederhana diucapkan — dan dijawab dengan bahagia.\n\nKini kami mempersiapkan babak baru dalam hidup: mengikat janji suci, membangun rumah yang penuh canda dan doa, serta keluarga yang sakinah, mawaddah, warahmah.\n\nDan tak ada hal yang lebih membahagiakan bagi kami selain Anda turut hadir menjadi bagian dari hari paling berharga dalam perjalanan ini.",
      image_url: "/images/cover-4.png",
    },
  ],
  gallery: [
    { image_url: "/images/cover-1.png", caption: null },
    { image_url: "/images/gallery-a.jpg", caption: null },
    { image_url: "/images/gallery-b.jpg", caption: null },
    { image_url: "/images/gallery-c.jpg", caption: null },
    { image_url: "/images/cover-3.png", caption: "Awal cerita kami" },
    { image_url: "/images/gallery-f.jpg", caption: null },
    { image_url: "/images/gallery-e.jpg", caption: null },
    { image_url: "/images/gallery-d.jpg", caption: null },
    { image_url: "/images/gallery-g.jpg", caption: null },
    {
      image_url: "/images/cover-ori.jpg",
      caption: "Tawa kecil yang selalu ingin kami ulang",
    },
    { image_url: "/images/gallery-h.jpg", caption: null },
    { image_url: "/images/cover-5.png", caption: null },
  ],
  faqs: [
    {
      question: "Apakah saya bisa membawa pendamping?",
      answer:
        "Mohon datang sesuai jumlah yang tertera pada undangan agar akomodasi tempat dapat kami siapkan dengan nyaman.",
    },
    {
      question: "Kapan saya harus hadir?",
      answer:
        "Kami menyarankan untuk hadir 15 menit sebelum acara dimulai agar prosesi dapat berjalan lancar.",
    },
    {
      question: "Apakah tersedia parkir?",
      answer:
        "Ya, area parkir tersedia di lokasi venue dan gratis untuk seluruh tamu undangan.",
    },
  ],
  bank_accounts: [
    {
      bank_name: "BCA",
      account_number: "1234567890",
      account_holder_name: "Ramli",
    },
    {
      bank_name: "Mandiri",
      account_number: "0987654321",
      account_holder_name: "Hasri",
    },
  ],
  ewallets: [
    {
      provider_name: "QRIS",
      account_id: "Hasri & Ramli",
      qr_code_image_url: "/images/dummy-qris.png",
    },
    {
      provider_name: "GoPay",
      account_id: "0812 3456 7890",
      qr_code_image_url: null,
    },
    {
      provider_name: "ShopeePay",
      account_id: "0812 3456 7890",
      qr_code_image_url: null,
    },
  ],
  wishlist: [
    {
      item_name: "Air Fryer 4.5L",
      item_image_url: null,
      item_link: "https://www.tokopedia.com/search?q=air+fryer+4.5l",
      is_claimed: false,
      stock_total: 2,
      claimed_count: 1,
    },
    {
      item_name: "Rice Cooker Digital",
      item_image_url: null,
      item_link: null,
      is_claimed: true,
      stock_total: 1,
      claimed_count: 1,
    },
    {
      item_name: "Set Panci Granit",
      item_image_url: null,
      item_link: "https://www.tokopedia.com/search?q=set+panci+granit",
      is_claimed: false,
      stock_total: 3,
      claimed_count: 0,
    },
    {
      item_name: "Vacuum Cleaner Portable",
      item_image_url: null,
      item_link: null,
      is_claimed: false,
      stock_total: 1,
      claimed_count: 0,
    },
    {
      item_name: "Mesin Kopi Espresso",
      item_image_url: null,
      item_link: "https://www.tokopedia.com/search?q=mesin+kopi+espresso",
      is_claimed: false,
      stock_total: 2,
      claimed_count: 2,
    },
    {
      item_name: "Sprei King Size 180×200",
      item_image_url: null,
      item_link: null,
      is_claimed: false,
      stock_total: 2,
      claimed_count: 0,
    },
  ],
  sections: [
    { section_key: "cover", order_index: 1 },
    { section_key: "ayat", order_index: 2 },
    { section_key: "mempelai", order_index: 3 },
    { section_key: "countdown", order_index: 4 },
    { section_key: "acara", order_index: 5 },
    { section_key: "kisah", order_index: 6 },
    { section_key: "galeri", order_index: 7 },
    { section_key: "rsvp", order_index: 8 },
    { section_key: "ucapan", order_index: 9 },
    { section_key: "hadiah", order_index: 10 },
    { section_key: "dresscode", order_index: 11 },
    { section_key: "faq", order_index: 12 },
    { section_key: "penutup", order_index: 13 },
  ],
  countdown_target: "2026-12-12T11:00:00+07:00",
  guest: null,
};
