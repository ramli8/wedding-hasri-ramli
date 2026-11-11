import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Download, RefreshCw } from "lucide-react";
import { ApiError } from "../../lib/api.js";
import { publicApi } from "../../lib/public-api.js";

/** Selama foto belum terunggah dari laptop booth, halaman memeriksa ulang sendiri sesering ini. */
const RETRY_MS = 15_000;

const route = getRouteApi("/foto/$id");

/** 404 = belum terunggah (laptop booth offline); halaman menunggu. 410 = dihapus, tidak menunggu. */
const notYet = (err: unknown) => err instanceof ApiError && err.status === 404;

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
            <a
              href={photo.data.photo.media.large}
              download={`hasri-ramli-photobooth-${id.slice(-6)}.webp`}
              className="guest-photo__button"
            >
              <Download className="size-5" aria-hidden />
              Unduh foto
            </a>
            <p className="guest-photo__text">
              Terima kasih sudah hadir dan berbagi bahagia bersama kami.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
