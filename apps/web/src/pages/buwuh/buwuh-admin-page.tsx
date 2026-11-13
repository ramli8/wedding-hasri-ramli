import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type BuwuhCatalogItem,
  type BuwuhEntry,
  buwuhKind,
  DEFAULT_BUWUH_CATALOG,
  formatBuwuhItems,
} from "@wedding/shared";
import {
  Download,
  Ellipsis,
  ListPlus,
  MapPin,
  Package,
  Plus,
  SquarePen,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import {
  BuwuhFields,
  type BuwuhValue,
  buwuhErrors,
  buwuhPayload,
} from "@/components/buwuh/buwuh-fields";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { ReorderButtons } from "@/components/kit/reorder-buttons";
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
import { adminApi, downloads } from "../../lib/admin-api.js";
import { formatRupiah } from "../../lib/format.js";
import {
  buwuhAddressesQuery,
  buwuhCatalogQuery,
  buwuhQuery,
  useRefresh,
} from "../../lib/queries.js";

const timeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const formatQty = (quantity: number) =>
  quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 });

/**
 * Catatan meja buwuh (sumbangan uang dan barang dari tamu desa). Sebagian besar masuk dari HP meja
 * di hari-H (halaman /buwuh, khusus mengisi); di sini admin melihat rekap, membetulkan, dan mengekspor
 * ke Excel untuk dibalas saat pemberi punya hajat.
 */
