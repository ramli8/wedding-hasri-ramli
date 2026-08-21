"use client";

import Link from "next/link";
import {
  BookHeart,
  BookOpenText,
  CalendarDays,
  Camera,
  ChevronLeft,
  Gift,
  HeartHandshake,
  HelpCircle,
  Images,
  Layers,
  ListChecks,
  MonitorPlay,
  Music,
  Palette,
  UserRound,
} from "lucide-react";

const SECTION_GROUPS = [
  {
    label: "Konten & Tema",
    items: [
      { href: "identitas", icon: UserRound, title: "Identitas", subtitle: "Tanggal & alamat kado" },
      { href: "cover", icon: Images, title: "Cover", subtitle: "Foto pembuka & tombol" },
      { href: "musik", icon: Music, title: "Musik", subtitle: "Musik latar" },
      { href: "pembuka", icon: BookOpenText, title: "Pembuka", subtitle: "Ayat suci & salam" },
      { href: "dress-code", icon: Palette, title: "Dress Code", subtitle: "Palet warna & moodboard" },
      { href: "live-footer", icon: MonitorPlay, title: "Live & Penutup", subtitle: "Streaming & ucapan" },
    ],
  },
  {
    label: "Acara & Mempelai",
    items: [
      { href: "mempelai", icon: HeartHandshake, title: "Mempelai", subtitle: "Profil pria & wanita" },
      { href: "acara", icon: CalendarDays, title: "Acara", subtitle: "Akad & resepsi" },
      { href: "kisah", icon: BookHeart, title: "Kisah", subtitle: "Timeline cinta" },
      { href: "galeri", icon: Camera, title: "Galeri", subtitle: "Foto prewedding" },
    ],
  },
  {
    label: "Interaksi Tamu",
    items: [
      { href: "hadiah", icon: Gift, title: "Hadiah", subtitle: "Bank & e-wallet" },
      { href: "wishlist", icon: ListChecks, title: "Wishlist", subtitle: "Kado & klaim tamu" },
      { href: "faq", icon: HelpCircle, title: "FAQ", subtitle: "Pertanyaan umum" },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "section", icon: Layers, title: "Section", subtitle: "Tampil & urutan section" },
    ],
  },
];

export default function UndanganAdminPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between mb-8 transition-all">
        <Link
          href="/admin"
          aria-label="Kembali ke menu admin"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[18px] font-extrabold tracking-tight absolute left-1/2 -translate-x-1/2 text-foreground">
          Undangan
        </h1>
        <div className="w-10 shrink-0" /> {/* Spacer untuk menyeimbangkan ChevronLeft */}
      </div>

      <main className="mx-auto max-w-2xl px-5 space-y-6">
        {SECTION_GROUPS.map((group) => (
          <section key={group.label}>
            <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground pl-1 mb-3">
              {group.label}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.items.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.href}
                    href={`/admin/undangan/${section.href}`}
                    className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-muted/40 active:scale-95"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[13px] font-bold leading-tight">{section.title}</span>
                    <span className="text-[11px] leading-tight text-muted-foreground">
                      {section.subtitle}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
