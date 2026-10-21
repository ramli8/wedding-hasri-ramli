import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatEventDate, type HomeResponse } from "@wedding/shared";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../components/page-header.js";
import { Alert } from "../components/ui/alert.js";
import { Card } from "../components/ui/card.js";
import { formatRupiah } from "../lib/format.js";
import { homeQuery } from "../lib/queries.js";

const WIB_OFFSET_MS = 7 * 3600_000;
const wibDay = (ms: number) => Math.floor((ms + WIB_OFFSET_MS) / 86_400_000);

/** Sisa hari menurut tanggal WIB: 0 = hari ini, negatif = sudah lewat. */
export function daysUntil(iso: string, now = Date.now()) {
  return wibDay(Date.parse(iso)) - wibDay(now);
}

type Task = { key: string; text: string; to: string; urgent?: boolean };

/** Hal yang perlu dikerjakan, hanya yang jumlahnya lebih dari nol. */
export function buildTasks(home: HomeResponse, now = Date.now()): Task[] {
  const eventPassed = home.eventDate ? daysUntil(home.eventDate, now) < 0 : false;
  const tasks: (Task | false)[] = [
    home.guests.total === 0 && {
      key: "no-guests",
      text: "Belum ada tamu. Tambahkan atau impor dari CSV.",
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
      to: "/admin/tamu",
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

function Stat({
  label,
  value,
  note,
  to,
}: {
  label: string;
  value: string;
  note?: string;
  to: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className="flex h-full flex-col gap-1 p-4 transition-colors hover:bg-acid">
        <p className="tag text-ink-soft">{label}</p>
        <p className="font-display text-2xl leading-tight font-bold break-words">{value}</p>
        {note && <p className="text-xs text-ink-soft">{note}</p>}
      </Card>
    </Link>
  );
}

function Countdown({ eventDate }: { eventDate: string | null }) {
  if (!eventDate) {
    return (
      <Card tone="acid" className="flex flex-col gap-1">
        <p className="tag">Hitung mundur</p>
        <p className="font-display text-xl font-bold">Belum ada tanggal acara.</p>
        <Link
          to="/admin/acara"
          className="inline-flex w-fit items-center gap-1 text-sm font-semibold underline"
        >
          Atur di menu Acara <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Card>
    );
  }
  const days = daysUntil(eventDate);
  return (
    <Card tone="acid" className="flex flex-col gap-1">
      <p className="tag">
        {days > 0 ? "Menuju hari-H" : days === 0 ? "Hari ini" : "Acara telah berlalu"}
      </p>
      {days > 0 ? (
        <p className="font-display text-6xl leading-none font-bold tracking-h1">
          {days} <span className="text-2xl tracking-h3 uppercase">hari lagi</span>
        </p>
      ) : (
        <p className="font-display text-4xl leading-none font-bold tracking-h1 uppercase">
          {days === 0 ? "Selamat berbahagia" : `${-days} hari yang lalu`}
        </p>
      )}
      <p className="font-semibold">{formatEventDate(eventDate)}</p>
    </Card>
  );
}

export function HomePage() {
  const home = useQuery(homeQuery);
  const data = home.data;
  const tasks = data ? buildTasks(data) : [];

  return (
    <>
      <PageHeader
        tag="Beranda"
        title="Ringkasan"
        description="Gambaran cepat persiapan, dan yang perlu dikerjakan berikutnya."
      />

      {home.isError && <Alert tone="error">{home.error.message}</Alert>}

      {data && (
        <>
          <Countdown eventDate={data.eventDate} />

          <section aria-label="Perlu dikerjakan" className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-bold tracking-h2 uppercase">
              Perlu dikerjakan
            </h2>
            {tasks.length === 0 ? (
              <Card className="flex items-center gap-3">
                <CheckCircle2 className="size-6 shrink-0" aria-hidden />
                <p>Tidak ada yang mendesak. Semua sudah beres untuk saat ini.</p>
              </Card>
            ) : (
              <ul className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <li key={task.key}>
                    <Link
                      to={task.to}
                      className={`flex min-h-12 items-center justify-between gap-3 border-2 border-ink px-4 py-3 shadow-hard-sm hover:bg-acid ${task.urgent ? "bg-paper" : "bg-paper"}`}
                    >
                      <span className="flex items-center gap-3">
                        {task.urgent && (
                          <AlertTriangle
                            className="size-5 shrink-0 text-alert"
                            aria-label="Mendesak"
                          />
                        )}
                        <span className={task.urgent ? "font-semibold" : ""}>{task.text}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Angka penting" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Tamu"
              value={String(data.guests.total)}
              note="undangan terdaftar"
              to="/admin/tamu"
            />
            {data.rsvp ? (
              <Stat
                label="RSVP hadir"
                value={`${data.rsvp.hadir} / ${data.rsvp.invited}`}
                note={`${data.rsvp.hadirPax} orang · ${data.rsvp.belum} belum menjawab`}
                to="/admin/rsvp"
              />
            ) : (
              <Stat label="RSVP" value="—" note="belum ada acara dengan RSVP" to="/admin/acara" />
            )}
            {data.checkin ? (
              <Stat
                label="Sudah check-in"
                value={`${data.checkin.arrived} / ${data.checkin.invited}`}
                note={data.checkin.eventName}
                to="/admin/checkin"
              />
            ) : (
              <Stat
                label="Check-in"
                value="—"
                note="belum ada acara dengan check-in"
                to="/admin/acara"
              />
            )}
            <Stat
              label="Hadiah masuk"
              value={formatRupiah(data.gifts.amplopTotal + data.gifts.transferTotal)}
              note={`${data.gifts.count} catatan · ${data.gifts.barangCount} barang`}
              to="/admin/hadiah"
            />
          </section>

          <section aria-label="Vendor" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Vendor</h2>
              <Link to="/admin/vendor" className="text-sm font-semibold underline">
                Buka halaman vendor
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat
                label="Vendor terpilih"
                value={`${data.vendors.summary.selectedCount} / ${data.vendors.summary.categoryCount}`}
                note="kategori"
                to="/admin/vendor"
              />
              <Stat
                label="Total kontrak"
                value={formatRupiah(data.vendors.summary.contractTotal)}
                to="/admin/vendor"
              />
              <Stat
                label="Sudah dibayar"
                value={formatRupiah(data.vendors.summary.paidTotal)}
                to="/admin/vendor"
              />
              <Stat
                label="Sisa pembayaran"
                value={formatRupiah(data.vendors.summary.remaining)}
                to="/admin/vendor"
              />
            </div>
            {data.vendors.due.length > 0 && (
              <ul className="flex flex-col border-2 border-ink bg-paper">
                {data.vendors.due.map((vendor) => (
                  <li
                    key={vendor.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-ink p-3 last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{vendor.name}</p>
                      <p className="text-xs text-ink-soft">{vendor.categoryName}</p>
                    </div>
                    <p
                      className={`text-sm ${vendor.state === "terlambat" ? "font-semibold text-alert" : ""}`}
                    >
                      {vendor.state === "terlambat" ? "Terlambat · " : "Jatuh tempo "}
                      {vendor.dueOn}
                      {vendor.dueAmount !== null && ` · ${formatRupiah(vendor.dueAmount)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