export function BuwuhAdminPage() {
  const [editing, setEditing] = useState<BuwuhEntry | null>(null);
  const [deleting, setDeleting] = useState<BuwuhEntry | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [addressesOpen, setAddressesOpen] = useState(false);

  const list = useQuery(buwuhQuery);
  const items = list.data?.items ?? [];
  const summary = list.data?.summary;

  const columns: ColumnDef<BuwuhEntry, unknown>[] = [
    {
      id: "pemberi",
      accessorFn: (entry) => entry.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pemberi" />,
      // Kotak cari memfilter kolom ini: cocokkan juga alamat, barang, dan catatan.
      filterFn: (row, _id, value: string) => {
        const needle = value.toLowerCase();
        const { name, address, note, items } = row.original;
        return [name, address, note, formatBuwuhItems(items)].some((text) =>
          text?.toLowerCase().includes(needle),
        );
      },
      cell: ({ row }) => (
        <div className="max-w-64">
          <p className="truncate font-medium">{row.original.name}</p>
          {row.original.address && (
            <p className="truncate text-xs text-muted-foreground">{row.original.address}</p>
          )}
        </div>
      ),
    },
    {
      id: "uang",
      accessorFn: (entry) => entry.amount,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uang" />,
      cell: ({ row }) =>
        row.original.amount > 0 ? (
          <span className="font-medium tabular-nums">{formatRupiah(row.original.amount)}</span>
        ) : (
          <span className="text-muted-foreground">–</span>
        ),
    },
    {
      id: "barang",
      accessorFn: (entry) => formatBuwuhItems(entry.items),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Barang" />,
      cell: ({ row }) => (
        <div className="max-w-72">
          <p className="text-sm">{formatBuwuhItems(row.original.items) || "–"}</p>
          {row.original.note && (
            <p className="truncate text-xs text-muted-foreground">{row.original.note}</p>
          )}
        </div>
      ),
    },
    {
      id: "meja",
      accessorFn: (entry) => entry.deviceName ?? "Admin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Dicatat" />,
      cell: ({ row }) => (
        <div className="text-sm">
          <p>{timeFmt.format(new Date(row.original.recordedAt))}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.deviceName ?? "Admin"}
            {row.original.deviceName && row.original.editedAt && " · diubah admin"}
          </p>
        </div>
      ),
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
                onSelect: () => setEditing(row.original),
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
        title="Buwuh"
        description="Sumbangan uang dan barang dari meja buwuh. Catatan dari HP meja masuk sendiri saat ada internet."
        actions={
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Lainnya">
                <Ellipsis aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => setCatalogOpen(true)}>
                <ListPlus />
                Atur daftar barang
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAddressesOpen(true)}>
                <MapPin />
                Atur daftar alamat
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={downloads.buwuhXlsx}>
                  <Download />
                  Ekspor Excel
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="gap-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total uang</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold break-words">
                {formatRupiah(summary.amountTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {items.filter((entry) => entry.amount > 0).length} amplop
              </p>
            </CardContent>
          </Card>
          <Card className="gap-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemberi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.count}</div>
              <p className="text-xs text-muted-foreground">
                {items.filter((entry) => entry.items.length > 0).length} membawa barang
              </p>
            </CardContent>
          </Card>
          <Card className="gap-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Barang</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              {summary.goods.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada barang.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5" aria-label="Rekap barang">
                  {summary.goods.map((good) => (
                    <li key={`${good.name}|${good.unit}`}>
                      <Badge variant="secondary" className="font-normal">
                        {good.name}{" "}
                        <b className="tabular-nums">
                          {formatQty(good.quantity)}
                          {good.unit && ` ${good.unit}`}
                        </b>
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {list.isError && <Alert tone="error">{list.error.message}</Alert>}

      <DataTable
        columns={columns}
        data={items}
        getRowId={(entry) => entry.id}
        searchPlaceholder="Cari nama, alamat, atau barang"
        searchKey="pemberi"
        emptyText={
          list.isPending
            ? "Memuat…"
            : "Belum ada catatan. Pasang HP meja di menu Perangkat (jenis Meja buwuh), lalu catat di halaman /buwuh."
        }
      />

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Ubah catatan buwuh"
        wide
      >
        {editing && <EntryForm entry={editing} onDone={() => setEditing(null)} />}
      </Dialog>
      <Dialog open={addressesOpen} onClose={() => setAddressesOpen(false)} title="Daftar alamat">
        {addressesOpen && <AddressesForm onDone={() => setAddressesOpen(false)} />}
      </Dialog>
      <Dialog open={catalogOpen} onClose={() => setCatalogOpen(false)} title="Daftar barang">
        {catalogOpen && <CatalogForm onDone={() => setCatalogOpen(false)} />}
      </Dialog>
      <DeleteDialog entry={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function EntryForm({ entry, onDone }: { entry: BuwuhEntry; onDone: () => void }) {
  const refresh = useRefresh();
  const catalog = useQuery(buwuhCatalogQuery);
  const list = useQuery(buwuhQuery);
  const [value, setValue] = useState<BuwuhValue>(() => ({
    kind: buwuhKind(entry),
    name: entry.name,
    address: entry.address ?? "",
    amount: entry.amount || null,
    items: entry.items,
  }));
  const [note, setNote] = useState(entry.note ?? "");
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? buwuhErrors(value) : null;

  // Alamat yang paling sering muncul di semua catatan, sebagai tombol pintas.
  const addresses = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const item of list.data?.items ?? []) {
      const label = item.address?.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      counts.set(key, { label, count: (counts.get(key)?.count ?? 0) + 1 });
    }
    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((item) => item.label);
  }, [list.data]);

  const save = useMutation({
    mutationFn: () => {
      return adminApi.buwuh.update(entry.id, { ...buwuhPayload(value), note });
    },
    onSuccess: async () => {
      await refresh("buwuh");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const found = buwuhErrors(value);
    if (found.name || found.gift) return;
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {entry.deviceName && (
        <Alert>
          Setelah diubah di sini, catatan ini tidak bisa lagi diubah dari {entry.deviceName}.
        </Alert>
      )}
      <BuwuhFields
        value={value}
        onChange={setValue}
        catalog={catalog.data?.items ?? [...DEFAULT_BUWUH_CATALOG]}
        addresses={addresses}
        errors={errors}
      />
      <Field label="Catatan">
        {(id) => (
          <Input
            id={id}
            maxLength={500}
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-11 text-base md:h-9 md:text-sm"
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

/** Mengatur tombol barang di HP meja: nama, satuan bawaan, dan urutan. */
function CatalogForm({ onDone }: { onDone: () => void }) {
  const refresh = useRefresh();
  const catalog = useQuery(buwuhCatalogQuery);
  const [rows, setRows] = useState<BuwuhCatalogItem[] | null>(null);
  const current = rows ?? catalog.data?.items ?? null;

  const save = useMutation({
    mutationFn: (items: BuwuhCatalogItem[]) => adminApi.buwuh.saveCatalog({ items }),
    onSuccess: async () => {
      await refresh("buwuh");
      onDone();
    },
  });

  if (!current) return <p className="text-sm text-muted-foreground">Memuat…</p>;

  const update = (index: number, patch: Partial<BuwuhCatalogItem>) =>
    setRows(current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const move = (index: number, delta: -1 | 1) => {
    const next = [...current];
    const [row] = next.splice(index, 1);
    if (row) next.splice(index + delta, 0, row);
    setRows(next);
  };

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate(
      (current ?? [])
        .map((row) => ({ name: row.name.trim(), unit: row.unit.trim() }))
        .filter((row) => row.name),
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {current.map((row, index) => (
          // Urutan bisa berubah; indeks cukup karena isian tidak menyimpan keadaan sendiri.
          // biome-ignore lint/suspicious/noArrayIndexKey: baris tanpa id
          <li key={index} className="flex items-center gap-2">
            <ReorderButtons index={index} count={current.length} onMove={move} />
            <Input
              aria-label={`Nama barang ${index + 1}`}
              placeholder="Nama barang"
              maxLength={60}
              value={row.name}
              onChange={(e) => update(index, { name: e.target.value })}
              className="h-11 min-w-0 flex-1 text-base md:h-9 md:text-sm"
            />
            <Input
              aria-label={`Satuan barang ${index + 1}`}
              placeholder="Satuan"
              maxLength={20}
              value={row.unit}
              onChange={(e) => update(index, { unit: e.target.value })}
              className="h-11 w-24 text-base md:h-9 md:text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Hapus ${row.name || "baris"}`}
              onClick={() => setRows(current.filter((_, i) => i !== index))}
              className="size-11 text-muted-foreground md:size-9"
            >
              <X aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setRows([...current, { name: "", unit: "" }])}>
          <Plus aria-hidden />
          Tambah barang
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRows([...DEFAULT_BUWUH_CATALOG])}
          className="text-muted-foreground"
        >
          Kembalikan bawaan
        </Button>
      </div>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

/** Alamat pilihan (dusun/RT/desa) yang tampil sebagai tombol di HP meja, berurutan. */
function AddressesForm({ onDone }: { onDone: () => void }) {
  const refresh = useRefresh();
  const query = useQuery(buwuhAddressesQuery);
  const [rows, setRows] = useState<string[] | null>(null);
  const current = rows ?? query.data?.items ?? null;

  const save = useMutation({
    mutationFn: (items: string[]) => adminApi.buwuh.saveAddresses({ items }),
    onSuccess: async () => {
      await refresh("buwuh");
      onDone();
    },
  });

  if (!current) return <p className="text-sm text-muted-foreground">Memuat…</p>;

  const move = (index: number, delta: -1 | 1) => {
    const next = [...current];
    const [row] = next.splice(index, 1);
    if (row !== undefined) next.splice(index + delta, 0, row);
    setRows(next);
  };

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate((current ?? []).map((row) => row.trim()).filter(Boolean));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {current.map((row, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: baris tanpa id
          <li key={index} className="flex items-center gap-2">
            <ReorderButtons index={index} count={current.length} onMove={move} />
            <Input
              aria-label={`Alamat ${index + 1}`}
              placeholder="mis. Dsn Krajan"
              maxLength={200}
              value={row}
              onChange={(e) =>
                setRows(current.map((value, i) => (i === index ? e.target.value : value)))
              }
              className="h-11 min-w-0 flex-1 text-base md:h-9 md:text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Hapus ${row || "baris"}`}
              onClick={() => setRows(current.filter((_, i) => i !== index))}
              className="size-11 text-muted-foreground md:size-9"
            >
              <X aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" onClick={() => setRows([...current, ""])} className="self-start">
        <Plus aria-hidden />
        Tambah alamat
      </Button>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

function DeleteDialog({ entry, onClose }: { entry: BuwuhEntry | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.buwuh.remove(id),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("buwuh");
      onClose();
    },
  });

  return (
    <Dialog open={entry !== null} onClose={onClose} title="Hapus catatan buwuh?">
      {entry && (
        <>
          <p>
            Catatan dari <strong>{entry.name}</strong> dihapus dan totalnya ikut berkurang.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(entry.id)}
              disabled={remove.isPending}
            >
              Hapus catatan
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
