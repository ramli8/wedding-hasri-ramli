import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { RSVP_LABEL, type RsvpRow } from "@wedding/shared";
import { Bell } from "lucide-react";
import { useState } from "react";
import { DataTableBulkActions } from "@/components/data-table/bulk-actions";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { selectColumn } from "@/components/data-table/select-column";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Select } from "@/components/kit/select";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "../lib/datetime.js";
import { eventsQuery, rsvpQuery } from "../lib/queries.js";
import { ReminderDialog } from "./rsvp-reminder-dialog.js";

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <Card className="gap-0 py-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
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

const columns: ColumnDef<RsvpRow, unknown>[] = [
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
    cell: ({ row }) =>
      row.original.status ? (
        <Badge variant={row.original.status === "hadir" ? "secondary" : "outline"}>
          {RSVP_LABEL[row.original.status]}
        </Badge>
      ) : (
        <span className="text-muted-foreground">Belum menjawab</span>
      ),
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

  const rsvp = useQuery({ ...rsvpQuery(eventId || undefined), enabled: events.isSuccess });
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
        <div className="max-w-xs">
          <Select
            compact
            aria-label="Acara"
            value={eventId || rsvp.data?.event.id || ""}
            onChange={(e) => setEventId(e.target.value)}
          >
            {rsvpEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
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

      {rsvp.isError && <Alert tone="error">{rsvp.error.message}</Alert>}

      {totals && rsvp.data && (
        <>
          <p className="text-sm text-muted-foreground">
            {rsvp.data.event.name} · {totals.invited} undangan
          </p>
          <section aria-label="Ringkasan RSVP" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Hadir" value={totals.hadir} note={`${totals.hadirPax} orang`} />
            <Stat label="Tidak hadir" value={totals.tidakHadir} />
            <Stat label="Belum pasti" value={totals.ragu} />
            <Stat label="Belum menjawab" value={totals.belum} />
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
        </>
      )}
    </>
  );
}
