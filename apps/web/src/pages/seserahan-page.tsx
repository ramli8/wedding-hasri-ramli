import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  SESERAHAN_CATEGORIES,
  SESERAHAN_CATEGORY_LABEL,
  SESERAHAN_STATUS_LABEL,
  SESERAHAN_STATUSES,
  type SeserahanCategory,
  type SeserahanItem,
  type SeserahanStatus,
} from "@wedding/shared";
import {
  Check,
  ChevronDown,
  Download,
  Ellipsis,
  type LucideIcon,
  PackageCheck,
  Plus,
  SquarePen,
  Trash2,
  Wallet,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { MoneyInput } from "@/components/kit/money-input";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { adminApi, downloads } from "../lib/admin-api.js";
import { formatRupiah } from "../lib/format.js";
import { seserahanQuery, useRefresh } from "../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; item: SeserahanItem };

/** Warna titik status: makin jauh prosesnya makin "selesai". */
const STATUS_DOT: Record<SeserahanStatus, string> = {
  rencana: "bg-muted-foreground/40",
  dibeli: "bg-warning",
  dikemas: "bg-primary/60",
  diserahkan: "bg-success",
};

function Stat({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

/** Mahar, seserahan, dan hantaran: daftar barang, penanggung jawab, harga, dan statusnya. */
export function SeserahanPage() {
  const refresh = useRefresh();
  const list = useQuery(seserahanQuery);
  const items = list.data?.items ?? [];
  const summary = list.data?.summary;
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<SeserahanItem | null>(null);

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: SeserahanStatus }) =>
      adminApi.seserahan.setStatus(v.id, v.status),
    onSuccess: () => refresh("seserahan"),
  });

  const columns: ColumnDef<SeserahanItem, unknown>[] = [
    {
      id: "barang",
      accessorFn: (item) => item.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Barang" />,
      filterFn: (row, _id, value: string) => {
        const needle = value.toLowerCase();
        const { name, pic, note } = row.original;
        return [name, pic, note].some((text) => text?.toLowerCase().includes(needle));
      },
      cell: ({ row }) => (
        <div className="max-w-72">
          <p className="font-medium">{row.original.name}</p>
          {row.original.note && (
            <p className="truncate text-xs text-muted-foreground">{row.original.note}</p>
          )}
        </div>
      ),
    },
    {
      id: "kategori",
      accessorFn: (item) => item.category,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
      cell: ({ row }) => (
        <Badge variant="secondary">{SESERAHAN_CATEGORY_LABEL[row.original.category]}</Badge>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      id: "pj",
      accessorFn: (item) => item.pic ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Penanggung jawab" />,
      cell: ({ row }) => row.original.pic ?? <span className="text-muted-foreground">–</span>,
    },
    {
      id: "harga",
      accessorFn: (item) => item.price ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
      cell: ({ row }) =>
        row.original.price !== null ? (
          <span className="tabular-nums">{formatRupiah(row.original.price)}</span>
        ) : (
          <span className="text-muted-foreground">–</span>
        ),
    },
    {
      id: "status",
      accessorFn: (item) => item.status,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" aria-label={`Ubah status ${item.name}`}>
                <span className={cn("size-2 rounded-full", STATUS_DOT[item.status])} aria-hidden />
                {SESERAHAN_STATUS_LABEL[item.status]}
                <ChevronDown aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SESERAHAN_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => setStatus.mutate({ id: item.id, status })}
                >
                  <span className={cn("size-2 rounded-full", STATUS_DOT[status])} aria-hidden />
                  {SESERAHAN_STATUS_LABEL[status]}
                  {status === item.status && <Check className="ms-auto" aria-hidden />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DataTableRowActions
            actions={[
              {
                label: "Ubah",
                icon: <SquarePen />,
                onSelect: () => setEditing({ kind: "edit", item: row.original }),
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
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Seserahan"
        description="Mahar, seserahan, dan hantaran: siapa yang mengurus, harganya, dan sudah sampai mana."
        actions={
          <>
            <Button onClick={() => setEditing({ kind: "new" })}>
              Tambah barang
              <Plus aria-hidden />
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Lainnya">
                  <Ellipsis aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <a href={downloads.seserahanXlsx}>
                    <Download />
                    Ekspor Excel
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {summary && summary.count > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat
            icon={Wallet}
            label="Total harga"
            value={formatRupiah(summary.priceTotal)}
            note={`${summary.count} barang`}
          />
          <Stat
            icon={PackageCheck}
            label="Sudah diserahkan"
            value={`${summary.byStatus.diserahkan ?? 0} / ${summary.count}`}
            note={SESERAHAN_STATUSES.filter((s) => s !== "diserahkan")
              .map((s) => `${SESERAHAN_STATUS_LABEL[s]} ${summary.byStatus[s] ?? 0}`)
              .join(" · ")}
          />
        </div>
      )}

      {list.isError && <Alert tone="error">{list.error.message}</Alert>}
      {setStatus.error && <Alert tone="error">{setStatus.error.message}</Alert>}

      <DataTable
        columns={columns}
        data={items}
        getRowId={(item) => item.id}
        searchPlaceholder="Cari barang atau penanggung jawab"
        searchKey="barang"
        emptyText={list.isPending ? "Memuat…" : "Belum ada barang. Klik “Tambah barang”."}
        filters={[
          {
            columnId: "kategori",
            title: "Kategori",
            options: SESERAHAN_CATEGORIES.map((value) => ({
              label: SESERAHAN_CATEGORY_LABEL[value],
              value,
            })),
          },
          {
            columnId: "status",
            title: "Status",
            options: SESERAHAN_STATUSES.map((value) => ({
              label: SESERAHAN_STATUS_LABEL[value],
              value,
            })),
          },
        ]}
      />

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.kind === "edit" ? "Ubah barang" : "Tambah barang"}
      >
        {editing && (
          <ItemForm
            item={editing.kind === "edit" ? editing.item : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function ItemForm({ item, onDone }: { item: SeserahanItem | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [category, setCategory] = useState<SeserahanCategory>(item?.category ?? "seserahan");
  const [name, setName] = useState(item?.name ?? "");
  const [pic, setPic] = useState(item?.pic ?? "");
  const [price, setPrice] = useState<number | null>(item?.price ?? null);
  const [status, setStatus] = useState<SeserahanStatus>(item?.status ?? "rencana");
  const [note, setNote] = useState(item?.note ?? "");
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && !name.trim() ? "Nama barang wajib diisi" : null;

  const save = useMutation({
    mutationFn: () => {
      const input = { category, name, pic, price, status, note };
      return item ? adminApi.seserahan.update(item.id, input) : adminApi.seserahan.create(input);
    },
    onSuccess: async () => {
      await refresh("seserahan");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return;
    save.mutate();
  }

  const inputClass = "h-11 text-base md:h-9 md:text-sm";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">Kategori</legend>
        <div className="grid grid-cols-3 gap-2">
          {SESERAHAN_CATEGORIES.map((value) => (
            <Button
              key={value}
              variant={category === value ? "default" : "outline"}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className="h-11 md:h-10"
            >
              {SESERAHAN_CATEGORY_LABEL[value]}
            </Button>
          ))}
        </div>
      </fieldset>
      <Field label="Nama barang" required error={nameError}>
        {(id) => (
          <Input
            id={id}
            autoFocus={!item}
            maxLength={120}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Penanggung jawab">
          {(id) => (
            <Input
              id={id}
              maxLength={60}
              autoComplete="off"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Harga">
          {(id) => <MoneyInput id={id} value={price} onValueChange={setPrice} />}
        </Field>
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">Status</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SESERAHAN_STATUSES.map((value) => (
            <Button
              key={value}
              variant={status === value ? "default" : "outline"}
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
              className="h-11 md:h-10"
            >
              {SESERAHAN_STATUS_LABEL[value]}
            </Button>
          ))}
        </div>
      </fieldset>
      <Field label="Catatan">
        {(id) => (
          <Input
            id={id}
            maxLength={500}
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: SeserahanItem | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.seserahan.remove(id),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("seserahan");
      onClose();
    },
  });
  return (
    <Dialog open={item !== null} onClose={onClose} title="Hapus barang?">
      {item && (
        <>
          <p>
            <strong>{item.name}</strong> dihapus dari daftar.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(item.id)}
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
