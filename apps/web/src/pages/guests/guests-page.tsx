import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef, PaginationState, Table } from "@tanstack/react-table";
import type { Event, Group, Guest } from "@wedding/shared";
import {
  CalendarMinus,
  CalendarPlus,
  ChevronDown,
  Download,
  FolderInput,
  ListChecks,
  Plus,
  Printer,
  QrCode,
  Send,
  SquarePen,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTableBulkActions } from "@/components/data-table/bulk-actions";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { selectColumn } from "@/components/data-table/select-column";
import { DataTableViewOptions } from "@/components/data-table/view-options";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { Select } from "@/components/kit/select";
import { toast } from "@/components/kit/toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { adminApi, downloads } from "../../lib/admin-api.js";
import {
  eventsQuery,
  groupsQuery,
  guestsQuery,
  settingsQuery,
  useRefresh,
} from "../../lib/queries.js";
import { type GuestEditing, GuestFormDialog } from "./guest-form-dialog.js";
import { QrDialog } from "./qr-dialog.js";
import { SendDialog } from "./send-dialog.js";
import { SendQueueDialog } from "./send-queue-dialog.js";

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

const EXTRA_OPTIONS = [
  { label: "Punya Instagram", value: "instagram" },
  { label: "Rombongan", value: "rombongan" },
  { label: "Tempat sampah", value: "sampah" },
];

type BulkAction = "set_group" | "add_event" | "remove_event";
type Bulk = { action: BulkAction; ids: string[]; done: () => void } | null;

