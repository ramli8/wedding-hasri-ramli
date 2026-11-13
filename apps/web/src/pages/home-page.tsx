import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatEventDate, type HomeResponse } from "@wedding/shared";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarHeart,
  CheckCircle2,
  type LucideIcon,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "@/components/kit/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRupiah } from "../lib/format.js";
import { useGuideSteps } from "../lib/guide.js";
import { homeQuery } from "../lib/queries.js";

const WIB_OFFSET_MS = 7 * 3600_000;
const wibDay = (ms: number) => Math.floor((ms + WIB_OFFSET_MS) / 86_400_000);

/** Sisa hari menurut tanggal WIB: 0 = hari ini, negatif = sudah lewat. */
export function daysUntil(iso: string, now = Date.now()) {
  return wibDay(Date.parse(iso)) - wibDay(now);
}

type Task = {
  key: string;
  text: string;
  to: string;
  /** Parameter URL tambahan, mis. `{ kirim: "antre" }` membuka antrean kirim undangan. */
  search?: Record<string, string>;
  urgent?: boolean;
};

/** Hal yang perlu dikerjakan, hanya yang jumlahnya lebih dari nol. */
export function buildTasks(home: HomeResponse, now = Date.now()): Task[] {
  const eventPassed = home.eventDate ? daysUntil(home.eventDate, now) < 0 : false;
  const tasks: (Task | false)[] = [
    home.guests.total === 0 && {
      key: "no-guests",
      text: "Belum ada tamu. Tambahkan atau impor dari Excel.",
      to: "/admin/tamu",
    },
    home.vendors.summary.overdueCount > 0 && {
      key: "overdue",
      text: `${home.vendors.summary.overdueCount} pembayaran vendor terlambat`,
      to: "/admin/vendor",
      urgent: true,
    },
    (home.checkin?.needsReview ?? 0) > 0 && {
      key: "review",
      text: `${home.checkin?.needsReview} duplikat check-in perlu diperiksa`,
      to: "/admin/checkin",
      urgent: true,
    },
    home.guests.neverSent > 0 && {
      key: "unsent",
      text: `${home.guests.neverSent} tamu belum dikirimi undangan`,
      // Daftar tamu hanya bisa menyaring "belum dikirim" per acara, sedangkan angka ini lintas
      // acara; jadi langsung buka antrean kirim beruntun.
      to: "/admin/tamu",
      search: { kirim: "antre" },
    },
    (home.rsvp?.belum ?? 0) > 0 && {
      key: "rsvp",
      text: `${home.rsvp?.belum} tamu belum menjawab RSVP`,
      to: "/admin/rsvp",
    },
    home.vendors.summary.dueSoonCount > 0 && {
      key: "due-soon",
      text: `${home.vendors.summary.dueSoonCount} pembayaran vendor segera jatuh tempo`,
      to: "/admin/vendor",
    },
    home.guestbookUnreplied > 0 && {
      key: "guestbook",
      text: `${home.guestbookUnreplied} ucapan belum dibalas`,
      to: "/admin/undangan/ucapan",
    },
    !home.coupleFilled && {
      key: "couple",
      text: "Profil mempelai di undangan belum lengkap",
      to: "/admin/undangan/mempelai",
    },
    eventPassed &&
      home.gifts.notThanked > 0 && {
        key: "thanks",
        text: `${home.gifts.notThanked} hadiah belum dibalas ucapan terima kasih`,
        to: "/admin/hadiah",
      },
  ];
  return tasks.filter((task): task is Task => task !== false);
}

type Phase = "persiapan" | "hari-h" | "selesai";

/** Tahap acara menurut tanggal WIB: menentukan urutan bagian di Beranda. */
export function phaseOf(eventDate: string | null, now = Date.now()): Phase {
  if (!eventDate) return "persiapan";
  const days = daysUntil(eventDate, now);
  return days > 0 ? "persiapan" : days === 0 ? "hari-h" : "selesai";
}

