import { useMutation, useQuery } from "@tanstack/react-query";
import {
  RECEIVED_GIFT_KIND_LABEL,
  RECEIVED_GIFT_KINDS,
  type ReceivedGift,
  type ReceivedGiftKind,
} from "@wedding/shared";
import { Check, Download, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { PageHeader } from "../components/page-header.js";
import { Alert } from "../components/ui/alert.js";
import { Badge } from "../components/ui/badge.js";
import { Button, buttonStyles } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Dialog } from "../components/ui/dialog.js";
import { Field } from "../components/ui/field.js";
import { Input } from "../components/ui/input.js";
import { Select } from "../components/ui/select.js";
import { adminApi, downloads } from "../lib/admin-api.js";
import { formatRupiah, parseAmount } from "../lib/format.js";
import { receivedGiftsQuery, useRefresh } from "../lib/queries.js";
import { ThanksDialog } from "./received-gifts-thanks-dialog.js";

type Thanked = "" | "yes" | "no";
type Editing = { kind: "new" } | { kind: "edit"; gift: ReceivedGift };

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <p className="tag text-ink-soft">{label}</p>
      <p className="font-display text-2xl leading-tight font-bold break-words">{value}</p>
      {note && <p className="text-xs text-ink-soft">{note}</p>}
    </Card>
  );
}

const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

export function ReceivedGiftsPage() {
  const refresh = useRefresh();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<ReceivedGiftKind | "">("");
  const [thanked, setThanked] = useState<Thanked>("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<ReceivedGift | null>(null);
  const [thanking, setThanking] = useState(false);

  const filter = {
    q: search,
    kind: kind || undefined,
    thanked: thanked === "" ? undefined : thanked === "yes",
  };
  const list = useQuery(receivedGiftsQuery(filter));
  const items = list.data?.items ?? [];
  const summary = list.data?.summary;

  const thank = useMutation({
    mutationFn: (v: { id: string; thanked: boolean }) =>
      adminApi.receivedGifts.thank(v.id, v.thanked),
    onSuccess: () => refresh("received-gifts"),
  });

  return (
    <>
      <PageHeader
        tag="Hadiah"
        title="Hadiah masuk"
        description="Catat amplop, transfer, dan barang yang diterima, lalu tandai bila sudah dibalas ucapan terima kasih."
        actions={
          <>
            {summary && summary.notThanked > 0 && (
              <Button variant="secondary" onClick={() => setThanking(true)}>
                Kirim terima kasih
              </Button>
            )}
            <a
              href={downloads.receivedGiftsCsv(filter)}
              className={buttonStyles({ variant: "secondary" })}
            >
              <Download className="size-4" aria-hidden />
              Ekspor CSV
            </a>
            <Button onClick={() => setEditing({ kind: "new" })}>
              <Plus className="size-4" aria-hidden /> Catat hadiah
            </Button>
          </>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat
            label="Total uang"
            value={formatRupiah(summary.amplopTotal + summary.transferTotal)}
            note={`${summary.count - summary.barangCount} pemberian`}
          />
          <Stat label="Amplop" value={formatRupiah(summary.amplopTotal)} />
          <Stat label="Transfer" value={formatRupiah(summary.transferTotal)} />
          <Stat label="Barang" value={String(summary.barangCount)} />
          <Stat
            label="Belum dibalas"
            value={String(summary.notThanked)}
            note="ucapan terima kasih"
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Input
            type="search"
            aria-label="Cari pemberi atau barang"
            placeholder="Cari pemberi atau barang"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            compact
            aria-label="Jenis"
            value={kind}
            onChange={(e) => setKind(e.target.value as ReceivedGiftKind | "")}
          >
            <option value="">Semua jenis</option>
            {RECEIVED_GIFT_KINDS.map((value) => (
              <option key={value} value={value}>
                {RECEIVED_GIFT_KIND_LABEL[value]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-52">
          <Select
            compact
            aria-label="Terima kasih"
            value={thanked}
            onChange={(e) => setThanked(e.target.value as Thanked)}
          >
            <option value="">Semua status</option>
            <option value="no">Belum dibalas</option>
            <option value="yes">Sudah dibalas</option>
          </Select>
        </div>
      </div>

      {list.isError && <Alert tone="error">{list.error.message}</Alert>}
      {thank.error && <Alert tone="error">{thank.error.message}</Alert>}

      {list.data && items.length === 0 ? (
        <Card className="text-center text-ink-soft">
          {summary?.count
            ? "Tidak ada catatan yang cocok dengan filter."
            : "Belum ada hadiah yang dicatat."}
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((gift) => (
            <li key={gift.id}>
              <Card className="flex flex-wrap items-start gap-4 p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold break-words">{gift.giverName}</p>
                    <Badge variant="tag">{RECEIVED_GIFT_KIND_LABEL[gift.kind]}</Badge>
                    {gift.thankedAt && <Badge variant="pill">Sudah dibalas</Badge>}
                  </div>
                  <p className="text-lg font-semibold break-words">
                    {gift.kind === "barang"
                      ? gift.itemDescription
                      : gift.amount !== null && formatRupiah(gift.amount)}
                  </p>
                  {gift.note && <p className="text-sm break-words text-ink-soft">{gift.note}</p>}
                  <p className="text-xs text-ink-soft">
                    Diterima {gift.receivedOn}
                    {gift.recordedBy ? ` · dicatat ${gift.recordedBy}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={thank.isPending}
                    onClick={() => thank.mutate({ id: gift.id, thanked: !gift.thankedAt })}
                  >
                    <Check className="size-4" aria-hidden />
                    {gift.thankedAt ? "Batalkan balasan" : "Sudah dibalas"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditing({ kind: "edit", gift })}
                  >
                    Ubah
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(gift)}>
                    Hapus
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        label="Pemberi"
        hint="Ketik nama, atau cari tamu undangan di bawah untuk menautkannya."
      >
        {(id) => (
          <Input
            id={id}
            value={giverName}
            maxLength={120}
            onChange={(e) => setGiverName(e.target.value)}
          />
        )}
      </Field>
      {guestId ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="pill">Tamu terdaftar tertaut</Badge>
          <button type="button" className="underline" onClick={() => setGuestId(null)}>
            Lepas tautan
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Input
            type="search"
            aria-label="Cari tamu undangan"
            placeholder="Cari tamu undangan (opsional)"
            value={guestSearch}
            onChange={(e) => setGuestSearch(e.target.value)}
          />
          {guests.data && guests.data.items.length > 0 && (
            <ul className="flex flex-col border-2 border-ink">
              {guests.data.items.map((guest) => (
                <li key={guest.id} className="border-b border-ink last:border-b-0">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-acid"
                    onClick={() => {
                      setGuestId(guest.id);
                      setGiverName(guest.displayName);
                      setGuestSearch("");
                    }}
                  >
                    {guest.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
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
            <Button variant="secondary" onClick={onClose}>
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
