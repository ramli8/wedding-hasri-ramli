import { useQuery } from "@tanstack/react-query";
import {
  devicesQuery,
  eventsQuery,
  groupsQuery,
  homeQuery,
  seoQuery,
  settingsQuery,
} from "./queries.js";

export type GuideStep = {
  id: string;
  phase: "Persiapan" | "Undangan" | "Hari-H" | "Setelah acara";
  title: string;
  /** Satu kalimat: untuk apa langkah ini. */
  why: string;
  /** Hal konkret yang perlu diisi. */
  todo: string[];
  to: string;
  cta: string;
  optional?: boolean;
  done: boolean;
};

/** Langkah penggunaan aplikasi; status selesai dihitung dari data yang sudah ada. */
export function useGuideSteps() {
  const settings = useQuery(settingsQuery);
  const events = useQuery(eventsQuery);
  const groups = useQuery(groupsQuery);
  const devices = useQuery(devicesQuery);
  const home = useQuery(homeQuery);
  const seo = useQuery(seoQuery);
  const ready = [settings, events, groups, devices, home].every((q) => q.isSuccess);

  const h = home.data;
  const answered = h?.rsvp ? h.rsvp.hadir + h.rsvp.tidakHadir + h.rsvp.ragu : 0;

  const steps: GuideStep[] = [
    {
      id: "pengaturan",
      phase: "Persiapan",
      title: "Isi data pernikahan",
      why: "Nama mempelai dan alamat situs dipakai untuk menyusun link undangan tiap tamu.",
      todo: [
        "Nama mempelai pria dan wanita",
        "Alamat situs, mis. https://hasriramli.com (link tamu menjadi alamat ini + /u/KODE)",
      ],
      to: "/admin/pengaturan",
      cta: "Buka Pengaturan",
      done: settings.data != null,
    },
    {
      id: "acara",
      phase: "Persiapan",
      title: "Buat acara",
      why: "Setiap tamu diundang ke satu atau lebih acara. Check-in dan RSVP diatur per acara.",
      todo: [
        "Nama acara (Akad Nikah, Resepsi, …), waktu mulai dan selesai (WIB)",
        "Nama tempat, alamat, dan link peta",
        "Aktifkan Check-in QR di acara yang memakai scanner, dan RSVP bila tamu perlu menjawab",
      ],
      to: "/admin/acara",
      cta: "Buka Acara",
      done: (events.data?.length ?? 0) > 0,
    },
    {
      id: "kelompok",
      phase: "Persiapan",
      title: "Buat kelompok tamu",
      why: "Kelompok memberi warna, penanda VIP, dan jam sesi kedatangan. Boleh dilewati.",
      todo: ["Nama kelompok, mis. Keluarga, Teman Kantor, VIP", "Jam sesi per acara (opsional)"],
      to: "/admin/kelompok",
      cta: "Buka Kelompok",
      optional: true,
      done: (groups.data?.length ?? 0) > 0,
    },
    {
      id: "tamu",
      phase: "Persiapan",
      title: "Masukkan daftar tamu",
      why: "Tiap tamu mendapat kode 6 huruf yang menjadi QR tiket dan link pribadinya.",
      todo: [
        "Tambah satu per satu, atau impor dari CSV (ada templatnya di halaman impor)",
        "Nama undangan seperti di pesan, mis. “Bpk. Budi & Keluarga”",
        "Nomor WhatsApp atau Instagram supaya bisa dikirimi undangan",
        "Tandai Rombongan bila penjaga perlu mengisi jumlah orang saat check-in",
      ],
      to: "/admin/tamu",
      cta: "Buka Tamu",
      done: (h?.guests.total ?? 0) > 0,
    },
    {
      id: "isi-undangan",
      phase: "Undangan",
      title: "Isi halaman undangan",
      why: "Ini yang dilihat tamu di /u/KODE: profil mempelai, cerita, galeri, amplop digital, FAQ, wishlist.",
      todo: [
        "Mempelai: foto dan nama (wajib), bagian lain boleh menyusul",
        "Cerita dan Galeri: foto beresolusi tinggi, tidak dikompres",
        "Amplop: rekening atau e-wallet untuk hadiah",
        "Susunan: urutan dan tampil/sembunyi tiap bagian",
      ],
      to: "/admin/undangan/mempelai",
      cta: "Isi undangan",
      done: h?.coupleFilled ?? false,
    },
    {
      id: "pratinjau",
      phase: "Undangan",
      title: "Atur pratinjau tautan",
      why: "Judul, deskripsi, dan gambar yang muncul saat link undangan dibagikan di WhatsApp atau Instagram.",
      todo: [
        "Judul dan deskripsi; pakai {panggilan} agar tiap tamu melihat namanya sendiri",
        "Gambar lanskap 1200 × 630 px",
        "Cek kartu pratinjau di halaman itu sebelum mengirim undangan pertama",
      ],
      to: "/admin/pengaturan/pratinjau",
      cta: "Atur pratinjau",
      optional: true,
      done: seo.data ? Boolean(seo.data.title || seo.data.image) : false,
    },
    {
      id: "kirim",
      phase: "Undangan",
      title: "Kirim undangan ke tamu",
      why: "Aplikasi menyiapkan pesan; Anda yang menekan kirim di WhatsApp atau Instagram.",
      todo: [
        "Di daftar tamu, buka menu … pada baris tamu lalu pilih Kirim",
        "Sunting pesan bila perlu, lalu Buka WhatsApp",
        "Status “Terkirim” tercatat otomatis",
      ],
      to: "/admin/tamu",
      cta: "Kirim dari daftar tamu",
      done: h ? h.guests.total > 0 && h.guests.neverSent < h.guests.total : false,
    },
    {
      id: "rsvp",
      phase: "Undangan",
      title: "Pantau RSVP",
      why: "Lihat siapa yang hadir dan berapa orang, dan ingatkan yang belum menjawab.",
      todo: ["Pastikan acara ditandai “RSVP”", "Gunakan Kirim pengingat untuk yang belum menjawab"],
      to: "/admin/rsvp",
      cta: "Buka RSVP",
      done: answered > 0,
    },
    {
      id: "perangkat",
      phase: "Hari-H",
      title: "Pasangkan perangkat penjaga",
      why: "Penjaga tidak perlu akun. Tiap HP dipasangkan dengan kode sekali pakai dan bisa dicabut.",
      todo: [
        "Tambah perangkat, lalu buka /scan di HP penjaga dan masukkan kodenya",
        "Lakukan saat internet masih menyala; setelah itu scanner tetap jalan tanpa internet",
        "Cek kesiapan di halaman Uji Kesiapan sebelum hari-H",
      ],
      to: "/admin/perangkat",
      cta: "Buka Perangkat",
      done: (devices.data?.length ?? 0) > 0,
    },
    {
      id: "checkin",
      phase: "Hari-H",
      title: "Check-in tamu di pintu",
      why: "Penjaga memindai QR tamu. Duplikat antar perangkat masuk antrean pemeriksaan admin.",
      todo: [
        "Pantau halaman Check-in saat acara",
        "Selesaikan duplikat di antrean “Perlu diperiksa”",
      ],
      to: "/admin/checkin",
      cta: "Buka Check-in",
      done: (h?.checkin?.arrived ?? 0) > 0,
    },
    {
      id: "hadiah",
      phase: "Setelah acara",
      title: "Catat hadiah dan balas terima kasih",
      why: "Amplop, transfer, dan barang dicatat supaya tidak ada yang terlewat saat berterima kasih.",
      todo: [
        "Catat tiap hadiah beserta pengirimnya",
        "Kirim ucapan terima kasih lewat WhatsApp dari halaman Hadiah",
      ],
      to: "/admin/hadiah",
      cta: "Buka Hadiah",
      done: (h?.gifts.count ?? 0) > 0,
    },
  ];

  const required = steps.filter((step) => !step.optional);
  return {
    ready,
    steps,
    doneCount: required.filter((step) => step.done).length,
    total: required.length,
    next: steps.find((step) => !step.done && !step.optional),
  };
}
