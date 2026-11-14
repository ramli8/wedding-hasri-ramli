import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Dashboard, ReviewItem } from "@wedding/shared";
import { ChefHat, Copy, ExternalLink, KeyRound, SquarePen, Star, Undo2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { toast } from "@/components/kit/toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "../lib/admin-api.js";
import {
  dashboardQuery,
  layarQuery,
  logQuery,
  reviewQuery,
  settingsQuery,
  useRefresh,
  vipQuery,
} from "../lib/queries.js";
import { formatAgo, formatClock } from "../lib/scan/format.js";

const METHOD = {
  qr: "QR",
  code: "Kode",
  search: "Cari nama",
  walkin: "Tamu baru",
  admin: "Admin",
} as const;
type Recent = Dashboard["recent"][number];

export function CheckinPage() {
  const dashboard = useQuery(dashboardQuery);
  const review = useQuery(reviewQuery);
  const [correcting, setCorrecting] = useState<Recent | null>(null);
  const [undoing, setUndoing] = useState<Recent | null>(null);

  if (dashboard.isPending) return <p className="text-muted-foreground">Memuat…</p>;
  if (dashboard.isError) {
    return (
      <>
        <PageHeader title="Check-in" />
        <Alert tone="error">{dashboard.error.message}</Alert>
        <div>
          <Link to="/admin/acara" className={buttonVariants({ variant: "outline" })}>
            Buka menu Acara
          </Link>
        </div>
      </>
    );
  }

  const d = dashboard.data;
  const items = review.data ?? [];

  const recentColumns: ColumnDef<Recent, unknown>[] = [
    {
      id: "jam",
      accessorFn: (row) => row.scannedAt,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jam" />,
      cell: ({ row }) => <span className="font-mono">{formatClock(row.original.scannedAt)}</span>,
    },
    {
      id: "tamu",
      accessorFn: (row) => row.displayName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tamu" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div>
            <span className="flex flex-wrap items-center gap-2 font-semibold">
              {r.displayName}
              {r.isVip && <Badge variant="default">VIP</Badge>}
              {r.hasDuplicates && <Badge variant="outline">Duplikat</Badge>}
              {r.outsideSession && <Badge variant="outline">Luar sesi</Badge>}
            </span>
            {r.groupName && <span className="text-xs text-muted-foreground">{r.groupName}</span>}
          </div>
        );
      },
    },
    {
      id: "orang",
      accessorFn: (row) => row.pax,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Orang" />,
      cell: ({ row }) => <span className="font-mono">{row.original.pax}</span>,
    },
    {
      id: "lewat",
      accessorFn: (row) => row.deviceName ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lewat" />,
      cell: ({ row }) => (
        <>
          {row.original.deviceName ?? "—"}
          {row.original.method && (
            <span className="text-xs text-muted-foreground"> · {METHOD[row.original.method]}</span>
          )}
        </>
      ),
    },
    {
      id: "aksi",
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            {
              label: "Ubah jumlah",
              icon: <SquarePen />,
              onSelect: () => setCorrecting(row.original),
            },
            "separator",
            {
              label: "Batalkan",
              icon: <Undo2 />,
              destructive: true,
              onSelect: () => setUndoing(row.original),
            },
          ]}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
  const groupColumns: ColumnDef<Dashboard["groups"][number], unknown>[] = [
    {
      id: "kelompok",
      accessorFn: (group) => group.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kelompok" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-semibold">
          {row.original.name}
          {row.original.isVip && <Badge variant="default">VIP</Badge>}
        </span>
      ),
    },
    {
      id: "masuk",
      accessorFn: (group) => group.arrived,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Masuk" />,
      cell: ({ row }) => (
        <span className="font-mono">
          {row.original.arrived} / {row.original.invited}
        </span>
      ),
    },
    {
      id: "orang",
      accessorFn: (group) => group.pax,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Orang" />,
      cell: ({ row }) => <span className="font-mono">{row.original.pax}</span>,
    },
  ];
  const deviceColumns: ColumnDef<Dashboard["devices"][number], unknown>[] = [
    {
      id: "nama",
      accessorFn: (device) => device.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Perangkat" />,
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      id: "sinkron",
      accessorFn: (device) => device.lastSyncAt ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Terakhir sinkron" />,
      cell: ({ row }) => {
        const device = row.original;
        const stale = !device.lastSyncAt || Date.now() - Date.parse(device.lastSyncAt) > 60_000;
        return (
          <>
            {device.lastSyncAt ? formatAgo(Date.parse(device.lastSyncAt)) : "belum pernah"}
            {stale && (
              <Badge variant="default" className="ms-2">
                Lama
              </Badge>
            )}
          </>
        );
      },
    },
    {
      id: "antrean",
      accessorFn: (device) => device.pendingOutbox,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Antrean" />,
      cell: ({ row }) => (
        <>
          {row.original.pendingOutbox}
          {row.original.pendingOutbox > 0 && (
            <Badge variant="outline" className="ms-2">
              menunggu
            </Badge>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Check-in"
        description={`${d.event.name}. Disegarkan otomatis tiap 5 detik.`}
        actions={
          <>
            <PortionsButton />
            <VipLinkMenu />
          </>
        }
      />

      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Undangan masuk" value={`${d.totals.arrived}`} of={`/ ${d.totals.invited}`} />
        <Stat
          label="Orang hadir"
          value={`${d.totals.arrivedPax}`}
          of={d.totals.rsvpPax === null ? "orang" : `/ ${d.totals.rsvpPax} RSVP hadir`}
        />
        <Stat label="Kartu souvenir" value={`${d.totals.arrivedPax}`} of="terbagi" />
        <Stat
          label="Perlu diperiksa"
          value={`${d.totals.needsReview}`}
          of="duplikat"
          highlight={d.totals.needsReview > 0}
        />
      </section>
      {(d.totals.walkins > 0 || d.totals.outsideSession > 0) && (
        <p className="text-sm text-muted-foreground">
          {d.totals.walkins > 0 && `${d.totals.walkins} tamu baru (walk-in). `}
          {d.totals.outsideSession > 0 &&
            `${d.totals.outsideSession} masuk di luar jam sesi kelompoknya (hanya catatan).`}
        </p>
      )}

      {items.length > 0 && <ReviewSection items={items} />}

      <Tabs defaultValue="terbaru" className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="terbaru">Masuk terbaru</TabsTrigger>
            <TabsTrigger value="kelompok">Per kelompok</TabsTrigger>
            <TabsTrigger value="perangkat">Perangkat</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat lengkap</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="terbaru">
          <DataTable
            columns={recentColumns}
            data={d.recent}
            getRowId={(row) => row.checkinId}
            searchPlaceholder="Cari tamu"
            searchKey="tamu"
            emptyText="Belum ada yang masuk."
          />
        </TabsContent>

        <TabsContent value="kelompok">
          <DataTable
            columns={groupColumns}
            data={d.groups}
            getRowId={(group) => group.id ?? "none"}
            searchPlaceholder="Cari kelompok"
            searchKey="kelompok"
          />
        </TabsContent>

        <TabsContent value="perangkat">
          <DataTable
            columns={deviceColumns}
            data={d.devices.filter((device) => device.status === "active")}
            getRowId={(device) => device.id}
            hideToolbar
            emptyText="Belum ada perangkat aktif."
          />
        </TabsContent>

        <TabsContent value="riwayat">
          <LogSection />
        </TabsContent>
      </Tabs>

      <PaxDialog row={correcting} onClose={() => setCorrecting(null)} />
      <UndoDialog row={undoing} onClose={() => setUndoing(null)} />
    </>
  );
}

function Stat({
  label,
  value,
  of,
  highlight,
}: {
  label: string;
  value: string;
  of: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`${highlight ? "bg-accent " : ""}flex flex-col gap-2 p-4`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-mono text-4xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{of}</p>
    </Card>
  );
}

type Resolving = { item: ReviewItem; resolution: "keep_first" | "merge_pax" };

/** Jumlah orang yang dihitung bila duplikat digabung: semua check-in dijumlahkan. */
const mergedPax = (item: ReviewItem) =>
  item.duplicates.reduce((sum, dup) => sum + dup.pax, item.primary.pax);

function ReviewSection({ items }: { items: ReviewItem[] }) {
  const refresh = useRefresh();
  const [confirming, setConfirming] = useState<Resolving | null>(null);
  const resolve = useMutation({
    mutationFn: (input: {
      guestId: string;
      eventId: string;
      resolution: "keep_first" | "merge_pax";
    }) => adminApi.checkins.resolve(input),
    onSuccess: async () => {
      await refresh("checkin");
      setConfirming(null);
    },
  });

  const target = confirming?.item;
  const merge = confirming?.resolution === "merge_pax";

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Perlu diperiksa</h2>
      <p className="text-muted-foreground">
        Tamu yang tercatat masuk lebih dari sekali (biasanya dua gerbang menerima tamu yang sama
        saat offline). Yang paling awal dihitung; pilih apakah sisanya diabaikan atau jumlahnya
        digabung.
      </p>
      {items.map((item) => (
        <Card key={item.guestId} className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xl font-bold">{item.displayName}</p>
            <p className="text-xs">{item.groupName ?? "Tanpa kelompok"}</p>
          </div>
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <b>Dihitung:</b> {formatClock(item.primary.scannedAt)} · {item.primary.pax} orang ·{" "}
              {item.primary.deviceName ?? "—"}
            </li>
            {item.duplicates.map((dup) => (
              <li key={dup.id}>
                <b>Duplikat:</b> {formatClock(dup.scannedAt)} · {dup.pax} orang ·{" "}
                {dup.deviceName ?? "—"}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming({ item, resolution: "keep_first" })}
            >
              Abaikan duplikat → {item.primary.pax} orang
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming({ item, resolution: "merge_pax" })}
            >
              Gabungkan → {mergedPax(item)} orang
            </Button>
          </div>
        </Card>
      ))}

      <Dialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={merge ? "Gabungkan jumlah orang?" : "Abaikan duplikat?"}
      >
        {target && (
          <>
            <p>
              {merge
                ? `Semua check-in ${target.displayName} dijumlahkan: dihitung ${mergedPax(target)} orang.`
                : `Hanya check-in paling awal ${target.displayName} yang dihitung: ${target.primary.pax} orang. Duplikatnya tetap tersimpan di riwayat.`}
            </p>
            {resolve.error && <Alert tone="error">{resolve.error.message}</Alert>}
            <DialogActions>
              <Button variant="outline" onClick={() => setConfirming(null)}>
                Kembali
              </Button>
              <Button
                disabled={resolve.isPending}
                onClick={() =>
                  resolve.mutate({
                    guestId: target.guestId,
                    eventId: target.eventId,
                    resolution: confirming.resolution,
                  })
                }
              >
                {merge ? `Gabungkan jadi ${mergedPax(target)} orang` : "Abaikan duplikat"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </section>
  );
}

const LOG_KIND = { checkin: "Masuk", undo: "Dibatalkan", set_pax: "Ubah jumlah" } as const;
type LogEntry = NonNullable<ReturnType<typeof useLogEntries>["data"]>["items"][number];

function useLogEntries(page: number) {
  return useQuery(logQuery(page));
}

const logColumns: ColumnDef<LogEntry, unknown>[] = [
  {
    id: "jam",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jam" />,
    cell: ({ row }) => <span className="font-mono">{formatClock(row.original.scannedAt)}</span>,
    enableSorting: false,
  },
  {
    id: "kejadian",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kejadian" />,
    cell: ({ row }) => (
      <>
        {LOG_KIND[row.original.kind]}
        {row.original.outsideSession && (
          <span className="text-xs text-muted-foreground"> · luar sesi</span>
        )}
      </>
    ),
    enableSorting: false,
  },
  {
    id: "tamu",
    accessorFn: (entry) => entry.displayName,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tamu" />,
    enableSorting: false,
  },
  {
    id: "orang",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Orang" />,
    cell: ({ row }) => <span className="font-mono">{row.original.pax ?? "—"}</span>,
    enableSorting: false,
  },
  {
    id: "oleh",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Oleh" />,
    cell: ({ row }) => (row.original.byAdmin ? "Admin" : (row.original.deviceName ?? "—")),
    enableSorting: false,
  },
];

function LogSection() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 30 });
  const log = useLogEntries(pagination.pageIndex + 1);
  return (
    <DataTable
      columns={logColumns}
      data={log.data?.items ?? []}
      hideToolbar
      emptyText={log.isPending ? "Memuat…" : "Belum ada riwayat."}
      options={{
        manualPagination: true,
        pageCount: Math.max(1, Math.ceil((log.data?.total ?? 0) / 30)),
        state: { pagination },
        onPaginationChange: setPagination,
      }}
    />
  );
}

function PaxDialog({ row, onClose }: { row: Recent | null; onClose: () => void }) {
  return (
    <Dialog open={row !== null} onClose={onClose} title={`Ubah jumlah: ${row?.displayName ?? ""}`}>
      {/* Formulir dibuat ulang per baris supaya isiannya selalu angka baris itu, bukan sisa
          baris yang dibuka sebelumnya. */}
      {row && <PaxForm key={row.checkinId} row={row} onClose={onClose} />}
    </Dialog>
  );
}

function PaxForm({ row, onClose }: { row: Recent; onClose: () => void }) {
  const refresh = useRefresh();
  const [pax, setPax] = useState(String(row.pax));
  const save = useMutation({
    mutationFn: (input: { id: string; pax: number }) =>
      adminApi.checkins.setPax(input.id, input.pax),
    onSuccess: async () => {
      await refresh("checkin");
      onClose();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate({ id: row.checkinId, pax: Number(pax) });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        label="Jumlah orang yang masuk"
        hint="Admin bisa mengubah kapan saja, tanpa batas 2 menit."
      >
        {(id) => (
          <Input
            id={id}
            type="number"
            min={1}
            max={500}
            required
            autoFocus
            inputMode="numeric"
            value={pax}
            onChange={(e) => setPax(e.target.value)}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending || !(Number(pax) >= 1)}>
          Simpan
        </Button>
      </DialogActions>
    </form>
  );
}

function UndoDialog({ row, onClose }: { row: Recent | null; onClose: () => void }) {
  const refresh = useRefresh();
  const undo = useMutation({
    mutationFn: (id: string) => adminApi.checkins.undo(id),
    onSuccess: async () => {
      await refresh("checkin");
      onClose();
    },
  });

  return (
    <Dialog
      open={row !== null}
      onClose={onClose}
      title={`Batalkan check-in ${row?.displayName ?? ""}?`}
    >
      {row && (
        <>
          <p>Tamu ini kembali dianggap belum masuk. Riwayatnya tetap tersimpan di log.</p>
          {undo.error && <Alert tone="error">{undo.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={() => undo.mutate(row.checkinId)}
              disabled={undo.isPending}
            >
              Batalkan check-in
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

/** Tautan "Kabar VIP" untuk HP keluarga: berbunyi saat tamu VIP datang. */
function VipLinkMenu() {
  const refresh = useRefresh();
  const vip = useQuery(vipQuery);
  const settings = useQuery(settingsQuery);
  const base = settings.data?.publicBaseUrl?.replace(/\/+$/, "") || window.location.origin;
  const link = vip.data ? `${base}/vip/${vip.data.token}` : null;
  const resetToken = useMutation({
    mutationFn: () => adminApi.vip.resetToken(),
    meta: { toast: "Tautan baru dibuat; tautan lama tidak berlaku" },
    onSuccess: () => refresh("vip"),
  });

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast("Tautan Kabar VIP disalin");
    } catch {
      toast("Gagal menyalin; salin manual saja", "error");
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!link}>
          <Star aria-hidden />
          Kabar VIP
          {vip.data && vip.data.vipCount > 0 && (
            <span className="text-muted-foreground tabular-nums">
              {vip.data.arrivedCount}/{vip.data.vipCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => void copy()}>
          <Copy />
          Salin tautan
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={link ?? "#"} target="_blank" rel="noopener">
            <ExternalLink />
            Buka
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => resetToken.mutate()}>
          <KeyRound />
          Ganti tautan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Porsi makanan yang sudah siap (kabar dari dapur), ditampilkan di layar mode Dapur. */
function PortionsButton() {
  const portions = useQuery(layarQuery);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={!portions.data}>
        <ChefHat aria-hidden />
        Porsi siap
        <span className="text-muted-foreground tabular-nums">
          {portions.data?.portionsReady.toLocaleString("id-ID") ?? "–"}
        </span>
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Porsi siap">
        {open && portions.data && (
          <PortionsForm current={portions.data.portionsReady} onClose={() => setOpen(false)} />
        )}
      </Dialog>
    </>
  );
}

function PortionsForm({ current, onClose }: { current: number; onClose: () => void }) {
  const refresh = useRefresh();
  const [value, setValue] = useState(String(current));
  const save = useMutation({
    mutationFn: (portionsReady: number) => adminApi.layar.savePortions({ portionsReady }),
    onSuccess: async () => {
      await refresh("layar");
      onClose();
    },
  });
  const number = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(number) && number >= 0;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (valid) save.mutate(number);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Jumlah porsi">
        {(id) => (
          <Input
            id={id}
            type="number"
            min={0}
            max={100000}
            required
            autoFocus
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending || !valid}>
          Simpan
        </Button>
      </DialogActions>
    </form>
  );
}
