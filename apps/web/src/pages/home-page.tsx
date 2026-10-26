import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatEventDate, type HomeResponse } from "@wedding/shared";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Gift,
  type LucideIcon,
  Receipt,
  ScanLine,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Alert } from "@/components/kit/alert";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRupiah } from "../lib/format.js";
import { useGuideSteps } from "../lib/guide.js";
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
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: string;
  to: string;
  icon: LucideIcon;
}) {
  return (
    <Link to={to} className="block">
      <Card className="h-full gap-0 py-6 transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold break-words">{value}</div>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

/** Grafik batang satu seri, bergaya Overview di dasbor shadcn-admin. */
function BarsChart({ data, money }: { data: { name: string; total: number }[]; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={money ? 72 : 32}
          tickFormatter={(value: number) =>
            money ? `${Math.round(value / 1_000_000)}jt` : String(value)
          }
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          formatter={(value) => (money ? formatRupiah(Number(value)) : String(value))}
          contentStyle={{
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
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
    <Badge variant="secondary" className="h-9 px-3 text-sm">
      {days > 0 ? `${days} hari lagi` : days === 0 ? "Hari ini" : `${-days} hari lalu`}
      <span className="text-muted-foreground">· {formatEventDate(eventDate)}</span>
    </Badge>
  );
}

export function HomePage() {
  const home = useQuery(homeQuery);
  const data = home.data;
  const tasks = data ? buildTasks(data) : [];
  const guide = useGuideSteps();

  const rsvpBars = data?.rsvp
    ? [
        { name: "Hadir", total: data.rsvp.hadir },
        { name: "Tidak hadir", total: data.rsvp.tidakHadir },
        { name: "Ragu", total: data.rsvp.ragu },
        { name: "Belum", total: data.rsvp.belum },
      ]
    : [];
  const vendorBars = data
    ? [
        { name: "Kontrak", total: data.vendors.summary.contractTotal },
        { name: "Dibayar", total: data.vendors.summary.paidTotal },
        { name: "Sisa", total: data.vendors.summary.remaining },
      ]
    : [];

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Dasbor</h1>
        {data && <Countdown eventDate={data.eventDate} />}
      </div>

      {home.isError && <Alert tone="error">{home.error.message}</Alert>}

      {data && (
        <Tabs defaultValue="ringkasan" className="space-y-4">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
              <TabsTrigger value="tugas">
                Perlu dikerjakan{tasks.length > 0 ? ` (${tasks.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="vendor">Vendor</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ringkasan" className="space-y-4">
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
                    <Link to="/admin/panduan" className={buttonVariants({ variant: "outline" })}>
                      Lihat panduan lengkap
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                icon={Users}
                label="Tamu"
                value={String(data.guests.total)}
                note={`${data.guests.neverSent} belum dikirimi undangan`}
                to="/admin/tamu"
              />
              {data.rsvp ? (
                <Stat
                  icon={CalendarCheck}
                  label="RSVP hadir"
                  value={`${data.rsvp.hadir} / ${data.rsvp.invited}`}
                  note={`${data.rsvp.hadirPax} orang · ${data.rsvp.belum} belum menjawab`}
                  to="/admin/rsvp"
                />
              ) : (
                <Stat
                  icon={CalendarCheck}
                  label="RSVP"
                  value="—"
                  note="belum ada acara dengan RSVP"
                  to="/admin/acara"
                />
              )}
              {data.checkin ? (
                <Stat
                  icon={ScanLine}
                  label="Sudah check-in"
                  value={`${data.checkin.arrived} / ${data.checkin.invited}`}
                  note={data.checkin.eventName}
                  to="/admin/checkin"
                />
              ) : (
                <Stat
                  icon={ScanLine}
                  label="Check-in"
                  value="—"
                  note="belum ada acara dengan check-in"
                  to="/admin/acara"
                />
              )}
              <Stat
                icon={Gift}
                label="Hadiah masuk"
                value={formatRupiah(data.gifts.amplopTotal + data.gifts.transferTotal)}
                note={`${data.gifts.count} catatan · ${data.gifts.barangCount} barang`}
                to="/admin/hadiah"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Jawaban RSVP</CardTitle>
                  <CardDescription>
                    {data.rsvp ? data.rsvp.eventName : "Belum ada acara dengan RSVP."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="ps-2">
                  <BarsChart data={rsvpBars} />
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Perlu dikerjakan</CardTitle>
                  <CardDescription>
                    {tasks.length === 0 ? "Semua sudah beres." : `${tasks.length} hal menunggu.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskList tasks={tasks.slice(0, 5)} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tugas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Perlu dikerjakan</CardTitle>
                <CardDescription>Urut dari yang paling mendesak.</CardDescription>
              </CardHeader>
              <CardContent>
                <TaskList tasks={tasks} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendor" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                icon={Store}
                label="Vendor terpilih"
                value={`${data.vendors.summary.selectedCount} / ${data.vendors.summary.categoryCount}`}
                note="kategori"
                to="/admin/vendor"
              />
              <Stat
                icon={Receipt}
                label="Total kontrak"
                value={formatRupiah(data.vendors.summary.contractTotal)}
                to="/admin/vendor"
              />
              <Stat
                icon={CircleDollarSign}
                label="Sudah dibayar"
                value={formatRupiah(data.vendors.summary.paidTotal)}
                to="/admin/vendor"
              />
              <Stat
                icon={Wallet}
                label="Sisa pembayaran"
                value={formatRupiah(data.vendors.summary.remaining)}
                to="/admin/vendor"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Pembayaran vendor</CardTitle>
                  <CardDescription>Kontrak, yang sudah dibayar, dan sisanya.</CardDescription>
                </CardHeader>
                <CardContent className="ps-2">
                  <BarsChart data={vendorBars} money />
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Jatuh tempo</CardTitle>
                  <CardDescription>
                    Vendor terpilih yang segera atau sudah terlambat.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.vendors.due.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada pembayaran mendesak.</p>
                  ) : (
                    <ul className="space-y-6">
                      {data.vendors.due.map((vendor) => (
                        <li key={vendor.id} className="flex items-center gap-4">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm leading-none font-medium">{vendor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {vendor.categoryName} · {vendor.dueOn}
                            </p>
                          </div>
                          <div className="text-end">
                            {vendor.dueAmount !== null && (
                              <p className="font-medium">{formatRupiah(vendor.dueAmount)}</p>
                            )}
                            <Badge
                              variant={vendor.state === "terlambat" ? "destructive" : "secondary"}
                            >
                              {vendor.state === "terlambat" ? "Terlambat" : "Segera"}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

/** Daftar tugas bergaya "Recent Sales": ikon di kiri, teks, panah di kanan. */
function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CheckCircle2 className="size-5 shrink-0" aria-hidden />
        Tidak ada yang mendesak.
      </div>
    );
  }
  return (
    <ul className="space-y-6">
      {tasks.map((task) => (
        <li key={task.key}>
          <Link to={task.to} className="flex items-center gap-4 hover:opacity-80">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
              {task.urgent ? (
                <AlertTriangle className="size-4 text-destructive" aria-label="Mendesak" />
              ) : (
                <ArrowRight className="size-4" aria-hidden />
              )}
            </span>
            <span className={`flex-1 text-sm ${task.urgent ? "font-medium" : ""}`}>
              {task.text}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
