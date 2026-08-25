"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { BadgeCheck, Inbox, Loader2, MessagesSquare, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { Avatar, AvatarFallback } from "@/src/presentation/components/ui/avatar";
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
import { Textarea } from "@/src/presentation/components/ui/textarea";
import {
  useAdminGuestbook,
  useReplyGuestbook,
  useDeleteGuestbook,
} from "@/src/application/hooks/use-wedding-query";
import type { AdminGuestbookEntry } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";

function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: localeId });
}

function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "?";
}

type UcapanFilter = "all" | "unreplied";

const FILTERS: { key: UcapanFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "unreplied", label: "Belum Dibalas" },
];

export function UcapanTab() {
  const { data, isLoading } = useAdminGuestbook();
  const replyGuestbook = useReplyGuestbook();
  const deleteGuestbook = useDeleteGuestbook();

  const [filter, setFilter] = useState<UcapanFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<AdminGuestbookEntry | null>(null);
  const [draft, setDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminGuestbookEntry | null>(null);

  const entries = data ?? [];
  const unrepliedCount = entries.filter((e) => !e.reply_text).length;
  const filtered =
    filter === "unreplied" ? entries.filter((e) => !e.reply_text) : entries;

  const openReply = (entry: AdminGuestbookEntry) => {
    setReplyTarget(entry);
    setDraft(entry.reply_text ?? "");
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!replyTarget) return;
    if (!draft.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }
    replyGuestbook.mutate(
      { id: replyTarget.id, req: { reply_text: draft.trim() } },
      {
        onSuccess: () => {
          toast.success("Balasan terkirim");
          setSheetOpen(false);
        },
        onError: () => toast.error("Gagal mengirim balasan"),
      },
    );
  };

  const sheetTitle = useMemo(() => {
    if (!replyTarget) return "";
    return replyTarget.reply_text ? "Ubah Balasan" : "Balas Ucapan";
  }, [replyTarget]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteGuestbook.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Ucapan dihapus");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Gagal menghapus ucapan"),
    });
  };

  if (isLoading) return <TabLoading />;

  return (
    <div className="space-y-4">
      {/* Filter pill */}
      <div className="flex bg-muted/40 p-1 rounded-xl h-11">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg transition-all ${
              filter === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "unreplied" && unrepliedCount > 0 ? `${label} (${unrepliedCount})` : label}
          </button>
        ))}
      </div>

      {/* Count row */}
      <div className="flex items-center justify-between px-2 min-h-[32px]">
        <span className="text-sm font-semibold tracking-tight">
          {filter === "all" ? "Semua Ucapan" : "Belum Dibalas"} ({filtered.length})
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Balasan tampil sebagai Mempelai
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-16 w-16 opacity-20" />
          <p className="text-[13px] text-muted-foreground">
            {filter === "unreplied"
              ? "Semua ucapan sudah terbalas."
              : "Belum ada ucapan dari tamu."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="border border-border/60 bg-primary/5 text-[15px] [font-family:var(--font-cormorant),serif] text-primary">
                    {initialOf(entry.guest_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="truncate text-[14px] font-semibold">{entry.guest_name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {timeAgo(entry.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-line break-words text-[13px] leading-relaxed text-foreground/85">
                    {entry.message_text}
                  </p>

                  {entry.reply_text ? (
                    <div className="mt-3 rounded-xl border border-primary/10 bg-primary/5 px-3.5 py-2.5">
                      <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
                        <BadgeCheck className="h-3 w-3" /> Dibalas {timeAgo(entry.replied_at ?? entry.created_at)}
                      </p>
                      <p className="mt-1 whitespace-pre-line break-words text-[12px] leading-relaxed text-foreground/80">
                        {entry.reply_text}
                      </p>
                    </div>
                  ) : (
                    <span className="mt-2 inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive">
                      Belum dibalas
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="grid grid-cols-2 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
                <button
                  onClick={() => openReply(entry)}
                  className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 rounded-l-md"
                >
                  <MessagesSquare className="w-3.5 h-3.5" />
                  {entry.reply_text ? "Ubah Balasan" : "Balas"}
                </button>
                <button
                  onClick={() => setDeleteTarget(entry)}
                  className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 rounded-r-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom sheet balasan */}
      {sheetOpen && replyTarget && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSheetOpen(false)}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[15px] font-bold w-full text-center">{sheetTitle}</h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
              <div className="rounded-xl bg-muted/20 border border-border/60 px-4 py-3">
                <p className="text-[12px] font-semibold">{replyTarget.guest_name}</p>
                <p className="mt-0.5 whitespace-pre-line break-words text-[12px] leading-relaxed text-muted-foreground">
                  {replyTarget.message_text}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                  Balasan Anda (tampil sebagai Mempelai)
                </label>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="Terima kasih atas doanya..."
                  className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
                <p className="self-end pr-1 text-[10px] tabular-nums text-muted-foreground/70">
                  {draft.length}/1000
                </p>
              </div>
            </div>

            <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5 border-t border-border/40">
              <button
                onClick={handleSave}
                disabled={replyGuestbook.isPending || !draft.trim()}
                className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {replyGuestbook.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Kirim Balasan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center space-y-2 text-center sm:text-center">
            <AlertDialogTitle className="text-base">Hapus ucapan?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              Ucapan dari &quot;{deleteTarget?.guest_name}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteGuestbook.isPending}
              className="w-full bg-destructive text-white hover:bg-destructive/90 active:scale-95 transition-all"
            >
              {deleteGuestbook.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full active:scale-95 transition-all">Batal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
  );
}
