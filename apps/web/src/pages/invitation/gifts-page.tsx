import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GIFT_KIND_LABEL,
  GIFT_KINDS,
  type Gift,
  type GiftKind,
  type MediaRef,
} from "@wedding/shared";
import { ArrowDown, ArrowUp, Plus, SquarePen, Trash2, Wallet } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { ImageField } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { EmptyState, Tip, Toolbar } from "@/components/kit/invitation-kit";
import { ReorderButtons } from "@/components/kit/reorder-buttons";
import { Select } from "@/components/kit/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi } from "../../lib/admin-api.js";
import { giftsQuery, useRefresh } from "../../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; item: Gift };

export function GiftsPage() {
  const refresh = useRefresh();
  const gifts = useQuery(giftsQuery);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Gift | null>(null);

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminApi.invitation.reorderGifts(ids),
    onSuccess: () => refresh("invitation"),
  });

  const items = gifts.data ?? [];
  const move = (index: number, delta: -1 | 1) => {
    const ids = items.map((item) => item.id);
    const target = index + delta;
    const a = ids[index];
    const b = ids[target];
    if (a === undefined || b === undefined) return;
    ids[index] = b;
    ids[target] = a;
    reorder.mutate(ids);
  };

  return (
    <>
      <Toolbar
        summary={`${items.length} rekening`}
        addLabel="Tambah rekening"
        onAdd={() => setEditing({ kind: "new" })}
      />
      <Tip>
        Tamu bisa menyalin nomor rekening dengan satu ketukan. Gambar QR (mis. QRIS) opsional.
      </Tip>

      {gifts.isError && <Alert tone="error">{gifts.error.message}</Alert>}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}

      {gifts.data && items.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada rekening"
          description="Tambahkan rekening bank atau e-wallet untuk tamu yang ingin mengirim hadiah."
          addLabel="Tambah rekening"
          onAdd={() => setEditing({ kind: "new" })}
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li key={item.id}>
              <Card className="flex-row flex-wrap items-start gap-4 p-4">
                <ReorderButtons
                  index={index}
                  count={items.length}
                  busy={reorder.isPending}
                  onMove={move}
                />
                {item.qr && (
                  <img
                    src={item.qr.thumb}
                    alt="QR"
                    width={item.qr.width}
                    height={item.qr.height}
                    className="size-20 shrink-0 rounded-lg border object-cover"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{GIFT_KIND_LABEL[item.kind]}</Badge>
                    <p className="font-semibold">{item.provider}</p>
                  </div>
                  <p className="font-mono text-lg break-all">{item.accountNumber}</p>
                  <p className="text-sm text-muted-foreground">a.n. {item.accountName}</p>
                </div>
                <DataTableRowActions
                  actions={[
                    {
                      label: "Ubah",
                      icon: <SquarePen />,
                      onSelect: () => setEditing({ kind: "edit", item }),
                    },
                    "separator",
                    {
                      label: "Hapus",
                      icon: <Trash2 />,
                      destructive: true,
                      onSelect: () => setDeleting(item),
                    },
                  ]}
                />
              </Card>
            </li>
          ))}
        </ol>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        wide
        title={editing?.kind === "edit" ? "Ubah rekening" : "Tambah rekening"}
      >
        {editing && (
          <GiftForm
            item={editing.kind === "edit" ? editing.item : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function GiftForm({ item, onDone }: { item: Gift | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [kind, setKind] = useState<GiftKind>(item?.kind ?? "bank");
  const [provider, setProvider] = useState(item?.provider ?? "");
  const [accountName, setAccountName] = useState(item?.accountName ?? "");
  const [accountNumber, setAccountNumber] = useState(item?.accountNumber ?? "");
  const [qr, setQr] = useState<MediaRef | null>(item?.qr ?? null);

  const save = useMutation({
    mutationFn: () => {
      const input = { kind, provider, accountName, accountNumber, qrMediaId: qr?.id ?? null };
      return item
        ? adminApi.invitation.updateGift(item.id, input)
        : adminApi.invitation.createGift(input);
    },
    onSuccess: async () => {
      await refresh("invitation");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const ready = provider.trim() && accountName.trim() && accountNumber.trim();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenis">
          {(id) => (
            <Select id={id} value={kind} onChange={(e) => setKind(e.target.value as GiftKind)}>
              {GIFT_KINDS.map((value) => (
                <option key={value} value={value}>
                  {GIFT_KIND_LABEL[value]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={kind === "bank" ? "Nama bank" : "Nama e-wallet"} hint="Mis. BCA, DANA.">
          {(id) => (
            <Input
              id={id}
              required
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          )}
        </Field>
        <Field label={kind === "bank" ? "Nomor rekening" : "Nomor"}>
          {(id) => (
            <Input
              id={id}
              required
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          )}
        </Field>
        <Field label="Atas nama">
          {(id) => (
            <Input
              id={id}
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          )}
        </Field>
      </div>
      <ImageField
        label="Gambar QR (opsional, mis. QRIS)"
        value={qr}
        onChange={setQr}
        recommendation="persegi 1:1, minimal 800 × 800 px, jangan dipotong rapat (sisakan tepi putih di sekeliling kode agar tetap terbaca saat dipindai)."
      />

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending || !ready}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: Gift | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.invitation.removeGift(id),
    onSuccess: async () => {
      await refresh("invitation");
      onClose();
    },
  });

  return (
    <Dialog open={item !== null} onClose={onClose} title={`Hapus ${item?.provider}?`}>
      {item && (
        <>
          <p>Rekening ini dihapus dari undangan.</p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(item.id)}
              disabled={remove.isPending}
            >
              Hapus rekening
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
