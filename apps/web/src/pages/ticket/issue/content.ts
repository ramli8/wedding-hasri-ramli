import type { PhotoKind } from "./photos.js";

/**
 * Isi contoh untuk halaman undangan (belum dari database). Bentuknya dibuat sedekat mungkin dengan
 * yang nanti disediakan server, supaya penyambungan data tinggal mengganti sumbernya.
 */
export type Pic = { kind: PhotoKind; tone: number };

export const ISSUE = {
  bride: {
    short: "Hasri",
    full: "Hasri Wiji Aqsari",
    parents: "Putri dari Bpk. Buasan & Ibu Nasu'ah",
    instagram: "hasriwiji",
    pic: { kind: "portrait", tone: 2 } as Pic,
  },
  groom: {
    short: "Ramli",
    full: "Mohamad Rizal Ramli",
    parents: "Putra dari Bpk. Ngatmari & Ibu Khotimah",
    instagram: "rizzal_ramli",
    pic: { kind: "stand", tone: 1 } as Pic,
  },
  guest: { name: "Bpk. Andi Saputra", group: "Keluarga" },
  dateLabel: "Jumat, 21 Mei 2027",
  dateParts: ["21", "05", "27"],
  target: "2027-05-21T08:00:00+07:00",
  city: "Jakarta",
  cover: { pic: { kind: "pair", tone: 0 } as Pic },
  letter: [
    "Dengan penuh rasa syukur, kami membuka edisi pertama dan satu-satunya ini. Tidak ada rubrik mode atau resep di dalamnya, hanya cerita dua orang yang memutuskan untuk berjalan bersama, dan hari ketika kami ingin Anda ada di sana.",
    "Kami menyusunnya seperti majalah yang biasa kami baca sambil menunggu hujan reda: pelan, penuh foto, dan boleh dibuka dari halaman mana saja. Silakan mulai dari daftar isi, lompat ke agenda, atau langsung menulis ucapan di surat pembaca.",
    "Kehadiran dan doa Anda adalah hadiah terbaik bagi kami. Terima kasih sudah menjadi bagian dari bab-bab sebelumnya, dan semoga berkenan menemani bab yang ini.",
  ],
  events: [
    {
      id: "akad",
      name: "Akad nikah",
      day: "Jumat, 21 Mei 2027",
      time: "08.00",
      range: "08.00 – 10.00 WIB",
      venue: "Masjid Al-Ikhlas",
      address: "Jl. Melati No. 5, Jakarta Selatan",
      startsAt: "2027-05-21T01:00:00Z",
      endsAt: "2027-05-21T03:00:00Z",
      maps: "https://maps.google.com/?q=Masjid+Al-Ikhlas+Jakarta",
    },
    {
      id: "resepsi",
      name: "Resepsi",
      day: "Jumat, 21 Mei 2027",
      time: "11.00",
      range: "11.00 – 14.00 WIB",
      venue: "Gedung Graha Bunga",
      address: "Jl. Mawar No. 12, Jakarta Selatan",
      startsAt: "2027-05-21T04:00:00Z",
      endsAt: "2027-05-21T07:00:00Z",
      maps: "https://maps.google.com/?q=Gedung+Graha+Bunga+Jakarta",
    },
  ],
  story: [
    {
      year: "2019",
      title: "Bertemu",
      pic: { kind: "portrait", tone: 3 } as Pic,
      body: [
        "Kami bertemu di ruang kuliah yang terlalu dingin, dalam satu kelompok tugas yang tidak pernah selesai tepat waktu. Hasri membawa catatan paling rapi, Ramli membawa camilan paling banyak.",
        "Tidak ada kilat atau musik latar. Hanya dua orang yang diam-diam senang karena kelompok itu tidak kunjung bubar.",
      ],
      quote: "Tidak ada kilat atau musik latar, hanya dua orang yang diam-diam senang.",
    },
    {
      year: "2022",
      title: "Mulai mengenal",
      pic: { kind: "sit", tone: 5 } as Pic,
      body: [
        "Percakapan kecil di sela hari yang panjang pelan-pelan jadi kebiasaan. Kopi sore, pesan singkat sebelum tidur, dan pulang lewat jalan yang lebih jauh.",
        "Di tahun itu kami belajar bahwa saling mengenal bukan soal tahu semua hal, tetapi soal mau terus bertanya.",
      ],
      quote: "Saling mengenal bukan soal tahu semua hal, tetapi mau terus bertanya.",
    },
    {
      year: "2023",
      title: "Memutuskan",
      pic: { kind: "land", tone: 6 } as Pic,
      body: [
        "Satu perjalanan panjang ke pegunungan membuat semuanya jelas. Di puncak yang berangin itu, tanpa sinyal dan tanpa rencana, kami sepakat untuk melangkah bersama.",
        "Keputusannya sederhana. Menjalaninya yang ternyata penuh kejutan.",
      ],
      quote: "Keputusannya sederhana. Menjalaninya yang penuh kejutan.",
    },
    {
      year: "2026",
      title: "Melamar",
      pic: { kind: "pair", tone: 4 } as Pic,
      body: [
        "Dua keluarga duduk di satu meja yang sama, ditemani teh hangat dan cerita lama yang diulang-ulang. Hari itu kami tahu bahwa rumah yang kami cari ternyata sudah ada.",
        "Kini tinggal satu bab lagi sebelum bab yang baru dimulai.",
      ],
      quote: "Rumah yang kami cari ternyata sudah ada.",
    },
  ],
  gallery: [
    { cap: "Pagi di dermaga", pic: { kind: "pair", tone: 6 } as Pic },
    { cap: "Sore di pantai, 2024", pic: { kind: "pair", tone: 0 } as Pic },
    { cap: "Kopi pertama", pic: { kind: "portrait", tone: 1 } as Pic },
    { cap: "Stasiun, hujan", pic: { kind: "stand", tone: 4 } as Pic },
    { cap: "Rumah nenek", pic: { kind: "sit", tone: 5 } as Pic },
    { cap: "Gunung, 2023", pic: { kind: "land", tone: 6 } as Pic },
    { cap: "Foto keluarga", pic: { kind: "pair", tone: 2 } as Pic },
    { cap: "Hari lamaran", pic: { kind: "portrait", tone: 3 } as Pic },
    { cap: "Jalan pulang", pic: { kind: "detail", tone: 1 } as Pic },
    { cap: "Tawa yang tidak direncanakan", pic: { kind: "pair", tone: 5 } as Pic },
  ],
  gifts: [
    { provider: "BCA", number: "9121 212", holder: "Hasri Wiji Aqsari" },
    { provider: "Mandiri", number: "9812 1212 77", holder: "Mohamad Rizal Ramli" },
    { provider: "GoPay", number: "0822 4714 1420", holder: "Hasri Wiji" },
  ],
  wishes: [
    {
      id: "kopi",
      name: "Mesin kopi manual",
      note: "Untuk pagi yang pelan.",
      quantity: 1,
      claimed: 0,
    },
    {
      id: "piring",
      name: "Set piring keramik",
      note: "Warna putih atau krem, 6 buah.",
      quantity: 2,
      claimed: 1,
    },
    {
      id: "sprei",
      name: "Sprei katun",
      note: "Ukuran 180 x 200, warna netral.",
      quantity: 2,
      claimed: 0,
    },
    {
      id: "blender",
      name: "Blender",
      note: "Yang tidak terlalu berisik.",
      quantity: 1,
      claimed: 1,
    },
    {
      id: "buku",
      name: "Buku resep",
      note: "Boleh bekas, asal penuh coretan.",
      quantity: 3,
      claimed: 0,
    },
    {
      id: "lampu",
      name: "Lampu meja",
      note: "Cahaya hangat untuk ruang baca.",
      quantity: 1,
      claimed: 0,
    },
  ],
  faqs: [
    {
      q: "Apakah ada tempat parkir?",
      a: "Ada. Area parkir tersedia di belakang gedung, dan petugas kami akan membantu mengarahkan. Bila datang berombongan, kami sarankan berbagi kendaraan.",
    },
    {
      q: "Apa pakaian yang sebaiknya dikenakan?",
      a: "Kami menyukai warna monokrom: hitam, putih, abu-abu, atau krem. Tidak wajib, tetapi akan membuat foto bersama terlihat seperti halaman majalah.",
    },
    {
      q: "Bolehkah membawa anak-anak?",
      a: "Tentu. Kami menyiapkan sudut kecil untuk mereka, lengkap dengan buku mewarnai.",
    },
    {
      q: "Di mana mengambil souvenir?",
      a: "Souvenir dibagikan di meja keluar setelah acara. Tunjukkan tiket QR Anda kepada petugas.",
    },
  ],
  letters: [
    {
      name: "Sinta",
      when: "2 jam lalu",
      text: "Selamat ya! Semoga samawa sampai tua. Ditunggu undangan makan-makannya.",
    },
    {
      name: "Budi",
      when: "kemarin",
      text: "Akhirnya! Dari tugas kelompok sampai pelaminan. Bahagia terus kalian berdua.",
    },
    {
      name: "Keluarga Wibowo",
      when: "3 hari lalu",
      text: "Barakallahu lakuma wa baraka alaikuma. Kami sekeluarga turut berbahagia.",
    },
  ],
} as const;

