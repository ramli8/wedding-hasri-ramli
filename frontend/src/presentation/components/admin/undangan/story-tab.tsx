"use client";

import { useState } from "react";
import {
  BookOpenText,
  CalendarDays,
  Inbox,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { Textarea } from "@/src/presentation/components/ui/textarea";
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
  useStories,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
} from "@/src/application/hooks/use-wedding-query";
import type { StoryResponse } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";
import { MediaInput } from "./media-input";
import { deleteUploadedFiles } from "./upload-cleanup";

interface StoryFormState {
  eventDate: string;
  title: string;
  description: string;
  detail: string;
  imageUrl: string | null;
  orderIndex: number;
}

const EMPTY_FORM: StoryFormState = {
  eventDate: "",
  title: "",
  description: "",
  detail: "",
  imageUrl: null,
  orderIndex: 0,
};

export function StoryTab() {
  const { data, isLoading } = useStories();
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StoryFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<StoryResponse | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (story: StoryResponse) => {
    setEditingId(story.id);
    setForm({
      eventDate: story.event_date ?? "",
      title: story.title,
      description: story.description ?? "",
      detail: story.detail ?? "",
      imageUrl: story.image_url,
      orderIndex: story.order_index,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    const payload = {
      event_date: form.eventDate.trim() || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      detail: form.detail.trim() || null,
      image_url: form.imageUrl,
      order_index: Number.isNaN(form.orderIndex) ? 0 : form.orderIndex,
    };

    if (editingId) {
      const previousImage =
        (data ?? []).find((s) => s.id === editingId)?.image_url ?? null;
      updateStory.mutate(
        { id: editingId, req: payload },
        {
          onSuccess: () => {
            if (previousImage && previousImage !== payload.image_url) {
              deleteUploadedFiles([previousImage]);
            }
            toast.success("Kisah tersimpan");
            setSheetOpen(false);
          },
          onError: () => toast.error("Gagal menyimpan kisah"),
        }
      );
    } else {
      createStory.mutate(payload, {
        onSuccess: () => {
          toast.success("Kisah ditambahkan");
          setSheetOpen(false);
        },
        onError: () => toast.error("Gagal menambah kisah"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const media = deleteTarget.image_url;
    deleteStory.mutate(deleteTarget.id, {
      onSuccess: () => {
        deleteUploadedFiles([media]);
        toast.success("Kisah dihapus");
      },
      onError: () => toast.error("Gagal menghapus kisah"),
      onSettled: () => setDeleteTarget(null),
    });
  };

  if (isLoading) return <TabLoading />;

  const stories = [...(data ?? [])].sort((a, b) =>
    a.order_index === b.order_index
      ? a.created_at.localeCompare(b.created_at)
      : a.order_index - b.order_index
  );
  const isPending = createStory.isPending || updateStory.isPending;

  return (
    <div className="space-y-4">
      {stories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-16 w-16 opacity-20" />
          <p className="text-[13px] text-muted-foreground">
            Belum ada kisah. Ceritakan perjalanan cinta kalian.
          </p>
        </div>
      ) : (
        <div className="relative space-y-4 pl-6">
          <span
            className="absolute bottom-3 left-[7px] top-3 w-px bg-border"
            aria-hidden
          />
          {stories.map((story) => (
            <div key={story.id} className="relative">
              <span
                className="absolute -left-6 top-5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background"
                aria-hidden
              />
              <div className="rounded-2xl border border-border bg-card p-4">
                {story.event_date && (
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {story.event_date}
                  </p>
                )}
                <p className="text-[14px] font-semibold">{story.title}</p>
                {story.detail && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <BookOpenText className="h-3 w-3" /> Ada detail
                  </span>
                )}
                {story.description && (
                  <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-muted-foreground">
                    {story.description}
                  </p>
                )}
                {story.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={story.image_url}
                    alt={story.title}
                    className="mt-3 h-36 w-full rounded-xl border border-border/60 object-cover"
                  />
                )}

                {/* Actions Footer */}
                <div className="grid grid-cols-2 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
                  <button
                    onClick={() => openEdit(story)}
                    className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 rounded-l-md"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(story)}
                    className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 rounded-r-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label="Tambah kisah"
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
                {editingId ? "Edit Kisah" : "Tambah Kisah"}
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
                <Label
                  htmlFor="story-date"
                  className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                >
                  Label Tanggal
                </Label>
                <Input
                  id="story-date"
                  value={form.eventDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, eventDate: e.target.value }))
                  }
                  placeholder="Cth: 2021 / 12 Feb 2021"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="story-title"
                  className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                >
                  Judul
                </Label>
                <Input
                  id="story-title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Cth: Pertama Bertemu"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="story-description"
                  className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                >
                  Deskripsi
                </Label>
                <Textarea
                  id="story-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Ringkasan singkat..."
                  className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="story-detail"
                  className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                >
                  Detail (Opsional)
                </Label>
                <Textarea
                  id="story-detail"
                  value={form.detail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, detail: e.target.value }))
                  }
                  rows={6}
                  placeholder="Narasi panjang — tamu bisa buka lewat tombol Baca Selengkapnya bila diisi."
                  className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <MediaInput
                label="Foto (Opsional)"
                hint="Rekomendasi 1200 × 1500 px"
                value={form.imageUrl}
                onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
                accept="image/*"
                folder="wedding"
                preview="image"
              />
              <div className="space-y-1.5">
                <Label
                  htmlFor="story-order"
                  className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                >
                  Urutan
                </Label>
                <Input
                  id="story-order"
                  type="number"
                  value={form.orderIndex}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      orderIndex: parseInt(e.target.value, 10),
                    }))
                  }
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
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kisah?</AlertDialogTitle>
            <AlertDialogDescription>
              Kisah &quot;{deleteTarget?.title}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteStory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
