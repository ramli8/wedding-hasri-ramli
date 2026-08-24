"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  useInvitation,
  useSubmitRsvp,
} from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";
import { cn } from "@/src/lib/utils";

type AttendanceStatus = "hadir" | "tidak_hadir" | "ragu";

const attendanceOptions: { value: AttendanceStatus; label: string }[] = [
  { value: "hadir", label: "Hadir" },
  { value: "tidak_hadir", label: "Tidak Hadir" },
  { value: "ragu", label: "Masih Ragu" },
];

export function WeddingRsvp() {
  const { data } = useInvitation();
  const submitRsvp = useSubmitRsvp();

  const guestId = data?.guest ? data.guest.id : null;
  const guestName = data?.guest?.name ?? "";
  const events = data?.events ?? [];
  const mainEvent = events.find((event) => event.is_main_event) ?? events[0];

  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [eventId, setEventId] = useState<string>(mainEvent?.id ?? "");
  const [submitted, setSubmitted] = useState(false);

  if (!data) return null;

  const handleSubmit = () => {
    if (!status) {
      toast.info("Mohon pilih konfirmasi kehadiran terlebih dahulu.");
      return;
    }
    if (events.length > 0 && !eventId) {
      toast.info("Mohon pilih acara yang akan dihadiri.");
      return;
    }
    if (!guestId) {
      toast.error("Konfirmasi hanya untuk tamu undangan resmi melalui link personal.");
      return;
    }

    haptic(10);
    submitRsvp.mutate(
      {
        guest_id: guestId,
        attendance_status: status,
        number_of_guests: numberOfGuests,
        wedding_event_id: eventId || null,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success("Terima kasih! Konfirmasi kehadiran Anda telah kami terima.");
        },
        onError: () => {
          toast.error("Gagal mengirim konfirmasi. Silakan coba lagi.");
        },
      },
    );
  };

  return (
    <section id="rsvp" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center md:max-w-[32rem]">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            please respond
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">RSVP</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
            Mohon konfirmasi kehadiran Anda sebelum acara berlangsung.
          </p>
        </WeddingReveal>

        {submitted ? (
          <WeddingReveal>
            <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-[var(--wd-line)] px-8 py-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--wd-card)]">
                <Check className="h-5 w-5" />
              </span>
              <p className="wd-display text-[1.5rem]">Terima Kasih</p>
              <p className="text-[13px] leading-relaxed text-[var(--wd-muted)]">
                Konfirmasi kehadiran Anda sudah kami terima. Sampai jumpa di hari bahagia!
              </p>
            </div>
          </WeddingReveal>
        ) : (
          <WeddingReveal delay={100} className="w-full">
            <div className="flex flex-col gap-6 text-left">
              <div className="flex flex-col gap-2.5">
                <p className="wd-label">Apakah Anda akan hadir?</p>
                <div className="flex flex-wrap gap-2">
                  {attendanceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        haptic(6);
                        setStatus(option.value);
                      }}
                      className={cn(
                        "h-11 rounded-full border px-5 text-[13px] font-semibold transition-all duration-200 active:scale-95",
                        status === option.value
                          ? "border-transparent bg-[var(--wd-ink)] text-[var(--wd-bg)]"
                          : "border-[var(--wd-line-strong)] text-[var(--wd-ink)]/80 hover:border-[var(--wd-ink)]/50",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {status === "hadir" || status === "ragu" ? (
                <>
                  <div className="flex flex-col gap-2.5">
                    <p className="wd-label">Jumlah Tamu</p>
                    <div className="grid w-fit grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            haptic(6);
                            setNumberOfGuests(count);
                          }}
                          aria-label={`${count} tamu`}
                          className={cn(
                            "h-11 w-11 rounded-xl border text-[14px] font-bold transition-all duration-200 active:scale-95",
                            numberOfGuests === count
                              ? "border-transparent bg-[var(--wd-ink)] text-[var(--wd-bg)]"
                              : "border-[var(--wd-line-strong)] text-[var(--wd-ink)]/80 hover:border-[var(--wd-ink)]/50",
                          )}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {events.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      <p className="wd-label">Acara</p>
                      <div className="flex flex-wrap gap-2">
                        {events.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => {
                              haptic(6);
                              setEventId(event.id);
                            }}
                            className={cn(
                              "h-11 rounded-full border px-5 text-[13px] font-semibold transition-all duration-200 active:scale-95",
                              eventId === event.id
                                ? "border-transparent bg-[var(--wd-ink)] text-[var(--wd-bg)]"
                                : "border-[var(--wd-line-strong)] text-[var(--wd-ink)]/80 hover:border-[var(--wd-ink)]/50",
                            )}
                          >
                            {event.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitRsvp.isPending}
                className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--wd-ink)] px-8 text-[13px] font-bold tracking-wide text-[var(--wd-bg)] transition-all duration-200 active:scale-95 disabled:opacity-60"
              >
                {submitRsvp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Kirim Konfirmasi
              </button>
            </div>
          </WeddingReveal>
        )}
      </div>
    </section>
  );
}