export function GuestsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  // Parameter URL (divalidasi di router.tsx): ?acara=<id> (dari kartu Acara), ?kelompok=<id>
  // (dari halaman Kelompok), ?kirim=antre (dari Beranda: buka antrean kirim undangan).
  const { acara, kelompok, kirim } = useSearch({ from: "/app/admin/tamu" });
  const urlGroup = kelompok ?? "";
  const [groupId, setGroupId] = useState(urlGroup);
  const [eventId, setEventId] = useState(acara ?? "");
  // Tautan dari kartu Acara/Kelompok mengganti parameter URL tanpa memuat ulang halaman.
  useEffect(() => setEventId(acara ?? ""), [acara]);
  useEffect(() => setGroupId(urlGroup), [urlGroup]);
  const [queueOpen, setQueueOpen] = useState(kirim === "antre");
  useEffect(() => {
    if (kirim === "antre") setQueueOpen(true);
  }, [kirim]);
  const closeQueue = () => {
    setQueueOpen(false);
    // Parameter ?kirim dihapus agar antrean tidak terbuka lagi saat halaman dimuat ulang.
    if (kirim !== undefined) {
      void navigate({
        to: "/admin/tamu",
        search: (prev) => ({ ...prev, kirim: undefined }),
        replace: true,
      });
    }
  };
  const [bulk, setBulk] = useState<Bulk>(null);
  const [sent, setSent] = useState<"" | "sent" | "unsent">("");
  const [extras, setExtras] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const onlyInstagram = extras.includes("instagram");
  const onlyRombongan = extras.includes("rombongan");
  const trash = extras.includes("sampah");

  const q = useDebounced(search.trim(), 300);
  const query = {
    q,
    groupId,
    eventId,
    sent: eventId && sent ? sent : undefined,
    onlyInstagram,
    rombongan: onlyRombongan,
    deleted: trash,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  };

  const guests = useQuery(guestsQuery(query));
  const groups = useQuery(groupsQuery);
  const events = useQuery(eventsQuery);
  const settings = useQuery(settingsQuery);

  const [editing, setEditing] = useState<GuestEditing>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Guest[]>([]);

  // Setiap perubahan filter kembali ke halaman 1.
  // biome-ignore lint/correctness/useExhaustiveDependencies: hanya filter yang mereset halaman
  useEffect(
    () => setPagination((p) => ({ ...p, pageIndex: 0 })),
    [q, groupId, eventId, sent, extras],
  );

  const refresh = useRefresh();
  const restore = useMutation({
    mutationFn: (id: string) => adminApi.guests.restore(id),
    onSuccess: () => refresh("guests", "groups", "events"),
  });

  const groupById = useMemo(
    () => new Map<string, Group>((groups.data ?? []).map((g) => [g.id, g])),
    [groups.data],
  );
  const eventName = (id: string) => events.data?.find((e) => e.id === id)?.name ?? "Acara";
  const items = guests.data?.items ?? [];
  const total = guests.data?.total ?? 0;
  const sendingGuest = items.find((g) => g.id === sendingId) ?? null;
  const qrGuest = items.find((g) => g.id === qrId) ?? null;

  const columns: ColumnDef<Guest, unknown>[] = [
    selectColumn<Guest>(),
    {
      id: "nama",
      accessorFn: (guest) => guest.displayName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
      // Mengetuk nama membuka formulir Ubah (lebih cepat daripada lewat menu …, terutama di HP).
      cell: ({ row }) =>
        trash ? (
          <span className="font-medium">{row.original.displayName}</span>
        ) : (
          <button
            type="button"
            className="text-start font-medium underline-offset-4 hover:underline"
            onClick={() => setEditing({ kind: "edit", guest: row.original })}
          >
            {row.original.displayName}
          </button>
        ),
      enableSorting: false,
      meta: { className: "ps-3" },
    },
    {
      id: "kontak",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kontak" />,
      cell: ({ row }) => (
        <div>
          {row.original.phone && <p>+{row.original.phone}</p>}
          {row.original.instagram && (
            <p className="text-muted-foreground">@{row.original.instagram}</p>
          )}
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "kelompok",
      accessorFn: (guest) => guest.groupId ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kelompok" />,
      cell: ({ row }) => {
        const group = row.original.groupId ? groupById.get(row.original.groupId) : undefined;
        return group ? (
          <Badge variant="outline">
            <span
              className="size-2 rounded-full ring-1 ring-black/15"
              style={{ backgroundColor: group.color }}
            />
            {group.name}
            {group.isVip && " · VIP"}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      enableSorting: false,
    },
    {
      id: "rombongan",
      accessorFn: (guest) => (guest.isRombongan ? "Ya" : "—"),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rombongan" />,
      enableSorting: false,
    },
    {
      id: "kode",
      accessorFn: (guest) => guest.code ?? "—",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
      cell: ({ row }) => (
        <span className="font-mono font-semibold tabular-nums">{row.original.code ?? "—"}</span>
      ),
      enableSorting: false,
    },
    {
      id: "undangan",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Undangan" />,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.events.map((invitation) => (
            <Badge key={invitation.eventId} variant={invitation.sentAt ? "secondary" : "outline"}>
              {eventName(invitation.eventId)}
              {invitation.sentAt ? " ✓" : ""}
            </Badge>
          ))}
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "aksi",
      cell: ({ row }) => {
        const guest = row.original;
        if (trash) {
          return (
            <Button
              size="sm"
              variant="outline"
              disabled={restore.isPending}
              onClick={() => restore.mutate(guest.id)}
            >
              <Undo2 aria-hidden />
              Pulihkan
            </Button>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={!guest.code}
              onClick={() => setQrId(guest.id)}
            >
              <QrCode aria-hidden />
              QR
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSendingId(guest.id)}>
              <Send aria-hidden />
              Kirim
            </Button>
            <DataTableRowActions
              actions={[
                {
                  label: "Ubah",
                  icon: <SquarePen />,
                  onSelect: () => setEditing({ kind: "edit", guest }),
                },
                "separator",
                {
                  label: "Hapus",
                  icon: <Trash2 />,
                  destructive: true,
                  onSelect: () => setDeleting([guest]),
                },
              ]}
            />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const resetFilters = () => {
    setSearch("");
    setGroupId("");
    setEventId("");
    setSent("");
    setExtras([]);
  };
  const isFiltered = search || groupId || eventId || sent || extras.length > 0;

  return (
    <>
      <PageHeader
        title="Daftar tamu"
        description={`${total} undangan${trash ? " di tempat sampah" : ""}.`}
        actions={
          <>
            <a href={downloads.guestsCsv} className={buttonVariants({ variant: "outline" })}>
              <Download aria-hidden />
              Ekspor
            </a>
            <Link to="/admin/tamu/cetak" className={buttonVariants({ variant: "outline" })}>
              <Printer aria-hidden />
              Cetak
            </Link>
            <Link to="/admin/tamu/impor" className={buttonVariants({ variant: "outline" })}>
              <Upload aria-hidden />
              Impor
            </Link>
            <Button variant="outline" onClick={() => setQueueOpen(true)}>
              <ListChecks aria-hidden />
              Kirim beruntun
            </Button>
            <Button onClick={() => setEditing({ kind: "new" })}>
              Tambah tamu
              <Plus aria-hidden />
            </Button>
          </>
        }
      />

      {guests.isError && <Alert tone="error">{guests.error.message}</Alert>}
      {restore.error && <Alert tone="error">{restore.error.message}</Alert>}

      <DataTable
        columns={columns}
        data={items}
        getRowId={(guest) => guest.id}
        emptyText={
          guests.isPending
            ? "Memuat…"
            : !isFiltered && total === 0
              ? "Belum ada tamu. Tambahkan satu per satu atau impor dari CSV."
              : eventId && !search && !groupId && !sent && extras.length === 0
                ? `Belum ada tamu yang diundang ke ${eventName(eventId)}. Tambah tamu dan centang acara ini, atau tekan Atur ulang untuk melihat semua tamu.`
                : "Tidak ada tamu yang cocok dengan filter."
        }
        options={{
          manualPagination: true,
          manualFiltering: true,
          pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
          state: { pagination },
          onPaginationChange: setPagination,
        }}
        renderToolbar={(table) => (
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 flex-col-reverse items-stretch gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
              <Input
                type="search"
                aria-label="Cari tamu"
                placeholder="Cari nama, HP, Instagram, atau kode"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full sm:w-37.5 lg:w-62.5"
              />
              <div className="flex flex-wrap gap-2">
                <FacetedFilter
                  title="Kelompok"
                  multiple={false}
                  options={(groups.data ?? []).map((g) => ({ label: g.name, value: g.id }))}
                  selected={new Set(groupId ? [groupId] : [])}
                  onChange={(values) => setGroupId(values[0] ?? "")}
                />
                <FacetedFilter
                  title="Acara"
                  multiple={false}
                  options={(events.data ?? []).map((e) => ({ label: e.name, value: e.id }))}
                  selected={new Set(eventId ? [eventId] : [])}
                  onChange={(values) => {
                    setEventId(values[0] ?? "");
                    setSent("");
                  }}
                />
                {eventId && (
                  <FacetedFilter
                    title="Status kirim"
                    multiple={false}
                    options={[
                      { label: "Belum dikirim", value: "unsent" },
                      { label: "Sudah dikirim", value: "sent" },
                    ]}
                    selected={new Set(sent ? [sent] : [])}
                    onChange={(values) => setSent((values[0] ?? "") as typeof sent)}
                  />
                )}
                <FacetedFilter
                  title="Lainnya"
                  options={EXTRA_OPTIONS}
                  selected={new Set(extras)}
                  onChange={setExtras}
                />
              </div>
              {isFiltered && (
                <Button variant="ghost" onClick={resetFilters} className="h-8 px-2 lg:px-3">
                  Atur ulang
                </Button>
              )}
            </div>
            <DataTableViewOptions table={table} />
          </div>
        )}
        bulkActions={(table) => (
          <DataTableBulkActions table={table} entityName="tamu">
            {trash ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await Promise.all(
                    table
                      .getFilteredSelectedRowModel()
                      .rows.map((row) => restore.mutateAsync(row.original.id)),
                  );
                  table.resetRowSelection();
                }}
              >
                <Undo2 aria-hidden />
                Pulihkan
              </Button>
            ) : (
              <>
                <BulkMenu
                  onSelect={(action) => setBulk(bulkOf(table, action))}
                  hasEvents={(events.data?.length ?? 0) > 0}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setDeleting(table.getFilteredSelectedRowModel().rows.map((row) => row.original))
                  }
                >
                  <Trash2 aria-hidden />
                  Hapus
                </Button>
              </>
            )}
          </DataTableBulkActions>
        )}
      />

      <GuestFormDialog
        editing={editing}
        groups={groups.data ?? []}
        events={events.data ?? []}
        onClose={() => setEditing(null)}
      />
      <SendDialog
        guest={sendingGuest}
        events={events.data ?? []}
        groups={groups.data ?? []}
        settings={settings.data}
        onClose={() => setSendingId(null)}
      />
      <QrDialog
        guest={qrGuest}
        group={groups.data?.find((g) => g.id === qrGuest?.groupId)}
        onClose={() => setQrId(null)}
      />
      <DeleteGuestDialog guests={deleting} onClose={() => setDeleting([])} />
      <BulkDialog
        bulk={bulk}
        groups={groups.data ?? []}
        events={events.data ?? []}
        onClose={() => setBulk(null)}
      />
      <SendQueueDialog
        open={queueOpen}
        onClose={closeQueue}
        events={events.data ?? []}
        groups={groups.data ?? []}
        settings={settings.data}
        initialEventId={eventId || undefined}
      />
    </>
  );
}

