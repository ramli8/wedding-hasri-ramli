"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  useInvitation,
  useSubmitRsvp,
} from "@/src/application/hooks/use-invitation-query";
import type { InvitationEvent } from "@/src/domain/services/invitation.service";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";
import { cn } from "@/src/lib/utils";

type AttendanceStatus = "hadir" | "tidak_hadir" | "ragu";

const attendanceOptions: { value: AttendanceStatus; label: string }[] = [
  { value: "hadir", label: "Hadir" },
  { value: "tidak_hadir", label: "Berhalangan" },
  { value: "ragu", label: "Masih Ragu" },
];

function safeFormat(iso: string | null | undefined, pattern: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, pattern, { locale: localeId });
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all duration-200",
        checked
          ? "border-[var(--wd-accent)] bg-[var(--wd-accent)]"
          : "border-[var(--wd-line-strong)]",
      )}
    >
      {checked ? (
        <span className="h-[6px] w-[6px] rounded-full bg-[#141413]" />
      ) : null}
    </span>
  );
}

export function WeddingRsvp() {
  const { data } = useInvitation();
  const submitRsvp = useSubmitRsvp();

  const guestId = data?.guest ? data.guest.id : null;
  const guestName = data?.guest?.name ?? "";
  const events = data?.events ?? [];
  const mainEvent = events.find((event) => event.is_main_event) ?? events[0];

  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [eventId, setEventId] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  if (!data) return null;

  const effectiveEventId = eventId || mainEvent?.id || "";
  const selectedEvent = events.find((event) => event.id === effectiveEventId);
  const deadline = safeFormat(
    mainEvent?.start_time ?? mainEvent?.event_date,
    "d MMMM yyyy",
  );
  const statusLabel =
    attendanceOptions.find((option) => option.value === status)?.label ?? "";

  const handleSubmit = () => {
    if (!status) {
      toast.info("Mohon pilih konfirmasi kehadiran terlebih dahulu.");
      return;
    }
    if (events.length > 0 && !effectiveEventId) {
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
        wedding_event_id: effectiveEventId || null,
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

  const optionRowClass = (selected: boolean) =>
    cn(
      "flex min-h-[54px] w-full items-center justify-between gap-3 border-b border-[var(--wd-line)] px-1 py-3 text-left transition-all duration-200 active:bg-white/[0.04]",
      !selected && "hover:bg-white/[0.02]",
    );

  return (
    <section id="rsvp" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center md:max-w-[32rem]">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            Mohon Balasan
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">RSVP</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
            {deadline
              ? `Konfirmasi kehadiran Anda sebelum ${deadline}.`
              : "Mohon konfirmasi kehadiran Anda sebelum acara berlangsung."}
          </p>
        </WeddingReveal>

        {submitted ? (
          <WeddingReveal>
            <div className="relative w-full rounded-[1.5rem] border border-[var(--wd-line)] bg-[var(--wd-card)] px-6 py-10 sm:px-8">
              <span className="absolute -left-2 top-[26px] h-4 w-4 rounded-full border border-[var(--wd-line-strong)] bg-[var(--wd-bg)]" />
              <span className="absolute -right-2 top-[26px] h-4 w-4 rounded-full border border-[var(--wd-line-strong)] bg-[var(--wd-bg)]" />
              <div className="absolute inset-x-7 top-[33px] border-t border-dashed border-[var(--wd-line-strong)]" />

              <div className="flex flex-col items-center gap-5 pt-4">
                <span className="-rotate-6 rounded-lg border-2 border-[var(--wd-accent-line)] p-[3px]">
                  <span className="block rounded-md border border-[var(--wd-accent-line)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--wd-accent)]">
                    Respon Diterima
                  </span>
                </span>
                <p className="wd-script text-[2rem] leading-tight text-[var(--wd-ink)]">
                  {guestName || "Terima Kasih"}
                </p>
                <div className="flex flex-col items-center gap-1">
                  <p className="wd-label">{statusLabel}</p>
                  {status !== "tidak_hadir" ? (
                    <p className="text-[13px] leading-relaxed text-[var(--wd-muted)]">
                      {[`${numberOfGuests} tamu`, selectedEvent?.name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
                <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
                  {status === "tidak_hadir"
                    ? "Terima kasih atas konfirmasinya. Doa restu Anda sangat berarti bagi kami."
                    : "Sampai jumpa di hari bahagia!"}
                </p>
              </div>
            </div>
          </WeddingReveal>
        ) : (
          <WeddingReveal delay={100} className="w-full">
            <div className="relative w-full rounded-[1.5rem] border border-[var(--wd-line)] bg-[var(--wd-card)] px-6 pb-7 pt-8 text-left sm:px-8">
              <span className="absolute -left-2 top-[26px] h-4 w-4 rounded-full border border-[var(--wd-line-strong)] bg-[var(--wd-bg)]" />
              <span className="absolute -right-2 top-[26px] h-4 w-4 rounded-full border border-[var(--wd-line-strong)] bg-[var(--wd-bg)]" />
              <div className="absolute inset-x-7 top-[33px] border-t border-dashed border-[var(--wd-line-strong)]" />

              <div className="flex flex-col items-center gap-1 pb-6 pt-2 text-center">
                <p className="wd-label">Kepada</p>
                <p className="wd-script text-[2rem] leading-tight">
                  {guestName || "Tamu Undangan"}
                </p>
              </div>

              <div role="radiogroup" aria-label="Konfirmasi kehadiran" className="flex flex-col gap-6">
                <div className="flex flex-col">
                  <p className="wd-label mb-1.5">Apakah Anda akan hadir?</p>
                  {attendanceOptions.map((option) => {
                    const selected = status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          haptic(6);
                          setStatus(option.value);
                        }}
                        className={cn(
                          optionRowClass(selected),
                          selected && "bg-white/[0.03]",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[14px] transition-colors duration-200",
                            selected
                              ? "font-semibold text-[var(--wd-accent)]"
                              : "font-medium text-[var(--wd-ink)]/80",
                          )}
                        >
                          {option.label}
                        </span>
                        <RadioDot checked={selected} />
                      </button>
                    );
                  })}
                </div>

                {status === "hadir" || status === "ragu" ? (
                  <>
                    <div className="flex flex-col gap-2.5">
                      <p className="wd-label">Jumlah Tamu</p>
                      <div className="flex overflow-hidden rounded-xl border border-[var(--wd-line-strong)]">
                        {[1, 2, 3, 4].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              haptic(6);
                              setNumberOfGuests(count);
                            }}
                            aria-label={`${count} tamu`}
                            aria-pressed={numberOfGuests === count}
                            className={cn(
                              "wd-display h-11 flex-1 border-r border-[var(--wd-line)] text-[1.25rem] transition-all duration-200 last:border-r-0 active:scale-95",
                              numberOfGuests === count
                                ? "bg-[var(--wd-accent)] text-[#141413]"
                                : "text-[var(--wd-ink)]/80 active:bg-white/[0.06]",
                            )}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    {events.length > 0 ? (
                      <div className="flex flex-col">
                        <p className="wd-label mb-1.5">Acara</p>
                        {events.map((event: InvitationEvent) => {
                          const selected = event.id === effectiveEventId;
                          const date = safeFormat(
                            event.start_time ?? event.event_date,
                            "d MMM yyyy",
                          );
                          return (
                            <button
                              key={event.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => {
                                haptic(6);
                                setEventId(event.id);
                              }}
                              className={cn(
                                optionRowClass(selected),
                                selected && "bg-white/[0.03]",
                              )}
                            >
                              <span className="flex min-w-0 flex-col items-start gap-0.5">
                                <span
                                  className={cn(
                                    "text-[14px] transition-colors duration-200",
                                    selected
                                      ? "font-semibold text-[var(--wd-accent)]"
                                      : "font-medium text-[var(--wd-ink)]/80",
                                  )}
                                >
                                  {event.name}
                                </span>
                                {date ? (
                                  <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--wd-muted)]">
                                    {date}
                                  </span>
                                ) : null}
                              </span>
                              <RadioDot checked={selected} />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitRsvp.isPending}
                className="mt-7 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--wd-accent)] px-8 text-[12px] font-bold tracking-wide text-[#141413] transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
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