/** Halaman bernomor di daftar isi (01 sampul). */
export const TOC = [
  { id: "redaksi", title: "Dari redaksi", blurb: "Sepatah kata sebelum membuka halaman." },
  { id: "agenda", title: "Agenda", blurb: "Jam, tempat, dan hitung mundur." },
  { id: "tiket", title: "Tiket & RSVP", blurb: "QR masuk dan konfirmasi kehadiran." },
  { id: "profil", title: "Dua mempelai", blurb: "Siapa kami, dan siapa keluarga kami." },
  { id: "kisah", title: "Kisah kami", blurb: "Empat bab dari 2019 sampai hari ini." },
  { id: "foto", title: "Esai foto", blurb: "Sepuluh potret yang kami simpan." },
  { id: "kupon", title: "Kupon amplop", blurb: "Bila ingin berbagi kebahagiaan." },
  { id: "iklan", title: "Iklan baris", blurb: "Wishlist hadiah, silakan memilih." },
  { id: "tanya", title: "Tanya redaksi", blurb: "Parkir, pakaian, dan lain-lain." },
  { id: "surat", title: "Surat pembaca", blurb: "Tulis doa dan harapan Anda." },
] as const;

export const pageOf = (id: string) =>
  String(TOC.findIndex((item) => item.id === id) + 2).padStart(2, "0");
