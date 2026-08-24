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
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const guestbook = useGuestbook(visibleCount);
  const submitGuestbook = useSubmitGuestbook();

  if (!data) return null;

  const entries = guestbook.data?.entries ?? [];
  const total = guestbook.data?.total ?? entries.length;
  const canSubmit = Boolean((guest?.name ?? name).trim()) && message.trim().length > 0;

  const handleSubmit = () => {
    if (!guest && !name.trim()) {
      toast.info("Mohon isi nama Anda.");
      return;
    }
    if (!message.trim()) {
      toast.info("Mohon tulis ucapan & doa Anda.");
      return;
    }

    haptic(10);
    submitGuestbook.mutate(
      {
        guest_id: guest ? guest.id : null,
        guest_name: (guest?.name ?? name).trim(),
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
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            Titipan Doa
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Ucapan &amp; Doa</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
            Tuliskan ucapan dan doa terbaik untuk perjalanan baru kami.
          </p>
        </WeddingReveal>

        <WeddingReveal delay={80}>
          <button
            type="button"
            onClick={() => {
              haptic(8);
              setSheetOpen(true);
            }}
            aria-haspopup="dialog"
            className="inline-flex h-[52px] items-center gap-2 rounded-full bg-[var(--wd-accent)] px-8 text-[12px] font-bold tracking-wide text-[#141413] transition-all duration-200 active:scale-[0.98]"
          >
            <PenLine className="h-4 w-4" aria-hidden />
            Tulis Ucapan
          </button>
        </WeddingReveal>

        <WeddingReveal delay={120} className="w-full">
          <div className="flex w-full items-center gap-4">
            <p className="wd-label shrink-0">{total} Ucapan</p>
            <span className="wd-hairline-t w-full" aria-hidden />
          </div>

          <div className="text-left">
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
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                <p className="wd-display text-[1.35rem] italic text-[var(--wd-ink)]/80">
                  Belum ada ucapan.
                </p>
                <p className="text-[13px] text-[var(--wd-muted)]">
                  Jadilah yang pertama menitipkan doa.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-[var(--wd-line)]">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex gap-4 py-6 sm:gap-5">
                      <span
                        aria-hidden
                        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--wd-accent-line)] text-[1.05rem] [font-family:var(--font-cormorant),serif] text-[var(--wd-accent)]"
                      >
                        {initialOf(entry.guest_name)}
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="wd-script truncate text-[1.45rem] leading-tight">
                            {entry.guest_name}
                          </p>
                          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--wd-muted)]">
                            {timeAgo(entry.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-line break-words text-[13px] leading-relaxed text-[var(--wd-ink)]/80">
                          {entry.message_text}
                        </p>
                        {/* Balasan hanya dari mempelai/admin — tamu tidak punya aksi balas di sini. */}
                        {entry.reply_text ? (
                          <div className="mt-2 border-l-2 border-[var(--wd-accent-line)] pl-4">
                            <p className="wd-label mb-1">Mempelai</p>
                            <p className="whitespace-pre-line break-words text-[12px] leading-relaxed text-[var(--wd-muted)]">
                              {entry.reply_text}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
                {entries.length < total ? (
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

      {/* Bottom sheet tulis ucapan — warna literal karena portal berada di luar scope .wedding. */}
      <style jsx global>{`
        .wd-ucapan-sheet {
          background-color: #17171a;
          color: #f4f4f4;
          border: 1px solid rgba(244, 244, 244, 0.12);
          border-bottom: none;
        }
        .wd-ucapan-sheet > div:first-child {
          background: rgba(244, 244, 244, 0.25);
          margin-top: 0.875rem;
        }
      `}</style>
      <Drawer shouldScaleBackground={false} open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="wd-ucapan-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[1.75rem]">
          <div className="flex flex-col gap-5 overflow-y-auto px-6 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-2">
            <div className="flex flex-col items-center gap-1 pb-1">
              <DrawerTitle className="text-xl font-light [font-family:var(--font-cormorant),serif]">
                Tulis Ucapan
              </DrawerTitle>
              <DrawerDescription className="max-w-full truncate text-[11px] uppercase tracking-[0.28em] text-[#8e8e93]">
                Ucapan &amp; Doa
              </DrawerDescription>
            </div>

            {guest ? (
              <div className="flex flex-col items-center gap-1 pb-1 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8e8e93]">
                  Menulis sebagai
                </p>
                <p className="text-[1.75rem] leading-tight [font-family:var(--font-great-vibes),cursive]">
                  {guest.name}
                </p>
              </div>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8e8e93]">
                  Nama Anda
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tulis nama Anda"
                  maxLength={255}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-[14px] text-[#f4f4f4] outline-none transition-colors placeholder:text-[#8e8e93]/70 focus:border-[#ece9e2]/50"
                />
              </label>
            )}

            <div className="flex flex-col gap-1.5">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tuliskan ucapan & doa terbaikmu…"
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[14px] leading-relaxed text-[#f4f4f4] outline-none transition-colors placeholder:text-[#8e8e93]/70 focus:border-[#ece9e2]/50"
              />
              <span
                className={cn(
                  "self-end text-[10px] tabular-nums tracking-wide text-[#8e8e93] transition-opacity duration-200",
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
              className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#ece9e2] px-8 text-[12px] font-bold tracking-wide text-[#141413] transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
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
