import { useMutation, useQuery } from "@tanstack/react-query";
import { type GalleryItem, MAX_UPLOAD_MB } from "@wedding/shared";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpToLine,
  Images,
  Loader2,
  SquarePen,
  Trash2,
} from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { uploadSizeError } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { EmptyState, FormFooter, Tip, Toolbar } from "@/components/kit/invitation-kit";
import { toast } from "@/components/kit/toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi } from "../../lib/admin-api.js";
import { galleryQuery, useRefresh } from "../../lib/queries.js";

export function GalleryPage() {
  const refresh = useRefresh();
  const gallery = useQuery(galleryQuery);
  const picker = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState<{ name: string; reason: string }[]>([]);

  // Foto diunggah satu per satu (resolusi asli bisa besar), lalu langsung dipasang ke galeri.
  // Satu berkas gagal tidak menghentikan sisanya; yang gagal dilaporkan di akhir.
  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const failures: { name: string; reason: string }[] = [];
      let added = 0;
      setFailed([]);
      for (const [index, file] of files.entries()) {
        setProgress({ done: index, total: files.length });
        // Berkas di atas batas server dilewati tanpa diunggah (ukuran tidak diubah di peramban).
        if (uploadSizeError(file)) {
          failures.push({ name: file.name, reason: `lebih dari ${MAX_UPLOAD_MB} MB` });
          continue;
        }
        try {
          const { media } = await adminApi.media.upload(file);
          await adminApi.invitation.addGallery({ mediaId: media.id });
          added += 1;
          // Segarkan daftar tiap foto selesai, supaya foto muncul satu per satu.
          await refresh("invitation");
        } catch (error) {
          failures.push({
            name: file.name,
            reason: error instanceof Error ? error.message : "gagal diunggah",
          });
        }
      }
      setFailed(failures);
      return added;
    },
    meta: { toast: false },
    onSuccess: (added) => {
      if (added > 0) toast(`${added} foto ditambahkan`);
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
  /** Pindahkan langsung ke urutan pertama (tanpa menggeser satu per satu). */
  const moveFirst = (index: number) => {
    const ids = items.map((item) => item.id);
    const [id] = ids.splice(index, 1);
    if (id === undefined) return;
    reorder.mutate([id, ...ids]);
  };

  const uploadLabel = progress
    ? `Mengunggah ${progress.done + 1}/${progress.total}…`
    : "Tambah foto";

  return (
    <>
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
      <Toolbar
        summary={`${items.length} foto`}
        addLabel={uploadLabel}
        onAdd={() => picker.current?.click()}
        disabled={upload.isPending}
      />
      <Tip>
        <p>
          Unggah beberapa foto sekaligus; resolusi dan detailnya dipertahankan. Sisi panjang 2400 px
          atau lebih paling baik.
        </p>
        <p>
          Di kisi foto tampil persegi dan dipotong dari tengah, jadi letakkan objek utama di tengah.
          Saat dibuka layar penuh foto tampil utuh.
        </p>
      </Tip>

      {gallery.isError && <Alert tone="error">{gallery.error.message}</Alert>}
      {upload.error && <Alert tone="error">{upload.error.message}</Alert>}
      {failed.length > 0 && (
        <Alert tone="error">
          <p>
            {failed.length} foto gagal ditambahkan; foto lain tetap tersimpan. Coba pilih ulang foto
            berikut:
          </p>
          <ul className="mt-1 list-disc ps-5">
            {failed.map((file, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: nama berkas boleh kembar
              <li key={index} className="break-all">
                {file.name}: {file.reason}
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}

      {gallery.data && items.length === 0 && !upload.isPending ? (
        <EmptyState
          icon={Images}
          title="Galeri masih kosong"
          description="Pilih foto-foto terbaik kalian. Urutannya bisa diatur setelah diunggah."
          addLabel="Tambah foto"
          onAdd={() => picker.current?.click()}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.id}>
              <Card className="h-full gap-0 overflow-hidden p-0">
                <div className="relative">
                  <img
                    src={item.photo.thumb}
                    alt={item.caption ?? ""}
                    width={item.photo.width}
                    height={item.photo.height}
                    className="aspect-square w-full object-cover"
                  />
                  <Badge variant="secondary" className="absolute top-2 left-2 bg-background/90">
                    {index + 1}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <button
                    type="button"
                    className="-mx-1 min-h-11 truncate rounded px-1 text-start text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-5"
                    aria-label={`Ubah keterangan foto ${index + 1}`}
                    onClick={() => setEditing(item)}
                  >
                    {item.caption ?? "Tanpa keterangan"}
                  </button>
                  <div className="mt-auto flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label="Geser ke kiri"
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || reorder.isPending}
                    >
                      <ArrowLeft aria-hidden />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label="Geser ke kanan"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1 || reorder.isPending}
                    >
                      <ArrowRight aria-hidden />
                    </Button>
                    <div className="ms-auto">
                      <DataTableRowActions
                        actions={[
                          {
                            label: "Ubah keterangan",
                            icon: <SquarePen />,
                            onSelect: () => setEditing(item),
                          },
                          {
                            label: "Jadikan pertama",
                            icon: <ArrowUpToLine />,
                            disabled: index === 0 || reorder.isPending,
                            onSelect: () => moveFirst(index),
                          },
                          "separator",
                          {
                            label: "Hapus",
                            icon: <Trash2 />,
                            destructive: true,
                            onSelect: () => setDeleting(item),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
          {progress && (
            <li>
              <Card className="grid aspect-square h-full place-items-center gap-2 p-4 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-6 animate-spin" aria-hidden />
                  Mengunggah {progress.done + 1}/{progress.total}…
                </div>
              </Card>
            </li>
          )}
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
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: GalleryItem | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.invitation.removeGallery(id),
    meta: { toast: "Terhapus" },
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
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
