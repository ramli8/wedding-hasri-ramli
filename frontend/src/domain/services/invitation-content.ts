export type InvitationSection = {
  id: string;
  number: string;
  label: string;
};

export const invitationContent = {
  couple: {
    names: ["Hasri", "Ramli"],
  },
  wedding: {
    date: "2026-12-12",
    dateLabel: "Sabtu, 12 Desember 2026",
    venue: "Nama Venue",
    location: "Kota",
  },
  cover: {
    photos: [
      "/images/cover-1.png",
      "/images/cover-2.png",
      "/images/cover-3.png",
      "/images/cover-4.png",
      "/images/cover-5.png",
    ],
  },
  music: {
    src: "/audio/musik-undangan.mp3",
  },
  ayat: {
    eyebrow: "Firman Allah",
    arabic:
      "وَمِنْ ءَايَـٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِى ذَٰلِكَ لَـَٔايَـٰتٍ لِّقَوْمٍ يَتَفَكَّرُونَ",
    translation:
      "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
    source: "Ar Rum: 21",
  },
  penutup: {
    bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    doa: "Kami mohon do'a & restunya atas pernikahan kami",
  },
  mempelai: {
    wanita: {
      nama: "Hasri",
      gelar: null as string | null,
      ig: null as string | null,
    },
    pria: {
      nama: "Ramli",
      gelar: null as string | null,
      ig: null as string | null,
    },
    fotoWanita: null as string | null,
    fotoPria: null as string | null,
  },
  sections: {
    cover: { id: "cover", number: "01", label: "Pembuka" },
    ayat: { id: "ayat", number: "02", label: "Ayat" },
    mempelai: { id: "mempelai", number: "03", label: "Mempelai" },
    "kisah-cinta": { id: "kisah-cinta", number: "04", label: "Kisah Cinta" },
    acara: { id: "acara", number: "05", label: "Acara" },
    countdown: { id: "countdown", number: "06", label: "Countdown" },
    galeri: { id: "galeri", number: "07", label: "Galeri" },
    rsvp: { id: "rsvp", number: "08", label: "RSVP" },
    ucapan: { id: "ucapan", number: "09", label: "Ucapan" },
    hadiah: { id: "hadiah", number: "10", label: "Hadiah" },
    qr: { id: "qr", number: "11", label: "QR Check-in" },
    info: { id: "info", number: "12", label: "Info Penting" },
    penutup: { id: "penutup", number: "13", label: "Penutup" },
  },
} as const;
