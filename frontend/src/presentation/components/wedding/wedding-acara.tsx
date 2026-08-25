"use client";

import { useState } from "react";
import { CalendarPlus, ChevronRight, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/src/presentation/components/ui/drawer";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import type { InvitationEvent } from "@/src/domain/services/invitation.service";
import { haptic } from "@/src/lib/invitation/haptics";
import { cn } from "@/src/lib/utils";
import { WeddingReveal } from "./wedding-reveal";

interface WeddingAcaraProps {
  hideHeader?: boolean;
}

function safeFormat(iso: string | null, pattern: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, pattern, { locale: localeId });
}

function utcStamp(value: Date): string {
  return value.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function googleCalendarUrl(event: InvitationEvent): string | null {
  const base = event.start_time ?? event.event_date;
  if (!base) return null;
  const startDate = new Date(base);
  if (Number.isNaN(startDate.getTime())) return null;
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${utcStamp(startDate)}/${utcStamp(endDate)}`,
  });
  if (event.venue_name) params.set("location", event.venue_name);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookCalendarUrl(event: InvitationEvent): string | null {
  const base = event.start_time ?? event.event_date;
  if (!base) return null;
  const startDate = new Date(base);
  if (Number.isNaN(startDate.getTime())) return null;
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.name,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
  });
  if (event.venue_name) params.set("location", event.venue_name);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function buildIcs(event: InvitationEvent): string | null {
  const base = event.start_time ?? event.event_date;
  if (!base) return null;
  const startDate = new Date(base);
  if (Number.isNaN(startDate.getTime())) return null;
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Undangan Pernikahan//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${utcStamp(startDate)}-${event.id}@undangan`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(startDate)}`,
    `DTEND:${utcStamp(endDate)}`,
    `SUMMARY:${escapeIcsText(event.name)}`,
    ...(event.venue_name ? [`LOCATION:${escapeIcsText(event.venue_name)}`] : []),
    "DESCRIPTION:Dari undangan pernikahan Hasri & Ramli",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs(event: InvitationEvent): boolean {
  const ics = buildIcs(event);
  if (!ics) return false;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "acara-pernikahan.ics";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

type CalendarTarget = {
  key: string;
  label: string;
  hint: string;
  mark: string;
};

const CALENDAR_TARGETS: CalendarTarget[] = [
  { key: "google", label: "Google Calendar", hint: "Buka di browser", mark: "G" },
  { key: "outlook", label: "Outlook", hint: "Buka di browser", mark: "O" },
  { key: "apple", label: "Apple Calendar", hint: "Unduh file .ics", mark: "i" },
];

export function WeddingAcara({ hideHeader = false }: WeddingAcaraProps) {
  const { data } = useInvitation();
  const [calendarOpen, setCalendarOpen] = useState(false);
  if (!data) return null;

  const events = [...data.events].sort((a, b) => {
    const at = a.start_time ? new Date(a.start_time).getTime() : 0;
    const bt = b.start_time ? new Date(b.start_time).getTime() : 0;
    return at - bt;
  });
  if (events.length === 0) return null;

  const main = events.find((e) => e.is_main_event) ?? events[0];
  const selected = main;
  const mainTime = safeFormat(main.start_time, "HH.mm");
  const parsedCalendarDate = main.event_date ? new Date(main.event_date) : null;
  const hasValidCalendarDate =
    parsedCalendarDate !== null && !Number.isNaN(parsedCalendarDate.getTime());

  const icsAvailable = Boolean(buildIcs(selected));
  const googleUrl = googleCalendarUrl(selected);
  const outlookUrl = outlookCalendarUrl(selected);

  const handleAppleDownload = () => {
    haptic(8);
    downloadIcs(selected);
    setCalendarOpen(false);
  };

  return (
    <section id="acara" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-12 text-center">
        {!hideHeader ? (
          <WeddingReveal className="wd-section-head">
            <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Acara</h2>
            <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
              Waktu dan tempat rangkaian pernikahan kami.
            </p>
          </WeddingReveal>
        ) : null}

        <WeddingReveal delay={100} className="flex flex-col items-center gap-5">
          <p className="wd-display text-[2.25rem] leading-tight md:text-[3rem]">
            {main.venue_name ?? main.name}
          </p>
          {main.address_full ? (
            <p className="max-w-[28rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
              {main.address_full}
            </p>
          ) : null}

          <div className="mt-3 flex flex-col items-center gap-2">
            {hasValidCalendarDate ? (
              <>
                <span
                  className="wd-display block text-[clamp(4.5rem,20vw,9rem)] leading-[0.85] text-[var(--wd-ink)]"
                  aria-hidden
                >
                  {format(parsedCalendarDate, "d")}
                </span>
                <p className="wd-display text-[1.35rem] tracking-[0.06em] md:text-[1.65rem]">
                  {format(parsedCalendarDate, "EEEE, MMMM yyyy", { locale: localeId })}
                </p>
              </>
            ) : main.event_date ? (
              <p className="wd-display text-[1.75rem] md:text-[2.25rem]">
                {safeFormat(main.event_date, "EEEE, d MMMM yyyy")}
              </p>
            ) : null}
            {mainTime ? <p className="wd-label mt-1">Pukul {mainTime} WITA</p> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {main.gmaps_url ? (
              <a
                href={main.gmaps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--wd-accent)] px-6 text-[12px] font-bold tracking-wide text-[var(--sheet-on-accent)] transition-all duration-200 active:scale-[0.97]"
              >
                <MapPin className="h-4 w-4" />
                Petunjuk Arah
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => {
                haptic(8);
                setCalendarOpen(true);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--wd-line-strong)] px-6 text-[12px] font-bold tracking-wide transition-all duration-200 active:scale-[0.97]"
            >
              <CalendarPlus className="h-4 w-4 text-[var(--wd-accent)]" />
              Simpan Tanggal
            </button>
          </div>
        </WeddingReveal>

        <WeddingReveal delay={150} className="w-full max-w-md">
          <div className="wd-glass flex flex-col px-6 py-7 text-left md:px-8">
            <p className="wd-label mb-3 self-center">Rangkaian Acara</p>
            <ol className="flex flex-col">
              {events.map((event, index) => {
                const time = safeFormat(event.start_time, "HH.mm");
                const date = safeFormat(event.event_date, "d MMM yyyy");
                const prevDate =
                  index > 0 ? safeFormat(events[index - 1].event_date, "d MMM yyyy") : "";
                const showDate = date !== "" && date !== prevDate;
                return (
                  <li
                    key={event.id}
                    className="flex gap-6 border-b border-[var(--wd-line)] py-4 last:border-b-0"
                  >
                    <div className="w-14 shrink-0 sm:w-20">
                      {time ? (
                        <p className="wd-display text-[1.4rem] leading-none md:text-[1.6rem]">
                          {time}
                        </p>
                      ) : null}
                      {showDate ? (
                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--wd-muted)]">
                          {date}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-col items-start gap-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[14px] font-semibold">{event.name}</span>
                        {event.is_main_event ? (
                          <span className="rounded-full border border-[var(--wd-accent-line)] bg-[var(--wd-accent-soft)] px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--wd-ink)]/80">
                            Acara Utama
                          </span>
                        ) : null}
                      </div>
                      {event.venue_name ? (
                        event.gmaps_url ? (
                          <a
                            href={event.gmaps_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => haptic(8)}
                            className="inline-flex items-center gap-1.5 self-start text-[12px] font-medium leading-snug text-[var(--wd-ink)] underline decoration-[var(--wd-accent-line)] underline-offset-[3px] transition-all duration-200 active:scale-[0.98]"
                          >
                            <MapPin className="h-3 w-3 shrink-0 text-[var(--wd-muted)]" aria-hidden />
                            {event.venue_name}
                          </a>
                        ) : (
                          <span className="text-[12px] leading-relaxed text-[var(--wd-muted)]">
                            {event.venue_name}
                          </span>
                        )
                      ) : null}
                      {event.notes ? (
                        <span className="text-[12px] leading-relaxed text-[var(--wd-muted)]">
                          {event.notes}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </WeddingReveal>
      </div>

      <Drawer
        shouldScaleBackground={false}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
      >
        <DrawerContent className="wd-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[1.75rem]">
          <div className="flex flex-col overflow-y-auto px-6 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-2">
            <div className="flex flex-col items-center gap-1 pb-5">
              <DrawerTitle className="text-xl font-light [font-family:var(--font-cormorant),serif]">
                Simpan ke Kalender
              </DrawerTitle>
              <DrawerDescription className="max-w-full truncate text-[11px] uppercase tracking-[0.28em] text-[var(--sheet-muted)]">
                Acara: {selected.name}
              </DrawerDescription>
            </div>

            <div className="flex flex-col gap-2 border-t border-[rgba(244,244,244,0.08)] pt-4">
              {CALENDAR_TARGETS.map((target) => {
                const url =
                  target.key === "google"
                    ? googleUrl
                    : target.key === "outlook"
                      ? outlookUrl
                      : null;
                const available =
                  target.key === "apple" ? icsAvailable : Boolean(url);

                const rowClass = cn(
                  "flex min-h-[60px] w-full items-center gap-4 rounded-2xl border border-[rgba(244,244,244,0.1)] px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] active:bg-white/[0.06]",
                  !available ? "opacity-40" : "",
                );

                const inner = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(244,244,244,0.18)] font-serif text-lg [font-family:var(--font-cormorant),serif] text-[var(--sheet-accent)]">
                      {target.mark}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[14px] font-semibold leading-tight">{target.label}</span>
                      <span className="text-[11px] text-[var(--sheet-muted)]">{target.hint}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--sheet-muted)]" aria-hidden />
                  </>
                );

                return url ? (
                  <a
                    key={target.key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      haptic(8);
                      setCalendarOpen(false);
                    }}
                    className={rowClass}
                  >
                    {inner}
                  </a>
                ) : (
                  <button
                    key={target.key}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      if (target.key === "apple") handleAppleDownload();
                    }}
                    className={rowClass}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
