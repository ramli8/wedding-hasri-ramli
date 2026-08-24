"use client";

import { useMemo } from "react";
import { CalendarPlus, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import type { InvitationEvent } from "@/src/domain/services/invitation.service";
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

function buildMonthCells(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: startWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

const WEEKDAY_LABELS = (() => {
  const base = new Date(2023, 0, 1);
  return Array.from({ length: 7 }, (_, index) =>
    format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + index), "EEEEE", {
      locale: localeId,
    }),
  );
})();

function googleCalendarUrl(event: InvitationEvent): string | null {
  const base = event.start_time ?? event.event_date;
  if (!base) return null;
  const startDate = new Date(base);
  if (Number.isNaN(startDate.getTime())) return null;
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const stamp = (value: Date) => value.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${stamp(startDate)}/${stamp(endDate)}`,
  });
  if (event.venue_name) params.set("location", event.venue_name);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function MonthCalendar({ date }: { date: Date }) {
  const cells = useMemo(() => buildMonthCells(date), [date]);
  const highlight = date.getDate();

  return (
    <div className="mx-auto w-full max-w-[20rem]">
      <p className="wd-display mb-4 text-center text-[1.25rem] tracking-[0.08em]">
        {format(date, "MMMM yyyy", { locale: localeId })}
      </p>
      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="text-[10px] font-semibold uppercase tracking-widest text-[var(--wd-muted)]"
          >
            {label}
          </span>
        ))}
        {cells.map((cell, index) =>
          cell ? (
            <span
              key={cell.toISOString()}
              className={
                cell.getDate() === highlight
                  ? "mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--wd-accent)] text-[12px] font-bold text-[#141413]"
                  : "mx-auto flex h-8 w-8 items-center justify-center text-[12px] text-[var(--wd-ink)]/70"
              }
            >
              {cell.getDate()}
            </span>
          ) : (
            <span key={`empty-${index}`} aria-hidden />
          ),
        )}
      </div>
    </div>
  );
}

export function WeddingAcara({ hideHeader = false }: WeddingAcaraProps) {
  const { data } = useInvitation();
  if (!data) return null;

  const events = [...data.events].sort((a, b) => {
    const at = a.start_time ? new Date(a.start_time).getTime() : 0;
    const bt = b.start_time ? new Date(b.start_time).getTime() : 0;
    return at - bt;
  });
  if (events.length === 0) return null;

  const main = events.find((e) => e.is_main_event) ?? events[0];
  const mainDate = safeFormat(main.event_date, "EEEE, d MMMM yyyy");
  const mainTime = safeFormat(main.start_time, "HH.mm");
  const parsedCalendarDate = main.event_date ? new Date(main.event_date) : null;
  const hasValidCalendarDate =
    parsedCalendarDate !== null && !Number.isNaN(parsedCalendarDate.getTime());
  const calendarUrl = googleCalendarUrl(main);

  return (
    <section id="acara" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center">
        {!hideHeader ? (
          <WeddingReveal className="wd-section-head">
            <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
              Hari yang Dinanti
            </p>
            <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Acara</h2>
          </WeddingReveal>
        ) : null}

        <div className="grid w-full gap-8 md:grid-cols-2 md:items-start md:gap-12">
          <WeddingReveal delay={100}>
            <div className="wd-card flex flex-col items-center gap-4 border border-[var(--wd-line)] px-7 py-9 text-center md:px-8 md:py-12">
              <p className="wd-display text-[2rem] text-[var(--wd-card-ink)] md:text-[2.5rem]">
                {main.venue_name ?? main.name}
              </p>
              {main.address_full ? (
                <p className="max-w-[26rem] text-[13px] leading-relaxed text-[var(--wd-card-ink)]/70">
                  {main.address_full}
                </p>
              ) : null}
              <div className="mt-2 flex flex-col items-center gap-0.5">
                {mainDate ? (
                  <p className="wd-display text-[1.75rem] text-[var(--wd-card-ink)] md:text-[2.25rem]">
                    {mainDate}
                  </p>
                ) : null}
                {mainTime ? (
                  <p className="wd-label text-[var(--wd-card-ink)]/60">
                    Pukul {mainTime} WITA
                  </p>
                ) : null}
              </div>

              {parsedCalendarDate && hasValidCalendarDate ? (
                <WeddingReveal delay={150} className="mt-4 w-full">
                  <MonthCalendar date={parsedCalendarDate} />
                </WeddingReveal>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {main.gmaps_url ? (
                  <a
                    href={main.gmaps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--wd-card-ink)] px-6 text-[12px] font-bold tracking-wide text-[var(--wd-bg)] transition-all duration-200 active:scale-[0.97]"
                  >
                    <MapPin className="h-4 w-4" />
                    Petunjuk Arah
                  </a>
                ) : null}
                {calendarUrl ? (
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--wd-line-strong)] px-6 text-[12px] font-bold tracking-wide text-[var(--wd-card-ink)] transition-all duration-200 active:scale-[0.97]"
                  >
                    <CalendarPlus className="h-4 w-4 text-[var(--wd-accent)]" />
                    Simpan Tanggal
                  </a>
                ) : null}
              </div>
            </div>
          </WeddingReveal>

          <WeddingReveal delay={150}>
            <div className="flex flex-col items-center gap-2 md:items-start">
              <p className="wd-label">Rangkaian Acara</p>
              <ol className="mt-4 flex w-full max-w-[24rem] flex-col text-left md:max-w-none">
                {events.map((event) => {
                  const time = safeFormat(event.start_time, "HH.mm");
                  const date = safeFormat(event.event_date, "d MMM yyyy");
                  return (
                    <li
                      key={event.id}
                      className="flex gap-6 border-b border-[var(--wd-line)] py-5 last:border-b-0"
                    >
                      <div className="w-16 shrink-0 sm:w-20">
                        {time ? (
                          <p className="wd-display text-[1.5rem] leading-none md:text-[1.75rem]">
                            {time}
                          </p>
                        ) : null}
                        {date ? (
                          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--wd-muted)]">
                            {date}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-col gap-1 pt-0.5">
                        <span className="text-[14px] font-semibold">{event.name}</span>
                        {event.venue_name ? (
                          <span className="text-[12px] leading-relaxed text-[var(--wd-muted)]">
                            {event.venue_name}
                          </span>
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
      </div>
    </section>
  );
}
