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
  Ellipsis,
  Gift,
  HeartHandshake,
  Link2,
  ListChecks,
  type LucideIcon,
  Plus,
  Send,
  SquarePen,
  Trash2,
  Wallet,
} from "lucide-react";
import { type FormEvent, useDeferredValue, useState } from "react";
import { DataTableBulkActions } from "@/components/data-table/bulk-actions";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { selectColumn } from "@/components/data-table/select-column";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { MoneyInput } from "@/components/kit/money-input";
import { toast } from "@/components/kit/toast";
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
import { groupsQuery, receivedGiftsQuery, useRefresh } from "../lib/queries.js";
import { ThanksQueueDialog, ThanksSendDialog } from "./received-gifts-thanks-dialog.js";

type Editing = { kind: "new" } | { kind: "edit"; gift: ReceivedGift };

function Stat({
  label,
  value,
  note,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0", className)}>
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

const THANKED_OPTIONS = [
  { label: "Belum dibalas", value: "no" },
  { label: "Sudah dibalas", value: "yes" },
];

export function ReceivedGiftsPage() {
  const refresh = useRefresh();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<ReceivedGift | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);

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
      // Kotak cari memfilter kolom ini: cocokkan juga nama barang dan catatan.
      filterFn: (row, _id, value: string) => {
        const needle = value.toLowerCase();
        const { giverName, itemDescription, note } = row.original;
        return [giverName, itemDescription, note].some((text) =>
          text?.toLowerCase().includes(needle),
        );
      },
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
      id: "terimakasih",
      accessorFn: (gift) => (gift.thankedAt ? "yes" : "no"),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Terima kasih" />,
      cell: ({ row }) => {
        const gift = row.original;
        const busy = thank.isPending && thank.variables?.id === gift.id;
        return gift.thankedAt ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            aria-label={`Batalkan tanda dibalas untuk ${gift.giverName}`}
            onClick={() => thank.mutate({ id: gift.id, thanked: false })}
            className="text-muted-foreground"
          >
            <Check aria-hidden />
            Sudah dibalas
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => thank.mutate({ id: gift.id, thanked: true })}
          >
            Tandai dibalas
          </Button>
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      id: "aksi",
      cell: ({ row }) => {
        const gift = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSendingId(gift.id)}
              title="Kirim terima kasih"
            >
              <Send aria-hidden />
              <span className="md:max-xl:sr-only">Kirim</span>
            </Button>
            <DataTableRowActions
              actions={[
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
          </div>
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
            {items.length > 0 && (
              <Button variant="outline" onClick={() => setQueueOpen(true)}>
                <ListChecks aria-hidden />
                Kirim beruntun
              </Button>
            )}
            <Button onClick={() => setEditing({ kind: "new" })}>
              Catat hadiah
              <Plus aria-hidden />
            </Button>
            <MoreMenu />
          </>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat
            icon={Wallet}
            label="Total uang"
            value={formatRupiah(summary.amplopTotal + summary.transferTotal)}
            note={`Amplop ${formatRupiah(summary.amplopTotal)} · Transfer ${formatRupiah(summary.transferTotal)}`}
            className="max-sm:col-span-2"
          />
          <Stat icon={Gift} label="Barang" value={String(summary.barangCount)} />
          <Stat icon={HeartHandshake} label="Belum dibalas" value={String(summary.notThanked)} />
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
        title={editing?.kind === "edit" ? "Ubah catatan hadiah" : "Catat hadiah"}
      >
        {editing && (
          <GiftForm
            gift={editing.kind === "edit" ? editing.gift : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <ThanksQueueDialog open={queueOpen} onClose={() => setQueueOpen(false)} />
      <ThanksSendDialog giftId={sendingId} onClose={() => setSendingId(null)} />
      <DeleteDialog gift={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

/** Pecahan uang kertas rupiah untuk tombol tambah nominal. */
const BANKNOTES = [5_000, 10_000, 20_000, 50_000, 100_000] as const;

/** Label pendek tombol Jenis di formulir. */
const KIND_SHORT_LABEL: Record<ReceivedGiftKind, string> = {
  amplop: "Amplop",
  transfer: "Transfer",
  barang: "Barang",
};

/** Aksi yang jarang dipakai dikumpulkan di satu menu agar header ringkas di HP. */
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
          <a href={downloads.receivedGiftsXlsx({})}>
            <Download />
            Ekspor Excel
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GiftForm({ gift, onDone }: { gift: ReceivedGift | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [kind, setKind] = useState<ReceivedGiftKind>(gift?.kind ?? "amplop");
  const [guestId, setGuestId] = useState<string | null>(gift?.guestId ?? null);
  const [giverName, setGiverName] = useState(gift?.giverName ?? "");
  const [giverPhone, setGiverPhone] = useState(gift?.giverPhone ?? "");
  const [giverInstagram, setGiverInstagram] = useState(gift?.giverInstagram ?? "");
  const [amount, setAmount] = useState<number | null>(gift?.amount ?? null);
  const [item, setItem] = useState(gift?.itemDescription ?? "");
  const [note, setNote] = useState(gift?.note ?? "");
  const [submitted, setSubmitted] = useState(false);

  const isItem = kind === "barang";
  const errors = {
    giverName: !giverName.trim() && !guestId ? "Nama pemberi wajib diisi" : null,
    amount: !isItem && !(amount && amount > 0) ? "Nominal wajib diisi" : null,
    item: isItem && !item.trim() ? "Nama barang wajib diisi" : null,
  };
  const valid = !errors.giverName && !errors.amount && !errors.item;

  const save = useMutation({
    mutationFn: () => {
      const input = {
        guestId,
        giverName,
        giverPhone: guestId ? (gift?.giverPhone ?? null) : giverPhone,
        giverInstagram: guestId ? (gift?.giverInstagram ?? null) : giverInstagram,
        kind,
        amount: isItem ? null : amount,
        itemDescription: isItem ? item : null,
        note,
        // Tanggal tidak diisi admin: catatan baru memakai hari ini (WIB, di server), catatan lama
        // mempertahankan tanggal aslinya.
        receivedOn: gift?.receivedOn ?? null,
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
    setSubmitted(true);
    if (!valid) return;
    save.mutate();
  }

  const shown = (error: string | null) => (submitted ? error : null);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">Jenis</legend>
        <div className="grid grid-cols-3 gap-2">
          {RECEIVED_GIFT_KINDS.map((value) => (
            <Button
              key={value}
              variant={kind === value ? "default" : "outline"}
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
              className="h-11 md:h-10"
            >
              {KIND_SHORT_LABEL[value]}
            </Button>
          ))}
        </div>
      </fieldset>

      <GiverField
        name={giverName}
        guestId={guestId}
        error={shown(errors.giverName)}
        onType={(value) => {
          setGiverName(value);
          setGuestId(null);
        }}
        onPick={(guest) => {
          setGiverName(guest.displayName);
          setGuestId(guest.id);
        }}
      />

      {isItem ? (
        <Field label="Nama barang" required error={shown(errors.item)}>
          {(id) => (
            <Input
              id={id}
              maxLength={200}
              autoComplete="off"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="h-11 text-base md:h-9 md:text-sm"
            />
          )}
        </Field>
      ) : (
        <Field label="Nominal" required error={shown(errors.amount)}>
          {(id) => (
            <div className="grid gap-2">
              <MoneyInput id={id} placeholder="500.000" value={amount} onValueChange={setAmount} />
              {/* Menghitung isi amplop lembar demi lembar: setiap ketukan menambah satu pecahan. */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {BANKNOTES.map((note) => (
                  <Button
                    key={note}
                    variant="outline"
                    onClick={() => setAmount((current) => (current ?? 0) + note)}
                    className="h-11 md:h-9"
                  >
                    +{note / 1000}rb
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  disabled={!amount}
                  onClick={() => setAmount(null)}
                  className="h-11 text-muted-foreground md:h-9"
                >
                  Nol-kan
                </Button>
              </div>
            </div>
          )}
        </Field>
      )}

      {!guestId && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="No. HP">
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
                className="h-11 text-base md:h-9 md:text-sm"
              />
            )}
          </Field>
          <Field label="Instagram">
            {(id) => (
              <Input
                id={id}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="@username"
                maxLength={100}
                value={giverInstagram}
                onChange={(e) => setGiverInstagram(e.target.value)}
                className="h-11 text-base md:h-9 md:text-sm"
              />
            )}
          </Field>
        </div>
      )}

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

type GuestOption = { id: string; displayName: string; groupId: string | null };

/**
 * Satu kolom nama pemberi. Saat mengetik muncul tamu undangan yang cocok; memilihnya menautkan
 * catatan ke tamu itu (ucapan terima kasih memakai nomornya). Tanpa memilih, nama diketik bebas.
 */
function GiverField({
  name,
  guestId,
  error,
  onType,
  onPick,
}: {
  name: string;
  guestId: string | null;
  error: string | null;
  onType: (value: string) => void;
  onPick: (guest: GuestOption) => void;
}) {
  const query = useDeferredValue(name.trim());
  const searching = !guestId && query.length >= 2;
  const guests = useQuery({
    queryKey: ["guests", "picker", query],
    queryFn: () => adminApi.guests.list({ q: query, pageSize: 5 }),
    enabled: searching,
  });
  const matches = searching ? (guests.data?.items ?? []) : [];
  // Nama kelompok membedakan tamu yang namanya sama.
  const groups = useQuery({ ...groupsQuery, enabled: searching });
  const groupName = (groupId: string | null) =>
    groups.data?.find((group) => group.id === groupId)?.name;

  return (
    <Field label="Nama pemberi" required error={error}>
      {(id) => (
        <div className="grid gap-2">
          <div className="relative">
            <Input
              id={id}
              value={name}
              maxLength={120}
              autoComplete="off"
              autoFocus
              placeholder="Ketik nama…"
              onChange={(e) => onType(e.target.value)}
              className={cn("h-11 text-base md:h-9 md:text-sm", guestId && "pe-24")}
            />
            {guestId && (
              <Badge variant="secondary" className="absolute end-2 top-1/2 -translate-y-1/2">
                <Link2 aria-hidden />
                Tamu
              </Badge>
            )}
          </div>
          {matches.length > 0 && (
            <ul className="overflow-hidden rounded-md border" aria-label="Tamu undangan yang cocok">
              {matches.map((guest) => (
                <li key={guest.id} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onPick(guest)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-start text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <span className="truncate">{guest.displayName}</span>
                    {groupName(guest.groupId) && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {groupName(guest.groupId)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
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
          <DialogActions>
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
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
