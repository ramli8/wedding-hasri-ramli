import { useMutation, useQuery } from "@tanstack/react-query";
import type { GalleryItem } from "@wedding/shared";
import { ArrowLeft, ArrowRight, ImagePlus } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Dialog } from "../../components/ui/dialog.js";
import { Field } from "../../components/ui/field.js";
import { Input } from "../../components/ui/input.js";
import { adminApi } from "../../lib/admin-api.js";
import { galleryQuery, useRefresh } from "../../lib/queries.js";

export function GalleryPage() {
  const refresh = useRefresh();
  const gallery = useQuery(galleryQuery);
  const picker = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Foto diunggah satu per satu (resolusi asli bisa besar), lalu langsung dipasang ke galeri.
  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      let done = 0;
      setProgress({ done, total: files.length });
      for (const file of files) {
        const { media } = await adminApi.media.upload(file);
        await adminApi.invitation.addGallery({ mediaId: media.id });
        done += 1;
        setProgress({ done, total: files.length });
      }
    },
    onSettled: async () => {
      setProgress(null);
      await refresh("invitation");
    },
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminApi.invitation.reorderGallery(ids),
    onSuccess: () => refresh("invitation"),
  });

  const items = gallery.data ?? [];
  const move = (index: number, delta: -1 | 1) => {
    const ids = items.map((item) => item.id);
    const target = index + delta;
    const a = ids[index];
    const b = ids[target];
    if (a === undefined || b === undefined) return;
    ids[index] = b;
    ids[target] = a;
    reorder.mutate(ids);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-ink-soft">
          Foto-foto yang tampil sebagai galeri di undangan, urut dari kiri ke kanan. Pilih beberapa
          foto sekaligus untuk mengunggah. Resolusi dan detail foto dipertahankan.
        </p>
        <input
          ref={picker}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Pilih foto galeri"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length > 0) upload.mutate(files);
          }}
        />
        <Button onClick={() => picker.current?.click()} disabled={upload.isPending}>
          <ImagePlus className="size-4" aria-hidden />
          {progress ? `Mengunggah ${progress.done + 1}/${progress.total}…` : "Tambah foto"}
        </Button>
      </div>
      <p className="max-w-prose text-sm font-semibold">
        Disarankan: sisi panjang 2400 px atau lebih (mis. 2400 × 1600 lanskap atau 1600 × 2400
        potret), rasio bebas. Di kisi, foto tampil sebagai kotak persegi dan dipotong dari tengah,
        jadi letakkan objek utama di tengah; saat dibuka layar penuh foto tampil utuh. Foto persegi
        1:1 tidak dipotong sama sekali.
      </p>

      {gallery.isError && <Alert tone="error">{gallery.error.message}</Alert>}
      {upload.error && (
        <Alert tone="error">
          {upload.error.message} Foto sebelumnya yang sudah terunggah tetap tersimpan.
        </Alert>
      )}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}

      {gallery.data && items.length === 0 ? (
        <Card className="text-center text-ink-soft">
          Belum ada foto. Klik "Tambah foto" dan pilih foto-foto terbaik Anda.
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.id}>
              <Card className="flex h-full flex-col gap-2 p-2">
                <img
                  src={item.photo.thumb}
                  alt={item.caption ?? ""}
                  width={item.photo.width}
                  height={item.photo.height}
                  className="aspect-square w-full border-2 border-ink object-cover"
                />
                <p className="min-h-5 truncate px-1 text-sm text-ink-soft">
                  {item.caption ?? "Tanpa keterangan"}
                </p>
                <div className="mt-auto flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label="Geser ke kiri"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorder.isPending}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label="Geser ke kanan"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1 || reorder.isPending}
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(item)}>
                    Ket.
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(item)}>
                    Hapus
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Keterangan foto">
        {editing && <CaptionForm item={editing} onDone={() => setEditing(null)} />}
      </Dialog>
      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function CaptionForm({ item, onDone }: { item: GalleryItem; onDone: () => void }) {
  const refresh = useRefresh();
  const [caption, setCaption] = useState(item.caption ?? "");
  const save = useMutation({
    mutationFn: () => adminApi.invitation.captionGallery(item.id, { caption }),
    onSuccess: async () => {
      await refresh("invitation");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Keterangan" hint="Opsional, maksimal 160 karakter.">
        {(id) => (
          <Input
            id={id}
            maxLength={160}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: GalleryItem | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.invitation.removeGallery(id),
    onSuccess: async () => {
      await refresh("invitation");
      onClose();
    },
  });

  return (
    <Dialog open={item !== null} onClose={onClose} title="Hapus foto ini?">
      {item && (
        <>
          <p>Foto dihapus dari galeri dan dari server.</p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(item.id)}
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