function bulkOf(table: Table<Guest>, action: BulkAction): Bulk {
  return {
    action,
    ids: table.getFilteredSelectedRowModel().rows.map((row) => row.original.id),
    done: () => table.resetRowSelection(),
  };
}

/** Satu tombol "Ubah" berisi aksi massal, agar bilah melayang tetap muat di layar HP. */
function BulkMenu({
  onSelect,
  hasEvents,
}: {
  onSelect: (action: BulkAction) => void;
  hasEvents: boolean;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          Ubah
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" className="w-56">
        <DropdownMenuItem onSelect={() => onSelect("set_group")}>
          <FolderInput />
          Pindah kelompok
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!hasEvents} onSelect={() => onSelect("add_event")}>
          <CalendarPlus />
          Undang ke acara
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!hasEvents} onSelect={() => onSelect("remove_event")}>
          <CalendarMinus />
          Batalkan undangan acara
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const BULK_TEXT: Record<BulkAction, { title: string; label: string; submit: string }> = {
  set_group: { title: "Pindah kelompok", label: "Kelompok tujuan", submit: "Pindahkan" },
  add_event: { title: "Undang ke acara", label: "Acara", submit: "Undang" },
  remove_event: { title: "Batalkan undangan acara", label: "Acara", submit: "Batalkan undangan" },
};

