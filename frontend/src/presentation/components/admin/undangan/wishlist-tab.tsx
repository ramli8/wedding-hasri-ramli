"use client";

import { useState } from "react";
import { ExternalLink, Gift, Inbox, Loader2, PackageCheck, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/src/presentation/components/ui/badge";
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
  useWishlistItems,
  useCreateWishlistItem,
  useUpdateWishlistItem,
  useDeleteWishlistItem,
} from "@/src/application/hooks/use-wedding-query";
import type { WishlistItemResponse } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";
import { MediaInput } from "./media-input";

interface WishlistFormState {
  itemName: string;
  itemImageUrl: string | null;
  itemLink: string;
}

const EMPTY_FORM: WishlistFormState = {
  itemName: "",
  itemImageUrl: null,
  itemLink: "",
};

export function WishlistTab() {
  const { data, isLoading } = useWishlistItems();
  const createWishlistItem = useCreateWishlistItem();
  const updateWishlistItem = useUpdateWishlistItem();
  const deleteWishlistItem = useDeleteWishlistItem();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WishlistFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<WishlistItemResponse | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (item: WishlistItemResponse) => {
    setEditingId(item.id);
    setForm({
      itemName: item.item_name,
      itemImageUrl: item.item_image_url,
      itemLink: item.item_link ?? "",
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.itemName.trim()) {
      toast.error("Nama kado wajib diisi");
      return;
    }
    const payload = {
      item_name: form.itemName.trim(),
      item_image_url: form.itemImageUrl,
      item_link: form.itemLink.trim() || null,
    };

    if (editingId) {
      updateWishlistItem.mutate(
        { id: editingId, req: payload },
        {
          onSuccess: () => {
            toast.success("Kado tersimpan");
            setSheetOpen(false);
          },
          onError: () => toast.error("Gagal menyimpan kado"),
        }
      );
    } else {
      createWishlistItem.mutate(payload, {
        onSuccess: () => {
          toast.success("Kado ditambahkan");
          setSheetOpen(false);
        },
        onError: () => toast.error("Gagal menambah kado"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteWishlistItem.mutate(deleteTarget.id, {
      onSuccess: () => toast.success("Kado dihapus"),
      onError: () => toast.error("Gagal menghapus kado"),
      onSettled: () => setDeleteTarget(null),
    });
  };

  if (isLoading) return <TabLoading />;

  const items = data ?? [];
  const isPending = createWishlistItem.isPending || updateWishlistItem.isPending;

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-16 w-16 opacity-20" />
          <p className="text-[13px] text-muted-foreground">
            Belum ada kado. Tambahkan daftar keinginan pertama.
          </p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              {item.item_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.item_image_url}
                  alt={item.item_name}
                  className="h-14 w-14 shrink-0 rounded-xl border border-border/60 object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                  <Gift className="h-6 w-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[14px] font-semibold">{item.item_name}</p>
                  {item.is_claimed && (
                    <Badge className="shrink-0 gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15">
                      <PackageCheck className="h-3 w-3" /> Diklaim
                    </Badge>
                  )}
                </div>
                {item.item_link && (
                  <a
                    href={item.item_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[12px] font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.item_link}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="grid grid-cols-2 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
              <button
                onClick={() => openEdit(item)}
                className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 rounded-l-md"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(item)}
                className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 rounded-r-md"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label="Tambah kado"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
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
                {editingId ? "Edit Kado" : "Tambah Kado"}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
              <div className="space-y-1.5">
                <Label htmlFor="wishlist-name" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nama Kado</Label>
                <Input
                  id="wishlist-name"
                  value={form.itemName}
                  onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                  placeholder="Cth: Air Fryer"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <MediaInput
                label="Foto Kado (Opsional)"
                value={form.itemImageUrl}
                onChange={(v) => setForm((f) => ({ ...f, itemImageUrl: v }))}
                accept="image/*"
                folder="wedding"
                preview="image"
              />
              <div className="space-y-1.5">
                <Label htmlFor="wishlist-link" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Link Toko (Opsional)</Label>
                <Input
                  id="wishlist-link"
                  value={form.itemLink}
                  onChange={(e) => setForm((f) => ({ ...f, itemLink: e.target.value }))}
                  placeholder="https://tokopedia.com/..."
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
            <AlertDialogTitle className="text-base">Hapus kado?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              Kado &quot;{deleteTarget?.item_name}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteWishlistItem.isPending}
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
