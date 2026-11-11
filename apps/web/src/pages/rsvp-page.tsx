import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { MAX_PAX, RSVP_LABEL, RSVP_STATUSES, type RsvpRow, type RsvpStatus } from "@wedding/shared";
import { Bell, CalendarCheck, PencilLine } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableBulkActions } from "@/components/data-table/bulk-actions";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { selectColumn } from "@/components/data-table/select-column";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api.js";
import { formatDateTime } from "../lib/datetime.js";
import { eventsQuery, rsvpQuery } from "../lib/queries.js";
import { ReminderDialog } from "./rsvp-reminder-dialog.js";

type StatusKey = RsvpStatus | "belum";

/** Warna per status: titik di kartu ringkasan dan lencana di tabel. */
const STATUS_TONE: Record<StatusKey, { dot: string; badge: string }> = {
  hadir: {
    dot: "bg-emerald-500",
    badge:
      "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  tidak_hadir: {
    dot: "bg-rose-500",
    badge: "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
  ragu: {
    dot: "bg-amber-500",
    badge: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  belum: { dot: "bg-muted-foreground/40", badge: "text-muted-foreground" },
};

function Stat({
  status,
  label,
  value,
  note,
}: {
  status: StatusKey;
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <Card className="gap-0 py-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span aria-hidden className={cn("size-2 rounded-full", STATUS_TONE[status].dot)} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

const STATUS_OPTIONS = [
  { label: RSVP_LABEL.hadir, value: "hadir" },
  { label: RSVP_LABEL.tidak_hadir, value: "tidak_hadir" },
  { label: RSVP_LABEL.ragu, value: "ragu" },
  { label: "Belum menjawab", value: "belum" },
];

const baseColumns: ColumnDef<RsvpRow, unknown>[] = [
  selectColumn<RsvpRow>(),
  {
    id: "nama",
    accessorFn: (row) => row.displayName,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.displayName}
        {row.original.isRombongan && (
          <span className="ms-2 text-xs font-normal text-muted-foreground">rombongan</span>
        )}
      </span>
    ),
  },
  {
    id: "kelompok",
    accessorFn: (row) => row.groupName ?? "—",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kelompok" />,
  },
  {
    id: "status",
    accessorFn: (row) => row.status ?? "belum",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const { status, remindedAt } = row.original;
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="outline" className={STATUS_TONE[status ?? "belum"].badge}>
            {status ? RSVP_LABEL[status] : "Belum menjawab"}
          </Badge>
          {!status && remindedAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bell className="size-3" aria-hidden />
              Diingatkan {formatDateTime(remindedAt)}
            </span>
          )}
        </div>
      );
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    id: "orang",
    accessorFn: (row) => (row.status ? row.pax : 0),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Orang" />,
    cell: ({ row }) => (
      <span className="font-mono">{row.original.status ? row.original.pax : "—"}</span>
    ),
  },
  {
    id: "dijawab",
    accessorFn: (row) => row.submittedAt ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dijawab" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDateTime(row.original.submittedAt)}</span>
    ),
  },
];

