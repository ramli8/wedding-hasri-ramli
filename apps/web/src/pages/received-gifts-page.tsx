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
import { FormFooter } from "@/components/kit/invitation-kit";
import { MoneyInput } from "@/components/kit/money-input";
import { toast } from "@/components/kit/toast";
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
import { formatRupiah } from "../lib/format.js";
import { receivedGiftsQuery, useRefresh } from "../lib/queries.js";
import { ThanksDialog } from "./received-gifts-thanks-dialog.js";

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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

/** Urutan tombol Jenis: yang paling sering dicatat di hari H dulu. */
const KIND_SHORT_LABEL: Record<ReceivedGiftKind, string> = {
  amplop: "Amplop",
  transfer: "Transfer",
  barang: "Barang",
};

function GiftForm({ gift, onDone }: { gift: ReceivedGift | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [guestId, setGuestId] = useState<string | null>(gift?.guestId ?? null);
  const [giverName, setGiverName] = useState(gift?.giverName ?? "");
  const [giverPhone, setGiverPhone] = useState(gift?.giverPhone ?? "");
  const [kind, setKind] = useState<ReceivedGiftKind>(gift?.kind ?? "amplop");
  const [amount, setAmount] = useState<number | null>(gift?.amount ?? null);
  const [item, setItem] = useState(gift?.itemDescription ?? "");
  const [note, setNote] = useState(gift?.note ?? "");
  const [receivedOn, setReceivedOn] = useState(gift?.receivedOn ?? todayWib());
  const [guestSearch, setGuestSearch] = useState("");

  const guests = useQuery({
    queryKey: ["guests", "picker", guestSearch],
    queryFn: () => adminApi.guests.list({ q: guestSearch, pageSize: 6 }),
    enabled: guestSearch.trim().length >= 2,
  });

  const isItem = kind === "barang";
  // Alasan tombol Simpan belum aktif, ditampilkan di atas tombol agar admin tahu apa yang kurang.
  const missing = [
    !giverName.trim() && !guestId && "nama pemberi (atau pilih tamu)",
    isItem ? !item.trim() && "nama barang" : !(amount && amount > 0) && "nominal",
  ].filter((reason): reason is string => Boolean(reason));
  const valid = missing.length === 0;

  const save = useMutation({
    mutationFn: () => {
      const input = {
        guestId,
        giverName,
        giverPhone: guestId ? (gift?.giverPhone ?? null) : giverPhone,
        kind,
        amount: isItem ? null : amount,
        itemDescription: isItem ? item : null,
        note,
        receivedOn,
      };
      return gift
        ? adminApi.receivedGifts.update(gift.id, input)
        : adminApi.receivedGifts.create(input);
    },
    // Pesan berisi apa yang baru dicatat, supaya pencatatan beruntun bisa dicek sekilas.
    meta: { toast: false },
    onSuccess: async ({ gift: saved }) => {
      const what =
        saved.kind === "barang"
          ? (saved.itemDescription ?? "Barang")
          : formatRupiah(saved.amount ?? 0);
      toast(`Tersimpan: ${what} dari ${saved.giverName}`);
      await refresh("received-gifts");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection title="Pemberi">
        {guestId ? (
          <div className="grid gap-2">
            <p className="text-sm leading-none font-medium">Tamu undangan</p>
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <p className="flex min-w-0 items-center gap-2 text-sm">
                <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">
                  Tertaut ke <strong>{giverName || "tamu terdaftar"}</strong>
                </span>
              </p>
              <Button size="sm" variant="ghost" onClick={() => setGuestId(null)}>
                Lepas
                <X aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <Field
            label="Cari tamu undangan"
            hint="Pilih tamu agar ucapan terima kasih langsung ke nomornya. Tidak ada? Tulis nama di bawah."
          >
            {(id) => (
              <Command shouldFilter={false} className="rounded-lg border">
                <CommandInput
                  id={id}
                  autoFocus
                  placeholder="Ketik nama tamu…"
                  value={guestSearch}
                  onValueChange={setGuestSearch}
                />
                {guestSearch.trim().length >= 2 && (
                  <CommandList className="max-h-44">
                    {guests.isFetching ? (
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
                )}
              </Command>
            )}
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={guestId ? "Nama pemberi" : "Atau tulis nama pemberi"}
            hint={guestId ? "Terisi dari nama tamu; boleh diubah." : "Mis. “Keluarga Pak Hadi”."}
          >
            {(id) => (
              <Input
                id={id}
                value={giverName}
                maxLength={120}
                autoComplete="off"
                onChange={(e) => setGiverName(e.target.value)}
              />
            )}
          </Field>
          {!guestId && (
            <Field
              label="Nomor HP pemberi"
              hint="Opsional. Dipakai untuk kirim ucapan terima kasih lewat WhatsApp."
            >
              {(id) => (
                <Input
                  id={id}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="08…"
                  maxLength={30}
                  value={giverPhone}
                  onChange={(e) => setGiverPhone(e.target.value)}
                />
              )}
            </Field>
          )}
        </div>
      </FormSection>

      <FormSection title="Hadiah">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm leading-none font-medium">Jenis</legend>
          <div className="grid grid-cols-3 gap-2">
            {RECEIVED_GIFT_KINDS.map((value) => (
              <Button
                key={value}
                variant={kind === value ? "default" : "outline"}
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
              >
                {KIND_SHORT_LABEL[value]}
              </Button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          {isItem ? (
            <Field label="Nama barang" required>
              {(id) => (
                <Input
                  id={id}
                  maxLength={200}
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                />
              )}
            </Field>
          ) : (
            <Field label="Nominal" required>
              {(id) => (
                <MoneyInput
                  id={id}
                  placeholder="500.000"
                  value={amount}
                  onValueChange={setAmount}
                />
              )}
            </Field>
          )}
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

        <Field label="Catatan" hint="Opsional, mis. bank pengirim atau titipan siapa.">
          {(id) => (
            <Input id={id} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>
      </FormSection>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      {!valid && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Lengkapi dulu: {missing.join(", ")}.
        </p>
      )}
      <FormFooter onCancel={onDone} pending={save.isPending} disabled={!valid} />
    </form>
  );
}

function DeleteDialog({ gift, onClose }: { gift: ReceivedGift | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.receivedGifts.remove(id),
    meta: { toast: "Terhapus" },
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
