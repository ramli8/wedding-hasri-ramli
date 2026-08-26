"use client";

import { useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/src/presentation/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/src/presentation/components/ui/avatar";
import { Badge } from "@/src/presentation/components/ui/badge";
import { Card } from "@/src/presentation/components/ui/card";
import {
  useGuestbook,
  useInvitation,
  useSubmitGuestbook,
} from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";
import { cn } from "@/src/lib/utils";

const PAGE_SIZE = 10;

function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: localeId });
}

function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "?";
}

export function WeddingUcapan() {
  const { data } = useInvitation();
  const guest = data?.guest ?? null;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [collapsedThreads, setCollapsedThreads] = useState<Record<string, true>>({});

  const guestbook = useGuestbook(visibleCount);
  const submitGuestbook = useSubmitGuestbook();

  if (!data) return null;

  const toggleThread = (id: string) => {
    haptic(6);
    setCollapsedThreads((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  };

  const threads = guestbook.data?.threads ?? [];
  const total = guestbook.data?.total_messages ?? 0;
  const totalThreads = guestbook.data?.total_threads ?? threads.length;
  const canSubmit = Boolean(guest) && message.trim().length > 0;

  const handleSubmit = () => {
    if (!guest) {
      toast.info("Ucapan hanya untuk tamu undangan resmi melalui link personal.");
      return;
    }
    if (!message.trim()) {
      toast.info("Mohon tulis ucapan & doa Anda.");
      return;
    }

    haptic(10);
    submitGuestbook.mutate(
      {
        guest_id: guest.id,
        message_text: message.trim(),
      },
      {
        onSuccess: () => {
          setSheetOpen(false);
          setMessage("");
          toast.success("Ucapan dan doa telah terkirim. Terima kasih!");
        },
        onError: () => {
          toast.error("Gagal mengirim ucapan. Silakan coba lagi.");
        },
      },
    );
  };

  return (
    <section id="ucapan" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center md:max-w-[36rem]">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Ucapan &amp; Doa</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
            Setiap kata dari Anda menjadi kenangan yang kami simpan.
          </p>
        </WeddingReveal>

        {guest ? (
          <WeddingReveal delay={80}>
            <button
              type="button"
              onClick={() => {
                haptic(8);
                setSheetOpen(true);
              }}
              aria-haspopup="dialog"
              className="inline-flex h-[52px] items-center gap-2 rounded-full bg-[var(--wd-accent)] px-8 text-[12px] font-bold tracking-wide text-[var(--wd-on-accent)] transition-all duration-200 active:scale-[0.98]"
            >
              <PenLine className="h-4 w-4" aria-hidden />
              Tulis Ucapan
            </button>
          </WeddingReveal>
        ) : null}

        <WeddingReveal delay={120} className="w-full">
          <div className="flex w-full items-center gap-4">
            <p className="wd-label shrink-0">{total} Ucapan</p>
            <span className="wd-hairline-t w-full" aria-hidden />
          </div>

          <div className="mt-6 text-left">
            {guestbook.isLoading ? (
              <div className="flex flex-col gap-3 py-7" aria-hidden>
                {[88, 96, 62].map((width) => (
                  <div
                    key={width}
                    className="wd-loading-pulse h-3 rounded-full bg-white/[0.07]"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                <p className="wd-display text-[1.35rem] italic text-[var(--wd-ink)]/80">
                  Belum ada ucapan.
                </p>
                <p className="text-[13px] text-[var(--wd-muted)]">
                  {guest
                    ? "Jadilah yang pertama menitipkan doa."
                    : "Ucapan tamu akan tampil di sini."}
                </p>
              </div>
            ) : (
              <>
                <ul className="flex flex-col gap-4">
                  {threads.map((thread) => {
                    const [root, ...replies] = thread.messages;
                    const isCollapsed = Boolean(collapsedThreads[thread.id]);
                    return (
                      <li key={thread.id}>
                        <Card className="rounded-2xl border-[var(--wd-line)] bg-[var(--wd-card)] px-5 py-4 transition-colors duration-200 hover:bg-white/[0.02]">
                          <div className="flex gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="border border-[var(--wd-line-strong)] bg-white/[0.05] text-[1rem] [font-family:var(--font-cormorant),serif] text-[var(--wd-accent)]">
                                {initialOf(thread.guest_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-baseline gap-2">
                                <span className="min-w-0 truncate text-[14px] font-semibold">
                                  {thread.guest_name}
                                </span>
                                <span className="shrink-0 text-[11px] text-[var(--wd-muted)]">
                                  {timeAgo(root.created_at)}
                                </span>
                              </div>
                              <p className="whitespace-pre-line break-words text-[13px] leading-relaxed text-[var(--wd-ink)]/85">
                                {root.text}
                              </p>
                              {replies.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleThread(thread.id)}
                                  aria-expanded={!isCollapsed}
                                  className="relative mt-2.5 inline-flex h-7 items-center rounded-full border border-[var(--wd-line-strong)] px-3 text-[11px] font-semibold text-[var(--wd-muted)] transition-colors duration-200 before:absolute before:-inset-2.5 before:rounded-full before:content-[''] hover:border-[var(--wd-accent-line)] hover:text-[var(--wd-ink)]"
                                >
                                  {isCollapsed
                                    ? `Tampilkan Balasan (${replies.length})`
                                    : `Sembunyikan Balasan (${replies.length})`}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </Card>

                        {!isCollapsed && replies.length > 0 ? (
                          <div className="ml-4 mt-3 space-y-4 border-l-2 border-[var(--wd-line)] pl-4 md:ml-6 md:pl-5">
                            {/* Hanya mempelai yang membalas — tamu tidak punya aksi balas di sini. */}
                            {replies.map((msg) => (
                              <div key={msg.id} className="flex gap-3">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback
                                    className={cn(
                                      "border text-[0.85rem] [font-family:var(--font-cormorant),serif]",
                                      msg.role === "couple"
                                        ? "border-[var(--wd-accent-line)] bg-[var(--wd-accent-soft)] text-[var(--wd-accent)]"
                                        : "border-[var(--wd-line-strong)] bg-white/[0.04] text-[var(--wd-muted)]",
                                    )}
                                  >
                                    {msg.role === "couple" ? "&" : initialOf(thread.guest_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    {msg.role === "couple" ? (
                                      <Badge
                                        variant="outline"
                                        className="border-[var(--wd-accent-line)] bg-[var(--wd-accent-soft)] text-[9px] uppercase tracking-[0.16em] text-[var(--wd-accent)]"
                                      >
                                        Mempelai
                                      </Badge>
                                    ) : (
                                      <span className="text-[13px] font-semibold">
                                        {thread.guest_name}
                                      </span>
                                    )}
                                    <span className="text-[11px] text-[var(--wd-muted)]">
                                      {timeAgo(msg.created_at)}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-line break-words text-[13px] leading-relaxed text-[var(--wd-ink)]/75">
                                    {msg.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {threads.length < totalThreads ? (
                  <button
                    type="button"
                    onClick={() => {
                      haptic(8);
                      setVisibleCount((count) => count + PAGE_SIZE);
                    }}
                    disabled={guestbook.isFetching}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--wd-line-strong)] px-6 text-[12px] font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                  >
                    {guestbook.isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Tampilkan Lebih Banyak
                  </button>
                ) : null}
              </>
            )}
          </div>
        </WeddingReveal>
      </div>

      <Drawer shouldScaleBackground={false} open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="wd-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[1.75rem]">
          <div className="flex flex-col gap-5 overflow-y-auto px-6 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-2">
            <div className="flex flex-col items-center gap-1 pb-1">
              <DrawerTitle className="text-xl font-light [font-family:var(--font-cormorant),serif]">
                Tulis Ucapan
              </DrawerTitle>
              <DrawerDescription className="max-w-full truncate text-[11px] uppercase tracking-[0.28em] text-[var(--sheet-muted)]">
                Ucapan &amp; Doa
              </DrawerDescription>
            </div>

            {guest ? (
              <div className="flex items-center gap-3 pb-1">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="border border-white/15 bg-white/[0.05] text-[1rem] [font-family:var(--font-cormorant),serif] text-[var(--sheet-accent)]">
                    {initialOf(guest.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--sheet-muted)]">
                    Menulis sebagai
                  </p>
                  <p className="truncate text-[14px] font-semibold">{guest.name}</p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tuliskan ucapan & doa terbaikmu…"
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[14px] leading-relaxed text-[var(--sheet-ink)] outline-none transition-colors placeholder:text-[var(--sheet-muted)]/70 focus:border-[var(--sheet-accent-line)]"
              />
              <span
                className={cn(
                  "self-end text-[10px] tabular-nums tracking-wide text-[var(--sheet-muted)] transition-opacity duration-200",
                  message.length > 0 ? "opacity-100" : "select-none opacity-0",
                )}
                aria-hidden={message.length === 0}
              >
                {message.length}/2000
              </span>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitGuestbook.isPending || !canSubmit}
              className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--sheet-accent)] px-8 text-[12px] font-bold tracking-wide text-[var(--sheet-on-accent)] transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
            >
              {submitGuestbook.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Kirim Ucapan
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
