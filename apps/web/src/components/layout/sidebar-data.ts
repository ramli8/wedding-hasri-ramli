import {
  BookHeart,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Camera,
  Gift,
  HandCoins,
  Home,
  ListChecks,
  type LucideIcon,
  MessageSquareHeart,
  Package,
  PartyPopper,
  ScanLine,
  Settings,
  Smartphone,
  Store,
  Tags,
  Users,
} from "lucide-react";

export type NavLink = {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: string;
  items?: undefined;
};
export type NavCollapsible = {
  title: string;
  icon?: LucideIcon;
  badge?: string;
  url?: undefined;
  items: { title: string; url: string; icon?: LucideIcon; badge?: string }[];
};
export type NavItem = NavLink | NavCollapsible;
export type NavGroup = { title: string; items: NavItem[] };

/**
 * Menu admin, diurutkan mengikuti alur kerja: data tamu (Acara → Kelompok → Tamu, lalu RSVP dan
 * Ucapan), isi undangan, alat hari-H (semua yang memakai perangkat terpasang), keuangan, lainnya.
 * Grup tanpa judul tampil paling atas tanpa label.
 */
export const navGroups: NavGroup[] = [
  {
    title: "",
    items: [{ title: "Beranda", url: "/admin", icon: Home }],
  },
  {
    title: "Persiapan",
    items: [
      { title: "Rundown", url: "/admin/rundown", icon: CalendarClock },
      { title: "Tugas panitia", url: "/admin/panitia", icon: ListChecks },
      { title: "Seserahan", url: "/admin/seserahan", icon: Package },
    ],
  },
  {
    title: "Tamu",
    items: [
      { title: "Acara", url: "/admin/acara", icon: CalendarDays },
      { title: "Kelompok", url: "/admin/kelompok", icon: Tags },
      { title: "Tamu", url: "/admin/tamu", icon: Users },
      { title: "RSVP", url: "/admin/rsvp", icon: CalendarCheck },
      { title: "Ucapan", url: "/admin/undangan/ucapan", icon: MessageSquareHeart },
    ],
  },
  {
    title: "Undangan",
    items: [
      {
        title: "Isi undangan",
        icon: BookHeart,
        items: [
          { title: "Mempelai", url: "/admin/undangan/mempelai" },
          { title: "Cerita", url: "/admin/undangan/cerita" },
          { title: "Galeri", url: "/admin/undangan/galeri" },
          { title: "Amplop", url: "/admin/undangan/amplop" },
          { title: "FAQ", url: "/admin/undangan/faq" },
          { title: "Wishlist", url: "/admin/undangan/wishlist" },
          { title: "Susunan", url: "/admin/undangan/susunan" },
        ],
      },
    ],
  },
  {
    title: "Hari-H",
    items: [
      { title: "Check-in", url: "/admin/checkin", icon: ScanLine },
      { title: "Buwuh", url: "/admin/buwuh", icon: HandCoins },
      { title: "Doorprize", url: "/admin/doorprize", icon: PartyPopper },
      {
        title: "Photobooth",
        icon: Camera,
        items: [
          { title: "Foto", url: "/admin/photobooth/foto" },
          { title: "Bingkai", url: "/admin/photobooth" },
        ],
      },
      { title: "Perangkat", url: "/admin/perangkat", icon: Smartphone },
    ],
  },
  {
    title: "Keuangan",
    items: [
      { title: "Hadiah", url: "/admin/hadiah", icon: Gift },
      { title: "Vendor", url: "/admin/vendor", icon: Store },
    ],
  },
  {
    title: "Lainnya",
    items: [
      {
        title: "Pengaturan",
        icon: Settings,
        items: [
          { title: "Situs", url: "/admin/pengaturan" },
          { title: "Pesan WhatsApp", url: "/admin/pengaturan/pesan" },
          { title: "Akun", url: "/admin/pengaturan/akun" },
          { title: "Cadangan", url: "/admin/pengaturan/cadangan" },
        ],
      },
      { title: "Panduan", url: "/admin/panduan", icon: BookOpen },
    ],
  },
];
