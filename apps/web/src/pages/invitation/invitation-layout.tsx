import { Outlet, useLocation } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SECTIONS: Record<string, { title: string; desc: string; shown: string; required?: string }> =
  {
    mempelai: {
      title: "Mempelai",
      desc: "Foto dan perkenalan singkat kedua mempelai.",
      shown: "Profil",
      required: "Nama lengkap tiap mempelai. Foto, orang tua, dan Instagram boleh menyusul.",
    },
    cerita: {
      title: "Cerita",
      desc: "Perjalanan kalian sebagai garis waktu. Tiap tahap punya judul, tahun, cerita singkat, dan foto.",
      shown: "Cerita kami",
      required: "Opsional. Mulai dari satu tahap, mis. “Pertama bertemu”.",
    },
    galeri: {
      title: "Galeri",
      desc: "Foto-foto yang tampil sebagai esai foto. Foto diunggah dalam resolusi aslinya, tidak dikompres.",
      shown: "Galeri foto",
      required:
        "Opsional. Unggah beberapa foto sekaligus; atur urutan dan keterangannya setelahnya.",
    },
    amplop: {
      title: "Amplop digital",
      desc: "Rekening bank atau e-wallet untuk tamu yang ingin memberi hadiah dari jauh.",
      shown: "Kupon hadiah",
      required: "Opsional. Nama bank/e-wallet, nomor, dan atas nama.",
    },
    faq: {
      title: "FAQ",
      desc: "Pertanyaan yang sering ditanyakan tamu: dress code, parkir, anak-anak, dan sejenisnya.",
      shown: "Tanya jawab",
      required: "Opsional. Tulis pertanyaan dan jawabannya.",
    },
    wishlist: {
      title: "Wishlist",
      desc: "Daftar barang yang diharapkan. Tamu bisa menandai barang yang akan mereka berikan.",
      shown: "Wishlist",
      required: "Opsional. Nama barang, harga acuan, dan tautan toko bila ada.",
    },
    susunan: {
      title: "Susunan",
      desc: "Sampul halaman undangan, tautan siaran langsung, serta urutan dan tampil/sembunyi tiap bagian.",
      shown: "Seluruh halaman",
      required:
        "Sapaan sampul dan foto sampul. Bagian yang belum diisi tidak tampil walau dicentang.",
    },
    ucapan: {
      title: "Ucapan",
      desc: "Ucapan dari tamu di buku tamu. Balas, sembunyikan, atau hapus yang tidak pantas.",
      shown: "Surat tamu",
    },
  };

/** Kerangka bagian "Isi undangan": judul tiap sub-halaman dan apa yang perlu diisi. */
export function InvitationLayout() {
  const { pathname } = useLocation();
  const key = pathname.split("/").filter(Boolean).pop() ?? "";
  const section = SECTIONS[key];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">Isi undangan</p>
        <h1 className="text-2xl font-bold tracking-tight">{section?.title ?? "Isi undangan"}</h1>
        <p className="text-muted-foreground">
          {section?.desc ?? "Yang Anda isi di sini tampil di halaman undangan tamu (/u/KODE)."}
        </p>
      </div>
      {section && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">
            <Eye aria-hidden />
            Tampil di: {section.shown}
          </Badge>
          {section.required && <span className="text-muted-foreground">{section.required}</span>}
        </div>
      )}
      <hr />
      <Outlet />
    </div>
  );
}
