import {
  BookHeart,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Gift,
  Home,
  type LucideIcon,
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

/** Menu admin dikelompokkan seperti sidebarData shadcn-admin (Umum, Halaman, Lainnya). */
export const navGroups: NavGroup[] = [
  {
    title: "Umum",
    items: [
      { title: "Beranda", url: "/admin", icon: Home },
      { title: "Panduan", url: "/admin/panduan", icon: BookOpen },
      { title: "Tamu", url: "/admin/tamu", icon: Users },
      { title: "Kelompok", url: "/admin/kelompok", icon: Tags },
      { title: "Acara", url: "/admin/acara", icon: CalendarDays },
      { title: "RSVP", url: "/admin/rsvp", icon: CalendarCheck },
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
          { title: "Ucapan", url: "/admin/undangan/ucapan" },
        ],
      },
    ],
  },
  {
    title: "Hari-H",
    items: [
      { title: "Check-in", url: "/admin/checkin", icon: ScanLine },
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
          { title: "Pernikahan", url: "/admin/pengaturan" },
          { title: "Pratinjau tautan", url: "/admin/pengaturan/pratinjau" },
          { title: "Kata sandi", url: "/admin/pengaturan/sandi" },
          { title: "Cadangan", url: "/admin/pengaturan/cadangan" },
          { title: "Tampilan", url: "/admin/pengaturan/tampilan" },
        ],
      },
    ],
  },
];
