import type { PhotoId } from "./photos.js";

/**
 * Isi contoh untuk halaman undangan (belum dari database). Bentuknya dibuat sedekat mungkin dengan
 * yang nanti disediakan server, supaya penyambungan data tinggal mengganti sumbernya.
 */
export type Pic = PhotoId;

export const ISSUE = {
  bride: {
    short: "Hasri",
    full: "Hasri Wiji Aqsari",
    parents: "Putri dari Bpk. Buasan & Ibu Nasu'ah",
    instagram: "hasriwiji",
    pic: 4 as Pic,
  },
  groom: {
    short: "Ramli",
    full: "Mohamad Rizal Ramli",
    parents: "Putra dari Bpk. Ngatmari & Ibu Khotimah",
    instagram: "rizzal_ramli",
    pic: 5 as Pic,
  },
  guest: { name: "Bpk. Andi Saputra", group: "Keluarga" },
  dateLabel: "Jumat, 21 Mei 2027",
  dateParts: ["21", "05", "2027"],
  target: "2027-05-21T08:00:00+07:00",
  city: "Jakarta",
  cover: { pic: 1 as Pic },
  /** Sinopsis: surat singkat dari mempelai. */
  letter: [
    "Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud menyelenggarakan pernikahan kami. Ini kisah dua orang yang bertemu di ruang kuliah yang terlalu dingin, lalu memutuskan untuk berjalan bersama.",
    "Kehadiran dan doa Anda adalah hadiah terbaik bagi kami. Semoga berkenan menyaksikan bab yang ini.",
  ],
  /** Kredit akhir: peran di kiri, nama di kanan. */
  credits: [
    { role: "Mempelai wanita", names: ["Hasri Wiji Aqsari"] },
    { role: "Mempelai pria", names: ["Mohamad Rizal Ramli"] },
    { role: "Orang tua mempelai wanita", names: ["Bpk. Buasan", "Ibu Nasu'ah"] },
    { role: "Orang tua mempelai pria", names: ["Bpk. Ngatmari", "Ibu Khotimah"] },
    {
      role: "Turut mengundang",
      names: ["Keluarga besar Bpk. Buasan", "Keluarga besar Bpk. Ngatmari"],
    },
    { role: "Lokasi", names: ["Masjid Al-Ikhlas", "Gedung Graha Bunga, Jakarta"] },
    { role: "Disutradarai oleh", names: ["Takdir"] },
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
      place: "Ruang kuliah",
      title: "Bertemu",
      pic: 5 as Pic,
      body: [
        "Kami bertemu di ruang kuliah yang terlalu dingin, dalam satu kelompok tugas yang tidak pernah selesai tepat waktu. Hasri membawa catatan paling rapi, Ramli membawa camilan paling banyak.",
        "Tidak ada kilat atau musik latar. Hanya dua orang yang diam-diam senang karena kelompok itu tidak kunjung bubar.",
      ],
      quote: "Tidak ada kilat atau musik latar, hanya dua orang yang diam-diam senang.",
    },
    {
      year: "2022",
      place: "Kedai kopi",
      title: "Mulai mengenal",
      pic: 4 as Pic,
      body: [
        "Percakapan kecil di sela hari yang panjang pelan-pelan jadi kebiasaan. Kopi sore, pesan singkat sebelum tidur, dan pulang lewat jalan yang lebih jauh.",
        "Di tahun itu kami belajar bahwa saling mengenal bukan soal tahu semua hal, tetapi soal mau terus bertanya.",
      ],
      quote: "Saling mengenal bukan soal tahu semua hal, tetapi mau terus bertanya.",
    },
    {
      year: "2023",
      place: "Puncak gunung",
      title: "Memutuskan",
      pic: 2 as Pic,
      body: [
        "Satu perjalanan panjang ke pegunungan membuat semuanya jelas. Di puncak yang berangin itu, tanpa sinyal dan tanpa rencana, kami sepakat untuk melangkah bersama.",
        "Keputusannya sederhana. Menjalaninya yang ternyata penuh kejutan.",
      ],
      quote: "Keputusannya sederhana. Menjalaninya yang penuh kejutan.",
    },
    {
      year: "2026",
      place: "Rumah keluarga",
      title: "Melamar",
      pic: 3 as Pic,
      body: [
        "Dua keluarga duduk di satu meja yang sama, ditemani teh hangat dan cerita lama yang diulang-ulang. Hari itu kami tahu bahwa rumah yang kami cari ternyata sudah ada.",
        "Kini tinggal satu bab lagi sebelum bab yang baru dimulai.",
      ],
      quote: "Rumah yang kami cari ternyata sudah ada.",
    },
  ],
  gallery: [
    { cap: "Senja di lereng", pic: 2 as Pic },
    { cap: "Kabut pagi", pic: 3 as Pic },
    { cap: "Di dekat jendela", pic: 4 as Pic },
    { cap: "Kabar pagi", pic: 5 as Pic },
    { cap: "Lereng hitam", pic: 1 as Pic },
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
      a: "Kami menyukai warna monokrom: hitam, putih, abu-abu, atau krem. Tidak wajib, tetapi akan membuat foto bersama terlihat seperti adegan film.",
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