export function RsvpPage() {
  const events = useQuery(eventsQuery);
  const rsvpEvents = (events.data ?? []).filter((e) => e.hasRsvp);
  const [eventId, setEventId] = useState("");
  const [reminding, setReminding] = useState<RsvpRow[] | null>(null);
  const [recording, setRecording] = useState<RsvpRow | null>(null);
  const noRsvpEvent = events.isSuccess && rsvpEvents.length === 0;

  const columns: ColumnDef<RsvpRow, unknown>[] = [
    ...baseColumns,
    {
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setRecording(row.original)}>
            <PencilLine aria-hidden />
            Catat jawaban
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const rsvp = useQuery({
    ...rsvpQuery(eventId || undefined),
    enabled: events.isSuccess && rsvpEvents.length > 0,
  });
  const totals = rsvp.data?.totals;

  return (
    <>
      <PageHeader
        title="RSVP"
        description="Jawaban tamu dari halaman undangan mereka. Tamu bisa mengubah jawabannya sampai hari acara."
        actions={
          rsvp.data && rsvp.data.totals.belum > 0 ? (
            <Button onClick={() => setReminding(rsvp.data.items)}>
              Kirim pengingat
              <Bell aria-hidden />
            </Button>
          ) : undefined
        }
      />

      {rsvpEvents.length > 1 && (
        <div role="tablist" aria-label="Acara" className="flex flex-wrap gap-2">
          {rsvpEvents.map((event) => {
            const active = event.id === (eventId || rsvp.data?.event.id);
            return (
              <button
                key={event.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setEventId(event.id)}
                className={buttonVariants({ variant: active ? "default" : "outline", size: "sm" })}
              >
                {event.name}
              </button>
            );
          })}
        </div>
      )}

      {rsvp.data && (
        <ReminderDialog
          open={reminding !== null}
          onClose={() => setReminding(null)}
          eventId={rsvp.data.event.id}
          rows={reminding ?? []}
        />
      )}

      {events.isError && <Alert tone="error">{events.error.message}</Alert>}
      {rsvp.isError && <Alert tone="error">{rsvp.error.message}</Alert>}
      {noRsvpEvent && (
        <Card className="items-center px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted">
            <CalendarCheck className="size-6" aria-hidden />
          </span>
          <div className="max-w-sm space-y-1">
            <p className="font-semibold">Belum ada acara dengan RSVP</p>
            <p className="text-sm text-muted-foreground">
              Buka menu Acara, ubah acara yang perlu konfirmasi kehadiran, lalu nyalakan RSVP.
            </p>
          </div>
          <Link to="/admin/acara" className={buttonVariants()}>
            Buka Acara
          </Link>
        </Card>
      )}

      {totals && rsvp.data && (
        <>
          <p className="text-sm text-muted-foreground">
            {rsvp.data.event.name} · {totals.invited} undangan
          </p>
          <section aria-label="Ringkasan RSVP" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["hadir", "Hadir", totals.hadir, `${totals.hadirPax} orang`],
                ["tidak_hadir", "Tidak hadir", totals.tidakHadir, undefined],
                ["ragu", "Belum pasti", totals.ragu, undefined],
                ["belum", "Belum menjawab", totals.belum, undefined],
              ] as const
            ).map(([status, label, value, note]) => (
              <Stat key={status} status={status} label={label} value={value} note={note} />
            ))}
          </section>

          <DataTable
            columns={columns}
            data={rsvp.data.items}
            getRowId={(row) => row.guestId}
            searchPlaceholder="Cari nama tamu"
            searchKey="nama"
            emptyText="Tidak ada tamu yang cocok."
            filters={[{ columnId: "status", title: "Status", options: STATUS_OPTIONS }]}
            bulkActions={(table) => (
              <DataTableBulkActions table={table} entityName="tamu">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setReminding(table.getFilteredSelectedRowModel().rows.map((r) => r.original))
                  }
                >
                  <Bell aria-hidden />
                  Kirim pengingat
                </Button>
              </DataTableBulkActions>
            )}
          />
          <RecordDialog
            row={recording}
            eventId={rsvp.data.event.id}
            eventName={rsvp.data.event.name}
            onClose={() => setRecording(null)}
          />
        </>
      )}
    </>
  );
}

/** Admin mencatat jawaban atas nama tamu, mis. setelah ditanya lewat telepon. */
function RecordDialog({
  row,
  eventId,
  eventName,
  onClose,
}: {
  row: RsvpRow | null;
  eventId: string;
  eventName: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={row !== null}
      onClose={onClose}
      title={`Catat jawaban: ${row?.displayName ?? ""}`}
      description={`RSVP untuk ${eventName}.`}
    >
      {row && <RecordForm row={row} eventId={eventId} onDone={onClose} />}
    </Dialog>
  );
}

function RecordForm({
  row,
  eventId,
  onDone,
}: {
  row: RsvpRow;
  eventId: string;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RsvpStatus>(row.status ?? "hadir");
  const [pax, setPax] = useState(String(row.pax ?? 1));
  // Jumlah orang hanya berarti untuk tamu rombongan yang hadir; tamu biasa selalu 1 orang.
  const askPax = row.isRombongan && status === "hadir";

  const save = useMutation({
    mutationFn: () =>
      adminApi.rsvps.record({
        guestId: row.guestId,
        eventId,
        status,
        pax: askPax ? Number(pax) : undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rsvp"] }),
        queryClient.invalidateQueries({ queryKey: ["home"] }),
      ]);
      onDone();
    },
  });

  const paxNumber = Number(pax);
  const paxError =
    askPax && (!Number.isInteger(paxNumber) || paxNumber < 1 || paxNumber > MAX_PAX)
      ? `Isi angka 1–${MAX_PAX}.`
      : null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (paxError) return;
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Jawaban" className="grid gap-2 sm:grid-cols-3">
        {RSVP_STATUSES.map((value) => (
          // biome-ignore lint/a11y/useSemanticElements: tombol besar lebih mudah diketuk di HP
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={status === value}
            onClick={() => setStatus(value)}
            className={cn(
              "h-11 rounded-md border px-3 text-sm font-medium transition-colors",
              status === value
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {RSVP_LABEL[value]}
          </button>
        ))}
      </div>
      {askPax && (
        <Field label="Jumlah orang yang hadir" error={paxError}>
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_PAX}
              value={pax}
              onChange={(e) => setPax(e.target.value)}
            />
          )}
        </Field>
      )}
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}
