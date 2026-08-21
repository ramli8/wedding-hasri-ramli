"use client";

import { useState } from "react";
import { HelpCircle, Inbox, Loader2, Plus, Trash2, X } from "lucide-react";
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
  useFaqs,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
} from "@/src/application/hooks/use-wedding-query";
import type { FaqResponse } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";

interface FaqFormState {
  question: string;
  answer: string;
  orderIndex: number;
}

const EMPTY_FORM: FaqFormState = {
  question: "",
  answer: "",
  orderIndex: 0,
};

export function FaqTab() {
  const { data, isLoading } = useFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FaqFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<FaqResponse | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (faq: FaqResponse) => {
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      orderIndex: faq.order_index,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Pertanyaan dan jawaban wajib diisi");
      return;
    }
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      order_index: Number.isNaN(form.orderIndex) ? 0 : form.orderIndex,
    };

    if (editingId) {
      updateFaq.mutate(
        { id: editingId, req: payload },
        {
          onSuccess: () => {
            toast.success("FAQ tersimpan");
            setSheetOpen(false);
          },
          onError: () => toast.error("Gagal menyimpan FAQ"),
        }
      );
    } else {
      createFaq.mutate(payload, {
        onSuccess: () => {
          toast.success("FAQ ditambahkan");
          setSheetOpen(false);
        },
        onError: () => toast.error("Gagal menambah FAQ"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteFaq.mutate(deleteTarget.id, {
      onSuccess: () => toast.success("FAQ dihapus"),
      onError: () => toast.error("Gagal menghapus FAQ"),
      onSettled: () => setDeleteTarget(null),
    });
  };

  if (isLoading) return <TabLoading />;

  const faqs = [...(data ?? [])].sort((a, b) =>
    a.order_index === b.order_index
      ? a.created_at.localeCompare(b.created_at)
      : a.order_index - b.order_index
  );
  const isPending = createFaq.isPending || updateFaq.isPending;

  return (
    <div className="space-y-4">
      {faqs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-16 w-16 opacity-20" />
          <p className="text-[13px] text-muted-foreground">
            Belum ada FAQ. Tambahkan pertanyaan yang sering diajukan.
          </p>
        </div>
      ) : (
        faqs.map((faq) => (
          <div key={faq.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HelpCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">{faq.question}</p>
                <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="grid grid-cols-2 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
              <button
                onClick={() => openEdit(faq)}
                className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 rounded-l-md"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(faq)}
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
        aria-label="Tambah FAQ"
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
                {editingId ? "Edit FAQ" : "Tambah FAQ"}
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
                <Label htmlFor="faq-question" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Pertanyaan</Label>
                <Input
                  id="faq-question"
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  placeholder="Cth: Boleh datang tanpa hadir?"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-answer" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Jawaban</Label>
                <Textarea
                  id="faq-answer"
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                  rows={4}
                  placeholder="Tulis jawabannya di sini..."
                  className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-order" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Urutan</Label>
                <Input
                  id="faq-order"
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
            <AlertDialogTitle className="text-base">Hapus FAQ?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              Pertanyaan &quot;{deleteTarget?.question}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteFaq.isPending}
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
