import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef, PaginationState, Table } from "@tanstack/react-table";
import type { Group, Guest } from "@wedding/shared";
import {
  Check,
  Download,
  Ellipsis,
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
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTableBulkActions } from "@/components/data-table/bulk-actions";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { selectColumn } from "@/components/data-table/select-column";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { EmptyState, FormFooter } from "@/components/kit/invitation-kit";
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
import { formatPhone } from "../../lib/format.js";
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

type Bulk = { ids: string[]; done: () => void } | null;

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
      // Nama, lalu kontak di baris kecil di bawahnya. Mengetuk nama membuka formulir Ubah (lebih
      // cepat daripada lewat menu …, terutama di HP).
      cell: ({ row }) => {
        const guest = row.original;
        const contact = [
          guest.phone && formatPhone(guest.phone),
          guest.instagram && `@${guest.instagram}`,
        ].filter(Boolean);
        return (
          <div className="grid min-w-0 gap-0.5 text-start">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {trash ? (
                <span className="font-medium">{guest.displayName}</span>
              ) : (
                <button
                  type="button"
                  className="text-start font-medium underline-offset-4 hover:underline"
                  onClick={() => setEditing({ kind: "edit", guest })}
                >
                  {guest.displayName}
                </button>
              )}
              {guest.isRombongan && (
                <Badge variant="secondary" className="font-normal">
                  Rombongan
                </Badge>
              )}
            </span>
            {contact.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {contact.join(" · ")}
              </span>
            )}
          </div>
        );
      },
      enableSorting: false,
      meta: { className: "ps-3", card: "title" },
    },
    {
      id: "kelompok",
      accessorFn: (guest) => guest.groupId ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kelompok" />,
      cell: ({ row }) => {
        const group = row.original.groupId ? groupById.get(row.original.groupId) : undefined;
        return group ? (
          <Badge variant="outline">
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
          {row.original.events.length === 0 && <span className="text-muted-foreground">—</span>}
          {row.original.events.map((invitation) => (
            <Badge
              key={invitation.eventId}
              variant={invitation.sentAt ? "secondary" : "outline"}
              title={invitation.sentAt ? "Undangan sudah dikirim" : "Undangan belum dikirim"}
            >
              {invitation.sentAt && <Check aria-hidden />}
              {eventName(invitation.eventId)}
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
            {/* Tablet/desktop: QR sebagai tombol di samping Kirim; di HP cukup lewat menu …. */}
            <Button
              size="sm"
              variant="outline"
              disabled={!guest.code}
              onClick={() => setQrId(guest.id)}
              className="max-md:hidden"
              title="QR tiket"
            >
              <QrCode aria-hidden />
              {/* Tablet: ikon saja agar kolom aksi tidak terpotong; teks muncul di layar lebar. */}
              <span className="md:max-xl:sr-only">QR</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSendingId(guest.id)}
              title="Kirim undangan"
            >
              <Send aria-hidden />
              <span className="md:max-xl:sr-only">Kirim</span>
            </Button>
            <DataTableRowActions
              actions={[
                {
                  label: "QR tiket",
                  icon: <QrCode />,
                  disabled: !guest.code,
                  onSelect: () => setQrId(guest.id),
                  className: "md:hidden",
                },
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
      meta: { card: "actions" },
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
  // Belum ada tamu sama sekali: cukup satu ajakan, seperti menu Acara dan Kelompok.
  const empty = guests.isSuccess && total === 0 && !isFiltered;

  return (
    <>
      <PageHeader
        title="Daftar tamu"
        description={empty ? undefined : `${total} tamu${trash ? " di tempat sampah" : ""}.`}
        actions={
          empty ? undefined : (
            <>
              <Button variant="outline" onClick={() => setQueueOpen(true)}>
                <ListChecks aria-hidden />
                Kirim beruntun
              </Button>
              <Button onClick={() => setEditing({ kind: "new" })}>
                <Plus aria-hidden />
                Tambah tamu
              </Button>
              <MoreMenu />
            </>
          )
        }
      />

      {guests.isError && <Alert tone="error">{guests.error.message}</Alert>}
      {restore.error && <Alert tone="error">{restore.error.message}</Alert>}

      {empty && groups.isSuccess && groups.data.length === 0 ? (
        // Tamu wajib berkelompok: tanpa kelompok, tamu belum bisa ditambahkan.
        <EmptyState
          icon={Users}
          title="Buat kelompok dulu"
          description="Setiap tamu masuk satu kelompok, dan kelompok menentukan acara yang diundang. Buat kelompoknya dulu, lalu kembali ke sini."
          addLabel="Buat kelompok"
          onAdd={() => void navigate({ to: "/admin/kelompok" })}
        />
      ) : empty ? (
        <EmptyState
          icon={Users}
          title="Belum ada tamu"
          description="Tambahkan tamu satu per satu, atau impor sekaligus dari spreadsheet."
          addLabel="Tambah tamu pertama"
          onAdd={() => setEditing({ kind: "new" })}
        >
          <Link
            to="/admin/tamu/impor"
            className="text-sm font-medium underline underline-offset-4 hover:opacity-80"
          >
            atau impor dari spreadsheet
          </Link>
        </EmptyState>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          getRowId={(guest) => guest.id}
          emptyText={
            guests.isPending
              ? "Memuat…"
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
          renderToolbar={() => (
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
                  <Button size="sm" variant="outline" onClick={() => setBulk(bulkOf(table))}>
                    <FolderInput aria-hidden />
                    Pindah kelompok
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setDeleting(
                        table.getFilteredSelectedRowModel().rows.map((row) => row.original),
                      )
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
      )}

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
      <BulkDialog bulk={bulk} groups={groups.data ?? []} onClose={() => setBulk(null)} />
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

/** Aksi yang jarang dipakai (impor, ekspor, cetak QR) dikumpulkan di satu menu agar header ringkas. */
function MoreMenu() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Lainnya">
          <Ellipsis aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link to="/admin/tamu/impor">
            <Upload />
            Impor dari spreadsheet
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={downloads.guestsXlsx}>
            <Download />
            Ekspor Excel
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/admin/tamu/cetak">
            <Printer />
            Cetak kartu QR
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function bulkOf(table: Table<Guest>): Bulk {
  return {
    ids: table.getFilteredSelectedRowModel().rows.map((row) => row.original.id),
    done: () => table.resetRowSelection(),
  };
}

/** Pindah kelompok massal. Acara yang diundang ikut berganti ke acara kelompok tujuan. */
function BulkDialog({
  bulk,
  groups,
  onClose,
}: {
  bulk: Bulk;
  groups: Group[];
  onClose: () => void;
}) {
  return (
    <Dialog
      open={bulk !== null}
      onClose={onClose}
      title={`Pindah kelompok (${bulk?.ids.length ?? 0} tamu)`}
    >
      {bulk && <BulkForm bulk={bulk} groups={groups} onDone={onClose} />}
    </Dialog>
  );
}

function BulkForm({
  bulk,
  groups,
  onDone,
}: {
  bulk: NonNullable<Bulk>;
  groups: Group[];
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const [target, setTarget] = useState("");

  const run = useMutation({
    mutationFn: () => adminApi.guests.bulk({ ids: bulk.ids, action: "set_group", groupId: target }),
    meta: { toast: false },
    onSuccess: async ({ updated }) => {
      toast(`${updated} tamu dipindahkan`);
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
        label="Kelompok tujuan"
        hint="Acara yang diundang ikut berganti ke acara kelompok tujuan."
      >
        {(id) => (
          <Select id={id} value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="" disabled>
              Pilih kelompok
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {run.error && <Alert tone="error">{run.error.message}</Alert>}
      <FormFooter
        onCancel={onDone}
        pending={run.isPending}
        disabled={!target}
        submitLabel="Pindahkan"
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
          <DialogActions>
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
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
