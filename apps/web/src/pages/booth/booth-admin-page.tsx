import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BOOTH_FRAME_LABELS,
  BOOTH_FRAMES,
  type BoothFrame,
  type BoothPhoto,
} from "@wedding/shared";
import { Camera, Download, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Pagination } from "@/components/kit/pagination";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { adminApi, downloads } from "../../lib/admin-api.js";
import { drawFrame, FRAME_SPECS, loadFrameFonts } from "../../lib/booth/frames.js";
import { formatDateTime } from "../../lib/datetime.js";
import { boothConfigQuery, boothPhotosQuery, useRefresh } from "../../lib/queries.js";

const PAGE_SIZE = 24;

export function BoothAdminPage() {
  return (
    <>
      <PageHeader
        title="Photobooth"
        description="Pilih bingkai yang boleh dipakai tamu, lalu lihat foto yang masuk dari booth."
      />
      <FramesCard />
      <SetupCard />
      <PhotosCard />
    </>
  );
}

function FramesCard() {
  const refresh = useRefresh();
  const config = useQuery(boothConfigQuery);
  const save = useMutation({
    mutationFn: (frames: BoothFrame[]) => adminApi.booth.saveConfig({ frames }),
    onSuccess: () => refresh("booth"),
  });
  const active = config.data?.config.frames ?? [];

  function toggle(frame: BoothFrame, on: boolean) {
    const next = on ? [...active, frame] : active.filter((f) => f !== frame);
    if (next.length > 0) save.mutate(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bingkai aktif</CardTitle>
        <CardDescription>
          Hasil cetak 4R mendatar (152×102 mm). Bila lebih dari satu bingkai aktif, tamu memilih
          sendiri di layar booth. Booth mengambil pilihan ini saat tersambung internet.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {config.isError && <Alert tone="error">{config.error.message}</Alert>}
        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        <ul className="grid gap-4 md:grid-cols-3">
          {BOOTH_FRAMES.map((frame) => {
            const on = active.includes(frame);
            const id = `booth-frame-${frame}`;
            return (
              <li key={frame} className="flex flex-col gap-3 rounded-lg border p-3">
                <FramePreview frame={frame} />
                <div className="flex min-h-11 items-center justify-between gap-3">
                  <label htmlFor={id} className="font-medium">
                    {BOOTH_FRAME_LABELS[frame]}
                  </label>
                  <Switch
                    id={id}
                    checked={on}
                    // Minimal satu bingkai harus aktif.
                    disabled={!config.data || save.isPending || (on && active.length === 1)}
                    onCheckedChange={(checked) => toggle(frame, checked)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Pratinjau bingkai dengan kotak abu-abu di jendela foto. */
function FramePreview({ frame }: { frame: BoothFrame }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    void loadFrameFonts().then(() => {
      const ctx = ref.current?.getContext("2d");
      if (cancelled || !ctx) return;
      drawFrame(ctx, frame, "0127");
      const { x, y, w, h } = FRAME_SPECS[frame].window;
      ctx.fillStyle = "#6b5e50";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#e8e0d4";
      ctx.font = '400 40px "Courier Prime", monospace';
      ctx.textAlign = "center";
      ctx.fillText("FOTO TAMU", x + w / 2, y + h / 2 + 14);
    });
    return () => {
      cancelled = true;
    };
  }, [frame]);
  return (
    <canvas
      ref={ref}
      width={1800}
      height={1200}
      className="aspect-[3/2] w-full rounded border"
      role="img"
      aria-label={`Pratinjau bingkai ${BOOTH_FRAME_LABELS[frame]}`}
    />
  );
}

function SetupCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Memasang booth</CardTitle>
        <CardDescription>Cukup sekali, saat laptop booth tersambung internet.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid list-decimal gap-2 ps-5 text-sm">
          <li>
            Di menu{" "}
            <Link to="/admin/perangkat" className="underline">
              Perangkat
            </Link>
            , tambah perangkat bernama mis. “Laptop Booth”.
          </li>
          <li>
            Di laptop booth, buka <code>/booth/pasang</code> lalu ketik kode pairing-nya. Kode yang
            dipakai di halaman ini menjadikan perangkat itu booth: ia tidak bisa membuka data tamu,
            dan HP scanner tidak bisa dipakai sebagai booth.
          </li>
          <li>
            Sambungkan kamera (mode USB WEBCAM) dan printer, lalu jalankan Chrome mode kiosk.
            Langkah lengkapnya ada di <code>docs/photobooth.md</code>.
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}

function PhotosCard() {
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<BoothPhoto | null>(null);
  const list = useQuery(boothPhotosQuery(page));
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto masuk ({total})</CardTitle>
        <CardDescription>
          Foto diunggah booth begitu ada internet. Foto yang belum terunggah tetap aman di laptop
          booth.
        </CardDescription>
        {total > 0 && (
          <CardAction>
            <Button variant="outline" asChild>
              <a href={downloads.boothPhotosZip}>
                <Download aria-hidden /> Unduh semua (ZIP)
              </a>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {list.isError && <Alert tone="error">{list.error.message}</Alert>}
        {list.data && list.data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted">
              <Camera className="size-6" aria-hidden />
            </span>
            <p className="font-semibold">Belum ada foto</p>
            <p className="text-sm text-muted-foreground">
              Foto muncul di sini setelah tamu berfoto di booth.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.data?.items.map((photo) => (
              <li key={photo.id} className="flex flex-col gap-2 rounded-lg border p-2">
                <a href={photo.media.large} target="_blank" rel="noreferrer">
                  <img
                    src={photo.media.thumb}
                    alt={`Foto booth ${formatDateTime(photo.takenAt)}`}
                    loading="lazy"
                    className="aspect-[3/2] w-full rounded object-cover"
                  />
                </a>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(photo.takenAt)} · {BOOTH_FRAME_LABELS[photo.frame]}
                  {photo.deviceName ? ` · ${photo.deviceName}` : ""}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={photo.media.large} download={`photobooth-${photo.id}.webp`}>
                      <Download aria-hidden /> Unduh
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Hapus foto"
                    onClick={() => setDeleting(photo)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onPage={setPage} />}
      </CardContent>
      <DeleteDialog photo={deleting} onClose={() => setDeleting(null)} />
    </Card>
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
            className="aspect-[3/2] w-full rounded object-cover"
          />
          <p>
            Foto dihapus permanen dari server. Salinan di laptop booth tidak ikut terhapus, tetapi
            tidak akan diunggah ulang.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
          </div>
        </>
      )}
    </Dialog>
  );
}
