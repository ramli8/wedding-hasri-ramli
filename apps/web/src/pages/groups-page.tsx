import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { type Event, formatTimeRange, type Group } from "@wedding/shared";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { selectColumn } from "@/components/data-table/select-column";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Checkbox } from "@/components/kit/checkbox";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi } from "../lib/admin-api.js";
import { isoToWibDate, isoToWibTime, wibTimeToIso } from "../lib/datetime.js";
import { eventsQuery, groupsQuery, useRefresh } from "../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; group: Group } | null;

export function GroupsPage() {
  const groups = useQuery(groupsQuery);
  const events = useQuery(eventsQuery);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);

  const eventName = (id: string) => events.data?.find((e) => e.id === id)?.name ?? "Acara";

  const columns: ColumnDef<Group, unknown>[] = [
    selectColumn<Group>(),
    {
      id: "nama",
      accessorFn: (group) => group.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kelompok" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          <span
            className="size-3 shrink-0 rounded-full border"
            style={{ backgroundColor: row.original.color }}
          />
          {row.original.name}
          {row.original.isVip && <Badge variant="default">VIP</Badge>}
        </span>
      ),
    },
    {
      id: "tamu",
      accessorFn: (group) => group.guestCount,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tamu" />,
    },
    {
      id: "sesi",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jam sesi" />,
      cell: ({ row }) =>
        row.original.sessions.length === 0
          ? "—"
          : row.original.sessions.map((s) => (
              <p key={s.eventId}>
                {eventName(s.eventId)}: {formatTimeRange(s.startsAt, s.endsAt)}
              </p>
            )),
      enableSorting: false,
    },
    {
      id: "aksi",
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            {
              label: "Ubah",
              icon: <SquarePen />,
              onSelect: () => setEditing({ kind: "edit", group: row.original }),
            },
            "separator",
            {
              label: "Hapus",
              icon: <Trash2 />,
              destructive: true,
              onSelect: () => setDeleting(row.original),
            },
          ]}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Kelompok tamu"
        description="Kelompok menentukan warna, penanda VIP, dan jam sesi tamu di tiap acara."
        actions={
          <Button onClick={() => setEditing({ kind: "new" })}>
            <Plus className="size-4" aria-hidden />
            Tambah kelompok
          </Button>
        }
      />

      {groups.isError && <Alert tone="error">{groups.error.message}</Alert>}
      <DataTable
        columns={columns}
        data={groups.data ?? []}
        getRowId={(group) => group.id}
        searchPlaceholder="Cari kelompok"
        searchKey="nama"
        emptyText={
          groups.isPending
            ? "Memuat…"
            : "Belum ada kelompok, misalnya Keluarga, Teman Kuliah, atau Tim Klub."
        }
      />

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        wide
        title={editing?.kind === "edit" ? "Ubah kelompok" : "Tambah kelompok"}
      >
        {editing && (
          <GroupForm
            group={editing.kind === "edit" ? editing.group : null}
            events={events.data ?? []}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeleteGroupDialog group={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function GroupForm({
  group,
  events,
  onDone,
}: {
  group: Group | null;
  events: Event[];
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const [name, setName] = useState(group?.name ?? "");
  const [color, setColor] = useState(group?.color ?? "#737373");
  const [isVip, setIsVip] = useState(group?.isVip ?? false);
  // Jam sesi per acara (WIB), disimpan sebagai nilai input time ("10:00"). Tanggalnya diambil dari
  // tanggal acara saat disimpan.
  const [sessions, setSessions] = useState<Record<string, { start: string; end: string }>>(() =>
    Object.fromEntries(
      (group?.sessions ?? []).map((s) => [
        s.eventId,
        { start: isoToWibTime(s.startsAt), end: isoToWibTime(s.endsAt) },
      ]),
    ),
  );

  const setSession = (eventId: string, patch: Partial<{ start: string; end: string }>) =>
    setSessions((current) => ({
      ...current,
      [eventId]: { start: "", end: "", ...current[eventId], ...patch },
    }));

  const save = useMutation({
    mutationFn: () => {
      const input = {
        name,
        color,
        isVip,
        sessions: Object.entries(sessions).flatMap(([eventId, range]) => {
          const date = isoToWibDate(events.find((e) => e.id === eventId)?.startsAt);
          const startsAt = wibTimeToIso(date, range.start);
          const endsAt = wibTimeToIso(date, range.end);
          return startsAt && endsAt ? [{ eventId, startsAt, endsAt }] : [];
        }),
      };
      return group ? adminApi.groups.update(group.id, input) : adminApi.groups.create(input);
    },
    onSuccess: async () => {
      await refresh("groups", "guests");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama kelompok">
          {(id) => (
            <Input id={id} required value={name} onChange={(e) => setName(e.target.value)} />
          )}
        </Field>
        <Field label="Warna">
          {(id) => (
            <input
              id={id}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 cursor-pointer border bg-background p-1"
            />
          )}
        </Field>
      </div>
      <Checkbox checked={isVip} onChange={(e) => setIsVip(e.target.checked)}>
        VIP (tampil berbeda di layar penjaga)
      </Checkbox>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Jam sesi per acara</legend>
        <p className="text-xs text-muted-foreground">
          Isi jam saja (WIB); tanggalnya mengikuti tanggal acara. Kosongkan bila kelompok ini tidak
          punya jam khusus. Sesi dipakai untuk info di undangan dan dicatat di log; penjaga tidak
          diberi peringatan.
        </p>
        {events.length === 0 ? (
          <p className="text-muted-foreground">Belum ada acara.</p>
        ) : (
          events.map((event) => {
            const noDate = !event.startsAt;
            return (
              <div key={event.id} className="grid items-center gap-2 sm:grid-cols-[8rem_1fr_1fr]">
                <span className="text-sm">{event.name}</span>
                <Input
                  type="time"
                  aria-label={`Mulai sesi di ${event.name}`}
                  disabled={noDate}
                  value={sessions[event.id]?.start ?? ""}
                  onChange={(e) => setSession(event.id, { start: e.target.value })}
                />
                <Input
                  type="time"
                  aria-label={`Selesai sesi di ${event.name}`}
                  disabled={noDate}
                  value={sessions[event.id]?.end ?? ""}
                  onChange={(e) => setSession(event.id, { end: e.target.value })}
                />
                {noDate && (
                  <p className="text-xs text-muted-foreground sm:col-span-3">
                    Isi tanggal mulai acara ini dulu di menu Acara.
                  </p>
                )}
              </div>
            );
          })
        )}
      </fieldset>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteGroupDialog({ group, onClose }: { group: Group | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.groups.remove(id),
    onSuccess: async () => {
      await refresh("groups");
      onClose();
    },
  });

  return (
    <Dialog open={group !== null} onClose={onClose} title={`Hapus kelompok "${group?.name}"?`}>
      {group && (
        <>
          {group.guestCount > 0 ? (
            <Alert>
              Kelompok ini masih dipakai {group.guestCount} tamu. Pindahkan tamunya ke kelompok lain
              dulu, baru kelompok bisa dihapus.
            </Alert>
          ) : (
            <p>Jam sesi kelompok ini ikut terhapus.</p>
          )}
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(group.id)}
              disabled={remove.isPending || group.guestCount > 0}
            >
              Hapus kelompok
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
