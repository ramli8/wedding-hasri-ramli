import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  RECEIVED_GIFT_KIND_LABEL,
  RECEIVED_GIFT_KINDS,
  type ReceivedGift,
  type ReceivedGiftKind,
} from "@wedding/shared";
import {
  Check,
  Download,
  Gift,
  HeartHandshake,
  Link2,
  type LucideIcon,
  Plus,
  Send,
  SquarePen,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableBulkActions } from "@/components/data-table/bulk-actions";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { selectColumn } from "@/components/data-table/select-column";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormSection } from "@/components/kit/form-rows";
import { Select } from "@/components/kit/select";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { adminApi, downloads } from "../lib/admin-api.js";
import { formatRupiah, parseAmount } from "../lib/format.js";
import { receivedGiftsQuery, useRefresh } from "../lib/queries.js";
import { ThanksDialog } from "./received-gifts-thanks-dialog.js";

type Thanked = "" | "yes" | "no";
type Editing = { kind: "new" } | { kind: "edit"; gift: ReceivedGift };

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
        <div className="text-2xl font-bold break-words">{value}</div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

const THANKED_OPTIONS = [
  { label: "Belum dibalas", value: "no" },
  { label: "Sudah dibalas", value: "yes" },
];

export function ReceivedGiftsPage() {
  const refresh = useRefresh();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<ReceivedGift | null>(null);
  const [thanking, setThanking] = useState(false);

  const list = useQuery(receivedGiftsQuery({}));
  const items = list.data?.items ?? [];
  const summary = list.data?.summary;

  const thank = useMutation({
    mutationFn: (v: { id: string; thanked: boolean }) =>
      adminApi.receivedGifts.thank(v.id, v.thanked),
    onSuccess: () => refresh("received-gifts"),
  });

  const columns: ColumnDef<ReceivedGift, unknown>[] = [
    selectColumn<ReceivedGift>(),
    {
      id: "pemberi",
      accessorFn: (gift) => gift.giverName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pemberi" />,
      cell: ({ row }) => (
        <div className="max-w-64">
          <p className="truncate font-medium">{row.original.giverName}</p>
          {row.original.note && (
            <p className="truncate text-xs text-muted-foreground">{row.original.note}</p>
          )}
        </div>
      ),
    },
    {
      id: "jenis",
      accessorFn: (gift) => gift.kind,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis" />,
      cell: ({ row }) => (
        <Badge variant="secondary">{RECEIVED_GIFT_KIND_LABEL[row.original.kind]}</Badge>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      id: "nilai",
      accessorFn: (gift) => gift.amount ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai" />,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.kind === "barang"
            ? row.original.itemDescription
            : row.original.amount !== null && formatRupiah(row.original.amount)}
        </span>
      ),
    },
    {
      id: "diterima",
      accessorFn: (gift) => gift.receivedOn,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Diterima" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.receivedOn}</span>,
    },
    {
      id: "terimakasih",
      accessorFn: (gift) => (gift.thankedAt ? "yes" : "no"),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Terima kasih" />,
      cell: ({ row }) =>
        row.original.thankedAt ? (
          <Badge variant="outline">Sudah dibalas</Badge>
        ) : (
          <Badge variant="secondary">Belum</Badge>
        ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      id: "aksi",
      cell: ({ row }) => {
        const gift = row.original;
        return (
          <DataTableRowActions
            actions={[
              {
                label: gift.thankedAt ? "Batalkan balasan" : "Tandai dibalas",
                icon: <Check />,
                onSelect: () => thank.mutate({ id: gift.id, thanked: !gift.thankedAt }),
              },
              {
                label: "Ubah",
                icon: <SquarePen />,
                onSelect: () => setEditing({ kind: "edit", gift }),
              },
              "separator",
              {
                label: "Hapus",
                icon: <Trash2 />,
                destructive: true,
                onSelect: () => setDeleting(gift),
              },
            ]}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Hadiah masuk"
        description="Catat amplop, transfer, dan barang yang diterima, lalu tandai bila sudah dibalas ucapan terima kasih."
        actions={
          <>
            {summary && summary.notThanked > 0 && (
              <Button variant="outline" onClick={() => setThanking(true)}>
                <Send aria-hidden />
                Kirim terima kasih
              </Button>
            )}
            <a
              href={downloads.receivedGiftsCsv({})}
              className={buttonVariants({ variant: "outline" })}
            >
              <Download aria-hidden />
              Ekspor
            </a>
            <Button onClick={() => setEditing({ kind: "new" })}>
              Catat hadiah
              <Plus aria-hidden />
            </Button>
          </>
        }
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={Wallet}
            label="Total uang"
            value={formatRupiah(summary.amplopTotal + summary.transferTotal)}
            note={`${summary.count - summary.barangCount} pemberian · amplop ${formatRupiah(summary.amplopTotal)} · transfer ${formatRupiah(summary.transferTotal)}`}
          />
          <Stat icon={Gift} label="Barang" value={String(summary.barangCount)} note="dicatat" />
          <Stat
            icon={HeartHandshake}
            label="Belum dibalas"
            value={String(summary.notThanked)}
            note="ucapan terima kasih"
          />
          <Stat icon={Gift} label="Total catatan" value={String(summary.count)} />
        </div>
      )}

      {list.isError && <Alert tone="error">{list.error.message}</Alert>}
      {thank.error && <Alert tone="error">{thank.error.message}</Alert>}

      <DataTable
        columns={columns}
        data={items}
        getRowId={(gift) => gift.id}
        searchPlaceholder="Cari pemberi atau barang"
        searchKey="pemberi"
        emptyText={
          list.isPending
            ? "Memuat…"
            : "Belum ada hadiah yang dicatat. Klik “Catat hadiah” untuk mulai."
        }
        filters={[
          {
            columnId: "jenis",
            title: "Jenis",
            options: RECEIVED_GIFT_KINDS.map((value) => ({
              label: RECEIVED_GIFT_KIND_LABEL[value],
              value,
            })),
          },
          { columnId: "terimakasih", title: "Terima kasih", options: THANKED_OPTIONS },
        ]}
        bulkActions={(table) => (
          <DataTableBulkActions table={table} entityName="catatan">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await Promise.all(
                  table
                    .getFilteredSelectedRowModel()
                    .rows.filter((row) => !row.original.thankedAt)
                    .map((row) => thank.mutateAsync({ id: row.original.id, thanked: true })),
                );
                table.resetRowSelection();
              }}
            >
              <Check aria-hidden />
              Tandai dibalas
            </Button>
          </DataTableBulkActions>
        )}
      />

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        wide
        title={editing?.kind === "edit" ? "Ubah catatan hadiah" : "Catat hadiah"}
      >
        {editing && (
          <GiftForm
            gift={editing.kind === "edit" ? editing.gift : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <ThanksDialog open={thanking} onClose={() => setThanking(false)} />
      <DeleteDialog gift={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function GiftForm({ gift, onDone }: { gift: ReceivedGift | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [guestId, setGuestId] = useState<string | null>(gift?.guestId ?? null);
  const [giverName, setGiverName] = useState(gift?.giverName ?? "");
  const [kind, setKind] = useState<ReceivedGiftKind>(gift?.kind ?? "amplop");
  const [amount, setAmount] = useState(gift?.amount ? String(gift.amount) : "");
  const [item, setItem] = useState(gift?.itemDescription ?? "");
  const [note, setNote] = useState(gift?.note ?? "");
  const [receivedOn, setReceivedOn] = useState(gift?.receivedOn ?? todayWib());
  const [guestSearch, setGuestSearch] = useState("");

  const guests = useQuery({
    queryKey: ["guests", "picker", guestSearch],
    queryFn: () => adminApi.guests.list({ q: guestSearch, pageSize: 6 }),
    enabled: guestSearch.trim().length >= 2,
  });

  const parsed = parseAmount(amount);
  const isItem = kind === "barang";
  const valid =
    (giverName.trim() || guestId) && (isItem ? item.trim() : parsed !== null && parsed > 0);

  const save = useMutation({
    mutationFn: () => {
      const input = {
        guestId,
        giverName,
        kind,
        amount: isItem ? null : parsed,
        itemDescription: isItem ? item : null,
        note,
        receivedOn,
      };
      return gift
        ? adminApi.receivedGifts.update(gift.id, input)
        : adminApi.receivedGifts.create(input);
    },
    onSuccess: async () => {
      await refresh("received-gifts");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection title="Pemberi">
        <Field label="Nama pemberi" hint="Tulis bebas, mis. “Keluarga Pak Hadi”.">
          {(id) => (
            <Input
              id={id}
              value={giverName}
              maxLength={120}
              onChange={(e) => setGiverName(e.target.value)}
            />
          )}
        </Field>
        <div className="grid gap-2">
          <p className="text-sm leading-none font-medium">
            Tamu undangan <span className="font-normal text-muted-foreground">(opsional)</span>
          </p>
          {guestId ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <p className="flex items-center gap-2 text-sm">
                <Link2 className="size-4 text-muted-foreground" aria-hidden />
                Tertaut ke tamu terdaftar
              </p>
              <Button size="sm" variant="ghost" onClick={() => setGuestId(null)}>
                <X aria-hidden />
                Lepas
              </Button>
            </div>
          ) : (
            <Command shouldFilter={false} className="rounded-lg border">
              <CommandInput
                placeholder="Cari tamu undangan…"
                value={guestSearch}
                onValueChange={setGuestSearch}
              />
              <CommandList className="max-h-44">
                {guestSearch.trim().length < 2 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Ketik minimal 2 huruf untuk mencari.
                  </p>
                ) : guests.isFetching ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">Mencari…</p>
                ) : (
                  <>
                    <CommandEmpty>Tidak ada tamu yang cocok.</CommandEmpty>
                    <CommandGroup>
                      {guests.data?.items.map((guest) => (
                        <CommandItem
                          key={guest.id}
                          value={guest.id}
                          onSelect={() => {
                            setGuestId(guest.id);
                            setGiverName(guest.displayName);
                            setGuestSearch("");
                          }}
                        >
                          {guest.displayName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          )}
          <p className="text-sm text-muted-foreground">
            Menautkan membuat hadiah ini tercatat atas nama tamu itu dan memudahkan ucapan terima
            kasih.
          </p>
        </div>
      </FormSection>

      <FormSection title="Hadiah">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jenis">
            {(id) => (
              <Select
                id={id}
                value={kind}
                onChange={(e) => setKind(e.target.value as ReceivedGiftKind)}
              >
                {RECEIVED_GIFT_KINDS.map((value) => (
                  <option key={value} value={value}>
                    {RECEIVED_GIFT_KIND_LABEL[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Tanggal diterima">
            {(id) => (
              <Input
                id={id}
                type="date"
                required
                value={receivedOn}
                onChange={(e) => setReceivedOn(e.target.value)}
              />
            )}
          </Field>
        </div>

        {isItem ? (
          <Field label="Nama barang">
            {(id) => (
              <Input
                id={id}
                required
                maxLength={200}
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
            )}
          </Field>
        ) : (
          <Field
            label="Nominal (Rp)"
            hint={parsed ? formatRupiah(parsed) : "Angka saja, mis. 500000. Titik pemisah boleh."}
          >
            {(id) => (
              <Input
                id={id}
                required
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            )}
          </Field>
        )}

        <Field label="Catatan" hint="Opsional, mis. bank pengirim atau titipan siapa.">
          {(id) => (
            <Input id={id} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>
      </FormSection>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending || !valid}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({ gift, onClose }: { gift: ReceivedGift | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.receivedGifts.remove(id),
    onSuccess: async () => {
      await refresh("received-gifts");
      onClose();
    },
  });

  return (
    <Dialog open={gift !== null} onClose={onClose} title="Hapus catatan hadiah?">
      {gift && (
        <>
          <p>
            Catatan dari <strong>{gift.giverName}</strong> dihapus permanen dan totalnya ikut
            berkurang.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(gift.id)}
              disabled={remove.isPending}
            >
              Hapus catatan
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
