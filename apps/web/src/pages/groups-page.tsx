import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { type Event, formatTimeRange, type Group } from "@wedding/shared";
import { Check, Palette, Plus, SquarePen, Trash2, Users } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { selectColumn } from "@/components/data-table/select-column";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { SwitchRow } from "@/components/kit/form-rows";
import { EmptyState, FormFooter, isAgain } from "@/components/kit/invitation-kit";
import { Select } from "@/components/kit/select";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
      // Membuka daftar tamu yang sudah disaring ke kelompok ini.
      cell: ({ row }) => (
        <Link
          to="/admin/tamu"
          search={{ kelompok: row.original.id }}
          className="font-medium underline underline-offset-4 hover:opacity-80"
        >
          {row.original.guestCount} tamu
        </Link>
      ),
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
      {groups.isSuccess && groups.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada kelompok"
          description="Misalnya Keluarga, Teman Kuliah, atau Tim Klub. Kelompok memberi warna, penanda VIP, dan jam sesi."
          addLabel="Tambah kelompok pertama"
          onAdd={() => setEditing({ kind: "new" })}
        />
      ) : (
        <DataTable
          columns={columns}
          data={groups.data ?? []}
          getRowId={(group) => group.id}
          searchPlaceholder="Cari kelompok"
          searchKey="nama"
          emptyText={groups.isPending ? "Memuat…" : "Tidak ada kelompok yang cocok."}
        />
      )}

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
      <DeleteGroupDialog
        group={deleting}
        groups={groups.data ?? []}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

/** Warna siap pakai: cukup diketuk, tanpa membuka pemilih warna. */
const PRESET_COLORS = [
  { value: "#e11d48", name: "Merah" },
  { value: "#f97316", name: "Oranye" },
  { value: "#eab308", name: "Kuning" },
  { value: "#16a34a", name: "Hijau" },
  { value: "#0d9488", name: "Toska" },
  { value: "#2563eb", name: "Biru" },
  { value: "#7c3aed", name: "Ungu" },
  { value: "#737373", name: "Abu-abu" },
];

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const current = value.toLowerCase();
  const custom = !PRESET_COLORS.some((c) => c.value === current);
  return (
    <div role="radiogroup" aria-label="Warna" className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((color) => {
        const selected = color.value === current;
        return (
          // biome-ignore lint/a11y/useSemanticElements: tombol bulat lebih mudah diketuk daripada radio bawaan
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color.name}
            title={color.name}
            onClick={() => onChange(color.value)}
            className={cn(
              "grid size-11 place-items-center rounded-full border-2 text-white transition-shadow",
              selected ? "border-foreground ring-2 ring-ring/40" : "border-transparent",
            )}
            style={{ backgroundColor: color.value }}
          >
            {selected && <Check className="size-5 drop-shadow" aria-hidden />}
          </button>
        );
      })}
      <label
        title="Warna lain"
        className={cn(
          "relative grid size-11 cursor-pointer place-items-center rounded-full border-2",
          custom ? "border-foreground ring-2 ring-ring/40" : "border-dashed border-border",
        )}
        style={custom ? { backgroundColor: value } : undefined}
      >
        <Palette className={cn("size-5", custom && "text-white drop-shadow")} aria-hidden />
        <span className="sr-only">Warna lain</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
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
  const nameRef = useRef<HTMLInputElement>(null);
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
    mutationFn: (_again: boolean) => {
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
    onSuccess: async (_data, again) => {
      await refresh("groups", "guests");
      if (!again) {
        onDone();
        return;
      }
      // Warna dan VIP dikosongkan juga: kelompok berikutnya biasanya berbeda.
      setName("");
      setIsVip(false);
      setSessions({});
      nameRef.current?.focus();
    },
  });

  // Jam sesi harus diisi berpasangan; yang setengah diisi dulu hilang diam-diam saat disimpan.
  const halfSession = events.find((e) => {
    const range = sessions[e.id];
    return range && !!range.start !== !!range.end;
  });
  const backwardSession = events.find((e) => {
    const range = sessions[e.id];
    return range?.start && range.end && range.end <= range.start;
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (halfSession || backwardSession) return;
    save.mutate(isAgain(event));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama kelompok" required>
          {(id) => (
            <Input
              id={id}
              ref={nameRef}
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        <div className="grid content-start gap-2">
          <span className="text-sm leading-none font-medium">Warna</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
      <SwitchRow
        title="VIP"
        description="Tamu kelompok ini tampil berbeda di layar penjaga."
        checked={isVip}
        onCheckedChange={setIsVip}
      />

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

      {halfSession && (
        <Alert tone="error">
          Jam sesi {halfSession.name} baru terisi sebagian. Isi jam mulai dan selesai, atau
          kosongkan keduanya.
        </Alert>
      )}
      {!halfSession && backwardSession && (
        <Alert tone="error">Jam selesai sesi {backwardSession.name} harus setelah jam mulai.</Alert>
      )}
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        disabled={!!halfSession || !!backwardSession}
        again={!group}
      />
    </form>
  );
}

function DeleteGroupDialog({
  group,
  groups,
  onClose,
}: {
  group: Group | null;
  groups: Group[];
  onClose: () => void;
}) {
  return (
    <Dialog open={group !== null} onClose={onClose} title={`Hapus kelompok "${group?.name}"?`}>
      {group && <DeleteGroupBody group={group} groups={groups} onClose={onClose} />}
    </Dialog>
  );
}

function DeleteGroupBody({
  group,
  groups,
  onClose,
}: {
  group: Group;
  groups: Group[];
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const others = groups.filter((g) => g.id !== group.id);
  // Tamu kelompok ini dipindahkan dulu (ke kelompok lain atau tanpa kelompok), lalu kelompok dihapus.
  const [moveTo, setMoveTo] = useState("none");
  const hasGuests = group.guestCount > 0;
  const remove = useMutation({
    mutationFn: () => adminApi.groups.remove(group.id, hasGuests ? moveTo : undefined),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("groups", "guests");
      onClose();
    },
  });

  return (
    <>
      {hasGuests ? (
        <Field
          label={`Pindahkan ${group.guestCount} tamu ke`}
          hint="Tamunya tetap ada; hanya kelompoknya yang diganti. Jam sesi kelompok ini ikut terhapus."
        >
          {(id) => (
            <Select id={id} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              <option value="none">Tanpa kelompok</option>
              {others.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : (
        <p>Jam sesi kelompok ini ikut terhapus.</p>
      )}
      {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
      <div data-form-footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>
          {hasGuests ? "Pindahkan & hapus" : "Hapus kelompok"}
        </Button>
      </div>
    </>
  );
}
