"use client";

import { useState } from "react";
import { ImagePlus, Inbox, Loader2, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/presentation/components/ui/alert-dialog";
import {
  useGalleryItems,
  useCreateGalleryItem,
  useUpdateGalleryItem,
  useDeleteGalleryItem,
} from "@/src/application/hooks/use-wedding-query";
import type { GalleryItemResponse } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";
import { MediaInput } from "./media-input";

interface GalleryFormState {
  imageUrl: string | null;
  caption: string;
  orderIndex: number;
}

const EMPTY_FORM: GalleryFormState = {
  imageUrl: null,
  caption: "",
  orderIndex: 0,
};

export function GalleryTab() {
  const { data, isLoading } = useGalleryItems();
  const createGalleryItem = useCreateGalleryItem();
  const updateGalleryItem = useUpdateGalleryItem();
  const deleteGalleryItem = useDeleteGalleryItem();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GalleryFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItemResponse | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (item: GalleryItemResponse) => {
    setEditingId(item.id);
    setForm({
      imageUrl: item.image_url,
      caption: item.caption ?? "",
      orderIndex: item.order_index,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.imageUrl) {
      toast.error("Foto wajib diisi");
      return;
    }
    const payload = {
      image_url: form.imageUrl,
      caption: form.caption.trim() || null,
      order_index: Number.isNaN(form.orderIndex) ? 0 : form.orderIndex,
    };

    if (editingId) {
      updateGalleryItem.mutate(
        { id: editingId, req: payload },
        {
          onSuccess: () => {
            toast.success("Foto tersimpan");
            setSheetOpen(false);
          },
          onError: () => toast.error("Gagal menyimpan foto"),
        }
      );
    } else {
      createGalleryItem.mutate(payload, {
        onSuccess: () => {
          toast.success("Foto ditambahkan");
          setSheetOpen(false);
        },
        onError: () => toast.error("Gagal menambah foto"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteGalleryItem.mutate(deleteTarget.id, {
      onSuccess: () => toast.success("Foto dihapus"),
      onError: () => toast.error("Gagal menghapus foto"),
      onSettled: () => setDeleteTarget(null),
    });
  };

  if (isLoading) return <TabLoading />;

  const items = [...(data ?? [])].sort((a, b) =>
    a.order_index === b.order_index
      ? a.created_at.localeCompare(b.created_at)
      : a.order_index - b.order_index
  );
  const isPending = createGalleryItem.isPending || updateGalleryItem.isPending;

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-16 w-16 opacity-20" />
          <p className="text-[13px] text-muted-foreground">
            Belum ada foto. Tambahkan foto prewedding pertama.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => openEdit(item)}
                aria-label={`Edit foto ${item.caption ?? ""}`}
                className="block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted/20 transition-all active:scale-95"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.caption ?? "Foto galeri"}
                  className="h-full w-full object-cover"
                />
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-left text-[10px] font-medium text-white">
                    {item.caption}
                  </span>
                )}
              </button>
              <button
                onClick={() => setDeleteTarget(item)}
                aria-label="Hapus foto"
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-destructive active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label="Tambah foto"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all active:scale-95"
      >
        <ImagePlus className="h-6 w-6" />
      </button>

      {/* Bottom sheet create/edit */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSheetOpen(false)}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[15px] font-bold w-full text-center">
                {editingId ? "Edit Foto" : "Tambah Foto"}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
              <MediaInput
                label="Foto"
                value={form.imageUrl}
                onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
                accept="image/*"
                folder="wedding"
                preview="image"
              />
              <div className="space-y-1.5">
                <Label htmlFor="gallery-caption" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Caption</Label>
                <Input
                  id="gallery-caption"
                  value={form.caption}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  placeholder="Cth: Prewedding di pantai"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gallery-order" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Urutan</Label>
                <Input
                  id="gallery-order"
                  type="number"
                  value={form.orderIndex}
                  onChange={(e) => setForm((f) => ({ ...f, orderIndex: parseInt(e.target.value, 10) }))}
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
            </div>

            <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5 border-t border-border/40">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-[2rem] p-6">
          <AlertDialogHeader className="items-center space-y-2 text-center sm:text-center">
            <AlertDialogTitle className="text-base">Hapus foto?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              Foto{deleteTarget?.caption ? ` &quot;${deleteTarget.caption}&quot;` : ""} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteGalleryItem.isPending}
              className="w-full bg-destructive text-white hover:bg-destructive/90 active:scale-95 transition-all"
            >
              Hapus
            </AlertDialogAction>
            <AlertDialogCancel className="w-full active:scale-95 transition-all">Batal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
