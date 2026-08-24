"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  useGuestbook,
  useInvitation,
  useSubmitGuestbook,
} from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";

function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: localeId });
}

export function WeddingUcapan() {
  const { data } = useInvitation();
  const guestbook = useGuestbook(20);
  const submitGuestbook = useSubmitGuestbook();

  const guest = data?.guest ?? null;
  const [name, setName] = useState(guest?.name ?? "");
  const [message, setMessage] = useState("");

  if (!data) return null;

  const entries = guestbook.data?.entries ?? [];

  const handleSubmit = () => {
    if (!name.trim()) {
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
        guest_name: name.trim(),
        message_text: message.trim(),
      },
      {
        onSuccess: () => {
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
      <div className="wd-container flex flex-col items-center gap-8 text-center md:max-w-[36rem]">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Ucapan &amp; Doa</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
            Tuliskan ucapan dan doa terbaik untuk perjalanan baru kami.
          </p>
        </WeddingReveal>

        <WeddingReveal delay={80} className="w-full">
          <div className="flex flex-col gap-3 text-left">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama Anda"
              maxLength={255}
              readOnly={Boolean(guest)}
              className="h-12 w-full rounded-2xl border border-[var(--wd-line-strong)] bg-transparent px-5 text-[14px] outline-none transition-colors placeholder:text-[var(--wd-muted)] focus:border-[var(--wd-ink)]/60"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tulis ucapan & doa..."
              rows={4}
              maxLength={2000}
              className="w-full resize-none rounded-2xl border border-[var(--wd-line-strong)] bg-transparent px-5 py-4 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-[var(--wd-muted)] focus:border-[var(--wd-ink)]/60"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitGuestbook.isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--wd-ink)] px-8 text-[13px] font-bold tracking-wide text-[var(--wd-bg)] transition-all duration-200 active:scale-95 disabled:opacity-60"
            >
              {submitGuestbook.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Kirim Ucapan
            </button>
          </div>
        </WeddingReveal>

        <WeddingReveal delay={120} className="w-full">
          <div className="flex flex-col gap-0">
            {guestbook.isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--wd-muted)]" />
            ) : entries.length === 0 ? (
              <p className="py-6 text-[13px] italic text-[var(--wd-muted)]">
                Belum ada ucapan — jadilah yang pertama.
              </p>
            ) : (
              <>
                <p className="wd-label mb-4 self-start">
                  {guestbook.data?.total ?? entries.length} Ucapan
                </p>
                <ul className="divide-y divide-[var(--wd-line)]">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex flex-col gap-1 py-5 text-left">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[14px] font-semibold">{entry.guest_name}</p>
                        <span className="shrink-0 text-[11px] text-[var(--wd-muted)]">
                          {timeAgo(entry.created_at)}
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-[var(--wd-ink)]/75">
                        {entry.message_text}
                      </p>
                      {entry.reply_text ? (
                        <p className="mt-1 rounded-xl border border-[var(--wd-line)] px-4 py-2.5 text-[12px] leading-relaxed text-[var(--wd-muted)]">
                          <span className="font-semibold">Balasan: </span>
                          {entry.reply_text}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {entries.length < (guestbook.data?.total ?? 0) ? (
                  <button
                    type="button"
                    onClick={() => toast.info("Menampilkan lebih banyak ucapan menyusul.")}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-[var(--wd-line-strong)] px-6 text-[12px] font-bold tracking-wide transition-all duration-200 active:scale-95"
                  >
                    Tampilkan Lebih Banyak
                  </button>
                ) : null}
              </>
            )}
          </div>
        </WeddingReveal>
      </div>
    </section>
  );
}
