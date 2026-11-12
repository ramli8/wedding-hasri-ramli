import { useMutation, useQuery } from "@tanstack/react-query";
import { BOOTH_FRAME_LABELS, type BoothPhoto } from "@wedding/shared";
import { Camera, Copy, Download, ExternalLink, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Pagination } from "@/components/kit/pagination";
import { toast } from "@/components/kit/toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { adminApi, downloads } from "../../lib/admin-api.js";
import { formatDateTime } from "../../lib/datetime.js";
import { boothPhotosQuery, settingsQuery, useRefresh } from "../../lib/queries.js";
import { formatAgo } from "../../lib/scan/format.js";

const PAGE_SIZE = 24;

/**
 * Alamat halaman foto tamu, sama dengan isi QR di cetakan: alamat situs dari Pengaturan →
 * Pernikahan (seperti `photoLink` di booth), atau alamat admin ini bila belum diisi.
 */
const guestPageUrl = (id: string, base: string | null | undefined) =>
  `${(base || window.location.origin).replace(/\/+$/, "")}/foto/${id}`;

/**
 * Galeri foto photobooth (Photobooth → Foto). Foto masuk otomatis dari laptop booth (diperbarui
 * tiap 30 detik). Klik foto untuk melihatnya besar, mengunduh, membuka halaman tamunya, atau
 * menghapusnya.
 */
export function BoothPhotosPage() {
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<BoothPhoto | null>(null);
  const [deleting, setDeleting] = useState<BoothPhoto | null>(null);
  const list = useQuery(boothPhotosQuery(page));
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const latest = page === 1 ? list.data?.items[0] : undefined;

  // Menghapus foto terakhir di halaman terakhir: pindah ke halaman yang masih ada isinya.
  useEffect(() => {
    if (list.data && page > pageCount) setPage(pageCount);
  }, [list.data, page, pageCount]);

  return (
    <>
      <PageHeader
        title="Foto photobooth"
        description="Foto masuk otomatis dari laptop booth begitu ada internet. Klik foto untuk melihat, mengunduh, atau membuka halaman tamunya."
        actions={
          total > 0 ? (
            <Button variant="outline" asChild>
              <a href={downloads.boothPhotosZip}>
                Unduh semua (ZIP)
                <Download aria-hidden />
              </a>
            </Button>
          ) : undefined
        }
      />

      {list.isError && <Alert tone="error">{list.error.message}</Alert>}

      {list.data && total > 0 && (
        <p className="text-sm text-muted-foreground">
          {total} foto
          {latest && ` · terakhir masuk ${formatAgo(Date.parse(latest.takenAt))}`}
        </p>
      )}

      {list.isPending ? (
        <p className="text-muted-foreground">Memuat…</p>
      ) : list.data && total === 0 ? (
        <Card className="items-center px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted">
            <Camera className="size-6" aria-hidden />
          </span>
          <div className="max-w-sm space-y-1">
            <p className="font-semibold">Belum ada foto</p>
            <p className="text-sm text-muted-foreground">
              Foto muncul di sini setelah tamu berfoto di booth dan laptop booth tersambung
              internet.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {list.data?.items.map((photo) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setViewing(photo)}
                className="group grid w-full gap-2 rounded-xl text-start focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="block overflow-hidden rounded-xl border bg-muted shadow-xs">
                  <img
                    src={photo.media.thumb}
                    alt={`Foto booth ${formatDateTime(photo.takenAt)}`}
                    loading="lazy"
                    className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </span>
                <span className="grid gap-0.5 px-0.5">
                  <span className="text-sm font-medium">{formatDateTime(photo.takenAt)}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {BOOTH_FRAME_LABELS[photo.frame]}
                    {photo.deviceName ? ` · ${photo.deviceName}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onPage={setPage} />}

      <ViewDialog
        photo={viewing}
        onClose={() => setViewing(null)}
        onDelete={(photo) => {
          setViewing(null);
          setDeleting(photo);
        }}
      />
      <DeleteDialog photo={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast("Tautan disalin");
  } catch {
    toast("Gagal menyalin tautan; salin manual saja", "error");
  }
}

function ViewDialog({
  photo,
  onClose,
  onDelete,
}: {
  photo: BoothPhoto | null;
  onClose: () => void;
  onDelete: (photo: BoothPhoto) => void;
}) {
  const settings = useQuery(settingsQuery);
  return (
    <Dialog
      open={photo !== null}
      onClose={onClose}
      wide
      title={photo ? formatDateTime(photo.takenAt) : ""}
      description="Foto yang sama dengan yang dibuka tamu lewat QR di cetakannya."
    >
      {photo && (
        <>
          <img
            src={photo.media.large}
            width={photo.media.width}
            height={photo.media.height}
            alt={`Foto booth ${formatDateTime(photo.takenAt)}`}
            className="mx-auto h-auto max-h-[60vh] w-auto max-w-full rounded-lg border object-contain"
          />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{BOOTH_FRAME_LABELS[photo.frame]}</Badge>
            {photo.deviceName && (
              <Badge variant="outline">
                <Smartphone aria-hidden />
                {photo.deviceName}
              </Badge>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="outline" asChild>
              <a href={photo.media.jpeg} download={`photobooth-${photo.id}.jpg`}>
                <Download aria-hidden />
                Unduh
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={guestPageUrl(photo.id, settings.data?.publicBaseUrl)}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink aria-hidden />
                Halaman tamu
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => void copyLink(guestPageUrl(photo.id, settings.data?.publicBaseUrl))}
            >
              <Copy aria-hidden />
              Salin tautan
            </Button>
          </div>
          <DialogActions>
            <Button variant="outline" className="text-destructive" onClick={() => onDelete(photo)}>
              <Trash2 aria-hidden />
              Hapus
            </Button>
            <Button onClick={onClose}>Tutup</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function DeleteDialog({ photo, onClose }: { photo: BoothPhoto | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.booth.remove(id),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("booth");
      onClose();
    },
  });
  return (
    <Dialog open={photo !== null} onClose={onClose} title="Hapus foto booth ini?">
      {photo && (
        <>
          <img
            src={photo.media.thumb}
            alt=""
            className="aspect-[3/2] w-full rounded-lg border object-cover"
          />
          <p>
            Foto dihapus permanen dari server, dan QR di cetakannya tidak bisa dibuka lagi. Salinan
            di laptop booth tidak ikut terhapus, tetapi tidak akan diunggah ulang.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(photo.id)}
              disabled={remove.isPending}
            >
              Hapus foto
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