/** Satu angka di dalam kotak bagian; seluruh baris membuka halamannya. */
function Metric({
  label,
  value,
  note,
  to,
  progress,
}: {
  label: string;
  value: string;
  note?: string;
  to: string;
  /** 0–1: bilah kemajuan di bawah angka (mis. check-in, pembayaran vendor). */
  progress?: number;
}) {
  return (
    <Link
      to={to}
      className="group -mx-3 flex flex-col gap-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60"
    >
      <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        {label}
        <ArrowRight
          className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </span>
      <span className="text-2xl font-bold tracking-tight break-words tabular-nums">{value}</span>
      {progress !== undefined && (
        <span className="h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
          />
        </span>
      )}
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </Link>
  );
}

function Section({
  title,
  icon: Icon,
  live,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  live?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-2", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </CardTitle>
        {live && (
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden />
            Langsung
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">{children}</CardContent>
    </Card>
  );
}

/** Persentase aman dari pembagian nol. */
const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

function GuestsSection({ data }: { data: HomeResponse }) {
  return (
    <Section title="Tamu & RSVP" icon={Users}>
      <Metric
        label="Tamu"
        value={String(data.guests.total)}
        note={`${data.guests.neverSent} belum dikirimi undangan`}
        progress={ratio(data.guests.total - data.guests.neverSent, data.guests.total)}
        to="/admin/tamu"
      />
      {data.rsvp ? (
        <Metric
          label="RSVP hadir"
          value={`${data.rsvp.hadir} / ${data.rsvp.invited}`}
          note={`${data.rsvp.hadirPax} orang · ${data.rsvp.tidakHadir} tidak hadir · ${data.rsvp.belum} belum menjawab`}
          to="/admin/rsvp"
        />
      ) : (
        <Metric label="RSVP" value="—" note="belum ada acara dengan RSVP" to="/admin/acara" />
      )}
      <Metric
        label="Ucapan belum dibalas"
        value={String(data.guestbookUnreplied)}
        to="/admin/undangan/ucapan"
      />
    </Section>
  );
}

function DaySection({ data, live }: { data: HomeResponse; live: boolean }) {
  const goods = data.buwuh.goods
    .slice(0, 2)
    .map((g) => `${g.name} ${g.quantity.toLocaleString("id-ID")}${g.unit ? ` ${g.unit}` : ""}`)
    .join(", ");
  return (
    <Section title="Hari-H" icon={CalendarHeart} live={live}>
      {data.checkin ? (
        <Metric
          label="Sudah check-in"
          value={`${data.checkin.arrived} / ${data.checkin.invited}`}
          note={
            data.checkin.needsReview > 0
              ? `${data.checkin.needsReview} duplikat perlu diperiksa`
              : data.checkin.eventName
          }
          progress={ratio(data.checkin.arrived, data.checkin.invited)}
          to="/admin/checkin"
        />
      ) : (
        <Metric
          label="Check-in"
          value="—"
          note="belum ada acara dengan check-in"
          to="/admin/acara"
        />
      )}
      <Metric
        label="Buwuh"
        value={formatRupiah(data.buwuh.amountTotal)}
        note={[`${data.buwuh.count} pemberi`, goods].filter(Boolean).join(" · ")}
        to="/admin/buwuh"
      />
      <Metric
        label="Perangkat online"
        value={`${data.devices.online} / ${data.devices.active}`}
        note={
          data.devices.pending > 0
            ? `${data.devices.pending} belum dipasang`
            : data.devices.active === 0
              ? "belum ada perangkat"
              : "semua sudah dipasang"
        }
        to="/admin/perangkat"
      />
    </Section>
  );
}

function MoneySection({ data }: { data: HomeResponse }) {
  const v = data.vendors.summary;
  return (
    <Section title="Keuangan" icon={Wallet}>
      <Metric
        label="Hadiah & buwuh masuk"
        value={formatRupiah(
          data.gifts.amplopTotal + data.gifts.transferTotal + data.buwuh.amountTotal,
        )}
        note={`Hadiah ${formatRupiah(data.gifts.amplopTotal + data.gifts.transferTotal)} · Buwuh ${formatRupiah(data.buwuh.amountTotal)}`}
        to="/admin/hadiah"
      />
      <Metric
        label="Vendor dibayar"
        value={formatRupiah(v.paidTotal)}
        note={`dari ${formatRupiah(v.contractTotal)} · sisa ${formatRupiah(v.remaining)} · ${v.selectedCount}/${v.categoryCount} kategori dipesan`}
        progress={ratio(v.paidTotal, v.contractTotal)}
        to="/admin/vendor"
      />
      {data.vendors.due.length > 0 && (
        <ul className="flex flex-col gap-2 py-2.5">
          {data.vendors.due.slice(0, 3).map((vendor) => (
            <li key={vendor.id}>
              <Link
                to="/admin/vendor"
                className="flex items-center justify-between gap-3 text-sm hover:opacity-80"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{vendor.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {vendor.categoryName} · lunas {vendor.dueOn}
                  </span>
                </span>
                <Badge variant={vendor.state === "terlambat" ? "destructive" : "secondary"}>
                  {vendor.state === "terlambat" ? "Terlambat" : "Segera"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Countdown({ eventDate }: { eventDate: string | null }) {
  if (!eventDate) {
    return (
      <Link to="/admin/acara" className="text-sm text-muted-foreground underline">
        Atur tanggal acara
      </Link>
    );
  }
  const days = daysUntil(eventDate);
  return (
    <span className="text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">
        {days > 0 ? `H-${days}` : days === 0 ? "Hari ini" : `${-days} hari lalu`}
      </span>{" "}
      · {formatEventDate(eventDate)}
    </span>
  );
}

/**
 * Beranda satu halaman tanpa tab: "Perlu dikerjakan" di atas, lalu tiga bagian (Tamu & RSVP,
 * Hari-H, Keuangan). Urutannya mengikuti tahap acara: di hari-H bagian Hari-H naik ke atas dan
 * data diperbarui tiap 10 detik; sesudah acara Keuangan didahulukan.
 */
export function HomePage() {
  // Di hari-H angka check-in dan buwuh berubah terus: perbarui lebih sering.
  const home = useQuery({
    ...homeQuery,
    refetchInterval: (query) =>
      phaseOf(query.state.data?.eventDate ?? null) === "hari-h" ? 10_000 : 30_000,
  });
  const data = home.data;
  const phase = phaseOf(data?.eventDate ?? null);
  const tasks = data ? buildTasks(data) : [];
  const guide = useGuideSteps();

  const sections = data
    ? {
        tamu: <GuestsSection key="tamu" data={data} />,
        hari: <DaySection key="hari" data={data} live={phase === "hari-h"} />,
        uang: <MoneySection key="uang" data={data} />,
      }
    : null;
  const order =
    phase === "hari-h"
      ? (["hari", "tamu", "uang"] as const)
      : phase === "selesai"
        ? (["uang", "hari", "tamu"] as const)
        : (["tamu", "hari", "uang"] as const);

  return (
    <>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beranda</h1>
          {data && <Countdown eventDate={data.eventDate} />}
        </div>
        <Link to="/admin/panduan" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <BookOpen aria-hidden />
          Panduan
        </Link>
      </div>

      {home.isError && <Alert tone="error">{home.error.message}</Alert>}

      {data && sections && (
        <div className="flex flex-col gap-4">
          {guide.ready && guide.next && (
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>
                  Mulai cepat · {guide.doneCount} dari {guide.total} langkah
                </CardTitle>
                <CardDescription>
                  Berikutnya: {guide.next.title}. {guide.next.why}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.round((guide.doneCount / guide.total) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={guide.next.to as "/admin"} className={buttonVariants()}>
                    {guide.next.cta}
                    <ArrowRight aria-hidden />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-base">
                Perlu dikerjakan{tasks.length > 0 ? ` (${tasks.length})` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList tasks={tasks} />
            </CardContent>
          </Card>

          <div className="grid items-start gap-4 lg:grid-cols-3">
            {order.map((key) => sections[key])}
          </div>
        </div>
      )}
    </>
  );
}

/** Daftar tugas: ikon di kiri (segitiga merah = mendesak), teks, membuka halamannya. */
function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
        Semua sudah beres.
      </div>
    );
  }
  return (
    <ul className="grid gap-1 sm:grid-cols-2">
      {tasks.map((task) => (
        <li key={task.key}>
          <Link
            to={task.to}
            search={task.search as never}
            className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/60"
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                task.urgent ? "bg-destructive/10" : "bg-muted",
              )}
            >
              {task.urgent ? (
                <AlertTriangle className="size-4 text-destructive" aria-label="Mendesak" />
              ) : (
                <ArrowRight className="size-4" aria-hidden />
              )}
            </span>
            <span className={cn("flex-1 text-sm", task.urgent && "font-medium")}>{task.text}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
