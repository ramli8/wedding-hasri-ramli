"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { BadgeCheck, Check, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  useInvitation,
  useSubmitRsvp,
} from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";
import { cn } from "@/src/lib/utils";

type AttendanceStatus = "hadir" | "tidak_hadir";

const attendanceOptions: {
  value: AttendanceStatus;
  label: string;
  icon: typeof Check;
}[] = [
  { value: "hadir", label: "Hadir", icon: Check },
  { value: "tidak_hadir", label: "Berhalangan", icon: X },
];

function safeFormat(iso: string | null | undefined, pattern: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, pattern, { locale: localeId });
}

function toUiStatus(raw: string | null | undefined): AttendanceStatus | null {
  if (raw === "hadir") return "hadir";
  // tidak_hadir & ragu (data lama) sama-sama tampil sebagai Berhalangan.
  if (raw === "tidak_hadir" || raw === "ragu") return "tidak_hadir";
  return null;
}

export function WeddingRsvp() {
  const { data } = useInvitation();
  const submitRsvp = useSubmitRsvp();

  const guestId = data?.guest ? data.guest.id : null;

  // Pilihan tamu di sesi ini menang; bila belum menyentuh apa-apa,
  // tampilkan jawaban tersimpan dari backend (tetap terlihat setelah reload).
  const [userChoice, setUserChoice] = useState<AttendanceStatus | null>(null);
  const savedStatus = toUiStatus(data?.guest_rsvp?.attendance_status);
  const status = userChoice ?? savedStatus;
  const answered = status !== null;

  if (!data) return null;

  const deadline = safeFormat(data.wedding.wedding_date, "d MMMM yyyy");

  const handleSelect = (value: AttendanceStatus) => {
    if (!guestId) {
      toast.error("Konfirmasi hanya untuk tamu undangan resmi melalui link personal.");
      return;
    }

    haptic(10);
    setUserChoice(value);
    submitRsvp.mutate(
      {
        guest_id: guestId,
        attendance_status: value,
        number_of_guests: 1,
        wedding_event_id: null,
      },
      {
        onSuccess: () => {
          toast.success("Balasan Anda telah kami terima. Terima kasih!");
        },
        onError: () => {
          toast.error("Gagal mengirim balasan. Silakan coba lagi.");
        },
      },
    );
  };

  return (
    <section id="rsvp" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center md:max-w-[32rem]">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[2.75rem]">
            Konfirmasi Kehadiran
          </h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
            Kami akan sangat berbahagia dengan kehadiran Anda.
          </p>
        </WeddingReveal>

        <WeddingReveal delay={80} className="w-full max-w-md">
          <div
            role="radiogroup"
            aria-label="Konfirmasi kehadiran"
            className="grid grid-cols-2 gap-2.5"
          >
            {attendanceOptions.map((option) => {
              const selected = status === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={submitRsvp.isPending}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex min-h-[60px] items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[14px] font-semibold leading-snug transition-all duration-200 active:scale-[0.98] disabled:opacity-60",
                    selected
                      ? "border-transparent bg-[var(--wd-accent)] text-[#141413]"
                      : "border-[var(--wd-line-strong)] text-[var(--wd-ink)]/80 hover:border-[var(--wd-ink)]/50",
                  )}
                >
                  {submitRsvp.isPending && selected ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>

          {answered && status ? (
            <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--wd-accent-line)] bg-[var(--wd-accent-soft)] px-4 py-1.5 text-left text-[11px] font-semibold tracking-wide text-[var(--wd-accent)]">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Jawaban tersimpan
                {" — "}
                ketuk pilihan lain bila ingin mengubah.
              </span>
            </p>
          ) : null}

          {deadline ? (
            <p className="wd-label mt-6">Mohon balas sebelum {deadline}</p>
          ) : null}
        </WeddingReveal>
      </div>
    </section>
  );
}
