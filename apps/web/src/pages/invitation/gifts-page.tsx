import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GIFT_KIND_LABEL,
  GIFT_KINDS,
  type Gift,
  type GiftKind,
  type MediaRef,
} from "@wedding/shared";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ImageField } from "../../components/image-field.js";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Dialog } from "../../components/ui/dialog.js";
import { Field } from "../../components/ui/field.js";
import { Input } from "../../components/ui/input.js";
import { Select } from "../../components/ui/select.js";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-ink-soft">
          Rekening bank dan e-wallet untuk tamu yang ingin mengirim hadiah. Tamu bisa menyalin
          nomornya dengan satu ketukan.
        </p>
        <Button onClick={() => setEditing({ kind: "new" })}>
          <Plus className="size-4" aria-hidden /> Tambah rekening
        </Button>
      </div>

      {gifts.isError && <Alert tone="error">{gifts.error.message}</Alert>}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}

      {gifts.data && items.length === 0 ? (
        <Card className="text-center text-ink-soft">
          Belum ada rekening. Tambahkan rekening bank atau e-wallet Anda.
        </Card>
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((item, index) => (
            <li key={item.id}>
              <Card className="flex flex-wrap items-start gap-4">
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label="Naikkan"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorder.isPending}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label="Turunkan"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1 || reorder.isPending}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </Button>
                </div>
                {item.qr && (
                  <img
                    src={item.qr.thumb}
                    alt="QR"
                    width={item.qr.width}
                    height={item.qr.height}
                    className="size-24 shrink-0 border-2 border-ink object-cover"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="tag">{GIFT_KIND_LABEL[item.kind]}</Badge>
                    <p className="font-display text-lg font-bold">{item.provider}</p>
                  </div>
                  <p className="font-mono text-lg break-all">{item.accountNumber}</p>
                  <p className="text-sm text-ink-soft">a.n. {item.accountName}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditing({ kind: "edit", item })}
                  >
                    Ubah
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(item)}>
                    Hapus
                  </Button>
                </div>
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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
      <ImageField label="Gambar QR (opsional, mis. QRIS)" value={qr} onChange={setQr} />

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
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
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
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
