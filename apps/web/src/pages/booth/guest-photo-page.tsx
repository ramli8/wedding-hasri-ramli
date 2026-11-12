import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Download, RefreshCw, Share2 } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../../lib/api.js";
import { publicApi } from "../../lib/public-api.js";

/** Selama foto belum terunggah dari laptop booth, halaman memeriksa ulang sendiri sesering ini. */
const RETRY_MS = 15_000;

const route = getRouteApi("/foto/$id");

/** 404 = belum terunggah (laptop booth offline); halaman menunggu. 410 = dihapus, tidak menunggu. */
const notYet = (err: unknown) => err instanceof ApiError && err.status === 404;

/**
 * Berkas JPEG foto untuk menu bagikan HP, atau null bila peramban tidak bisa membagikan berkas
 * (mis. laptop). Diambil di depan, bukan saat tombol ditekan: Safari iPhone menolak
 * `navigator.share` yang menunggu unduhan dulu (izin dari ketukan pengguna sudah kedaluwarsa).
 */
async function shareableFile(url: string, name: string): Promise<File | null> {
  if (typeof navigator.canShare !== "function") return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const file = new File([await res.blob()], name, { type: "image/jpeg" });
  return navigator.canShare({ files: [file] }) ? file : null;
}

/**
 * Halaman foto photobooth untuk tamu (`/foto/<id>`), dibuka dari QR unik di cetakan 4R. Hanya
 * menampilkan foto itu, dengan tombol Unduh. Bila laptop booth sedang offline, foto belum ada di
 * server: halaman menunggu dan memuat ulang sendiri. Gayanya ada di `booth.css` (`.guest-photo`).
 */
export function GuestPhotoPage() {
  const { id } = route.useParams();
  const photo = useQuery({
    queryKey: ["guest-photo", id],
    queryFn: () => publicApi.photo(id),
    retry: false,
    refetchInterval: (query) => (notYet(query.state.error) ? RETRY_MS : false),
  });
  const fileName = `hasri-ramli-photobooth-${id.slice(-6)}.jpg`;
  const jpegUrl = photo.data?.photo.media.jpeg;
  const share = useQuery({
    queryKey: ["guest-photo-file", jpegUrl],
    queryFn: () => shareableFile(jpegUrl ?? "", fileName),
    enabled: jpegUrl !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  /** Pesan di bawah tombol setelah Bagikan ditekan; null = petunjuk biasa. */
  const [notice, setNotice] = useState<string | null>(null);
  // Alamat halaman ini; pratinjaunya di WhatsApp memuat foto ini (rute /foto/:id di API).
  const pageUrl = `${window.location.origin}/foto/${id}`;

  /**
   * HP/tablet: menu bagikan dengan berkas fotonya. Peramban yang tidak bisa membagikan berkas
   * (kebanyakan laptop): menu bagikan dengan tautan halaman ini bila ada, selain itu tautannya
   * disalin.
   */
  const onShare = async () => {
    setNotice(null);
    const title = "Photobooth Hasri & Ramli";
    try {
      if (share.data) await navigator.share({ files: [share.data], title });
      else if (typeof navigator.share === "function")
        await navigator.share({ title, url: pageUrl });
      else {
        await navigator.clipboard.writeText(pageUrl);
        setNotice("Tautan foto disalin. Tempel di WhatsApp, Instagram, atau di mana saja.");
      }
    } catch (err) {
      // Tamu menutup menu bagikan: bukan galat.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setNotice("Gagal membagikan. Pakai Unduh foto, atau tekan lama fotonya lalu pilih Simpan.");
    }
  };

  return (
    <main className="guest-photo">
      <div className="guest-photo__inner">
        <header className="guest-photo__header">
          <p className="guest-photo__kicker">The Wedding of</p>
          <h1 className="guest-photo__names">Hasri &amp; Ramli</h1>
          <p className="guest-photo__text">Jumat, 21 Mei 2027 · Photobooth</p>
        </header>

        {photo.isPending && <p className="guest-photo__text">Memuat foto…</p>}

        {photo.isError && (
          <div className="guest-photo__notice">
            <p className="guest-photo__text">
              {notYet(photo.error)
                ? "Fotomu sedang dikirim dari photobooth. Halaman ini akan memuat ulang sendiri, atau coba lagi beberapa menit lagi."
                : photo.error.message}
            </p>
            {notYet(photo.error) && (
              <button
                type="button"
                onClick={() => void photo.refetch()}
                className="guest-photo__button guest-photo__button--outline"
              >
                <RefreshCw className="size-4" aria-hidden />
                Coba lagi
              </button>
            )}
          </div>
        )}

        {photo.data && (
          <>
            <img
              src={photo.data.photo.media.large}
              width={photo.data.photo.media.width}
              height={photo.data.photo.media.height}
              alt="Foto photobooth"
              className="guest-photo__image"
            />
            <div className="guest-photo__actions">
              <button
                type="button"
                onClick={() => void onShare()}
                // Menunggu berkas JPEG siap dibagikan (1-2 detik), lihat shareableFile.
                disabled={share.isPending}
                className="guest-photo__button"
              >
                <Share2 className="size-5" aria-hidden />
                Bagikan
              </button>
              <a
                href={photo.data.photo.media.jpeg}
                download={fileName}
                className="guest-photo__button guest-photo__button--outline"
              >
                <Download className="size-5" aria-hidden />
                Unduh foto
              </a>
            </div>
            {(notice || share.data) && (
              <p className="guest-photo__text guest-photo__hint" role="status">
                {notice ??
                  "Bagikan: kirim fotonya ke story Instagram, status WhatsApp, atau Simpan Gambar ke galeri. WhatsApp tidak terlihat? Ketuk More/Lainnya."}
              </p>
            )}
            <p className="guest-photo__text">
              Terima kasih sudah hadir dan berbagi bahagia bersama kami.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