function BulkDialog({
  bulk,
  groups,
  events,
  onClose,
}: {
  bulk: Bulk;
  groups: Group[];
  events: Event[];
  onClose: () => void;
}) {
  const text = bulk ? BULK_TEXT[bulk.action] : null;
  return (
    <Dialog
      open={bulk !== null}
      onClose={onClose}
      title={text ? `${text.title} (${bulk?.ids.length} tamu)` : ""}
    >
      {bulk && <BulkForm bulk={bulk} groups={groups} events={events} onDone={onClose} />}
    </Dialog>
  );
}

function BulkForm({
  bulk,
  groups,
  events,
  onDone,
}: {
  bulk: NonNullable<Bulk>;
  groups: Group[];
  events: Event[];
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const isGroup = bulk.action === "set_group";
  const [target, setTarget] = useState(isGroup ? "" : (events[0]?.id ?? ""));
  const text = BULK_TEXT[bulk.action];

  const run = useMutation({
    mutationFn: () =>
      adminApi.guests.bulk(
        isGroup
          ? { ids: bulk.ids, action: "set_group", groupId: target || null }
          : { ids: bulk.ids, action: bulk.action, eventId: target },
      ),
    meta: { toast: false },
    onSuccess: async ({ updated }) => {
      toast(`${updated} tamu diperbarui`);
      await refresh("guests", "groups", "events");
      bulk.done();
      onDone();
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run.mutate();
      }}
    >
      <Field
        label={text.label}
        hint={
          bulk.action === "remove_event"
            ? "Undangan dan status kirim untuk acara ini dihapus dari tamu terpilih; tamunya tetap ada."
            : bulk.action === "add_event"
              ? "Tamu yang sudah diundang ke acara ini tidak berubah."
              : undefined
        }
      >
        {(id) => (
          <Select id={id} value={target} onChange={(e) => setTarget(e.target.value)}>
            {isGroup && <option value="">Tanpa kelompok</option>}
            {(isGroup ? groups : events).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {run.error && <Alert tone="error">{run.error.message}</Alert>}
      <FormFooter
        onCancel={onDone}
        pending={run.isPending}
        disabled={!isGroup && !target}
        submitLabel={text.submit}
      />
    </form>
  );
}

function DeleteGuestDialog({ guests, onClose }: { guests: Guest[]; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminApi.guests.remove(id))),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("guests", "groups", "events");
      onClose();
    },
  });
  const first = guests[0];

  return (
    <Dialog
      open={guests.length > 0}
      onClose={onClose}
      title={
        guests.length === 1 ? `Hapus "${first?.displayName}"?` : `Hapus ${guests.length} tamu?`
      }
    >
      {guests.length > 0 && (
        <>
          <p>Tamu dipindahkan ke tempat sampah dan bisa dipulihkan kapan saja.</p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(guests.map((guest) => guest.id))}
              disabled={remove.isPending}
            >
              Hapus
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
