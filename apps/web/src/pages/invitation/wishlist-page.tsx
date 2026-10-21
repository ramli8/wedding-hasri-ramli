import { useMutation, useQuery } from "@tanstack/react-query";
import type { AdminWish, MediaRef } from "@wedding/shared";
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
import { adminApi } from "../../lib/admin-api.js";
import { useRefresh, wishesQuery } from "../../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; item: AdminWish };

export function WishlistPage() {
  const refresh = useRefresh();
  const wishes = useQuery(wishesQuery);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<AdminWish | null>(null);

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminApi.invitation.reorderWishes(ids),
    onSuccess: () => refresh("invitation"),
  });

  const receive = useMutation({
    mutationFn: (v: { wishId: string; guestId: string }) =>
      adminApi.invitation.receiveWishClaim(v.wishId, v.guestId),
    onSuccess: () => Promise.all([refresh("invitation"), refresh("received-gifts")]),
  });

  const unclaim = useMutation({
    mutationFn: (v: { wishId: string; guestId: string }) =>
      adminApi.invitation.removeWishClaim(v.wishId, v.guestId),
    onSuccess: () => refresh("invitation"),
  });

  const items = wishes.data ?? [];
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
          Ide hadiah untuk tamu yang ingin memberi barang. Isi jumlah yang dibutuhkan; tamu memilih
          sendiri dari halaman undangan dan namanya tampil di sini. Bila sudah penuh, hadiah tetap
          tampil tetapi diberi tanda.
        </p>
        <Button onClick={() => setEditing({ kind: "new" })}>
          <Plus className="size-4" aria-hidden /> Tambah hadiah
        </Button>
      </div>

      {wishes.isError && <Alert tone="error">{wishes.error.message}</Alert>}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}
      {unclaim.error && <Alert tone="error">{unclaim.error.message}</Alert>}
      {receive.error && <Alert tone="error">{receive.error.message}</Alert>}

      {wishes.data && items.length === 0 ? (
        <Card className="text-center text-ink-soft">Belum ada hadiah dalam wishlist.</Card>
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
                {item.photo && (
                  <img
                    src={item.photo.thumb}
                    alt=""
                    width={item.photo.width}
                    height={item.photo.height}
                    className="size-24 shrink-0 border-2 border-ink object-cover"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold">{item.name}</p>
                    <Badge variant="pill">
                      {item.isFulfilled ? "Terpenuhi" : `${item.claimed}/${item.quantity}`}
                    </Badge>
                  </div>
                  {item.note && <p className="text-sm break-words">{item.note}</p>}
                  {item.claims.length > 0 && (
                    <ul className="mt-1 flex flex-col gap-1 text-sm">
                      {item.claims.map((claim) => (
                        <li key={claim.guestId} className="flex flex-wrap items-center gap-2">
                          <span>
                            Dipilih <strong>{claim.guestName}</strong>
                            {item.quantity > 1 ? ` × ${claim.quantity}` : ""}
                          </span>
                          {claim.receivedGiftId ? (
                            <Badge variant="pillAcid">Sudah diterima</Badge>
                          ) : (
                            <button
                              type="button"
                              className="font-semibold underline"
                              disabled={receive.isPending}
                              onClick={() =>
                                receive.mutate({ wishId: item.id, guestId: claim.guestId })
                              }
                            >
                              Tandai diterima
                            </button>
                          )}
                          <button
                            type="button"
                            className="underline hover:text-alert"
                            disabled={unclaim.isPending}
                            onClick={() =>
                              unclaim.mutate({ wishId: item.id, guestId: claim.guestId })
                            }
                          >
                            Lepas
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm underline"
                    >
                      {item.url}
                    </a>
                  )}
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
        title={editing?.kind === "edit" ? "Ubah hadiah" : "Tambah hadiah"}
      >
        {editing && (
          <WishForm
            item={editing.kind === "edit" ? editing.item : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function WishForm({ item, onDone }: { item: AdminWish | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [name, setName] = useState(item?.name ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [photo, setPhoto] = useState<MediaRef | null>(item?.photo ?? null);
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));

  const save = useMutation({
    mutationFn: () => {
      const input = {
        name,
        note,
        url,
        photoMediaId: photo?.id ?? null,
        quantity: Number(quantity),
      };
      return item
        ? adminApi.invitation.updateWish(item.id, input)
        : adminApi.invitation.createWish(input);
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

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Nama hadiah">
        {(id) => (
          <Input
            id={id}
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </Field>
      <Field label="Keterangan" hint="Opsional, mis. warna atau ukuran.">
        {(id) => (
          <Input id={id} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        )}
      </Field>
      <Field label="Tautan toko" hint="Opsional, diawali https://">
        {(id) => (
          <Input
            id={id}
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}
      </Field>
      <ImageField
        label="Foto"
        value={photo}
        onChange={setPhoto}
        recommendation="persegi 1:1, 800 × 800 px. Di undangan foto tampil kecil sebagai kotak, dan sisi yang tidak persegi dipotong dari tengah."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jumlah dibutuhkan" hint="Yang terpenuhi dihitung dari pilihan tamu.">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          )}
        </Field>
      </div>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending || !name.trim()}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: AdminWish | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.invitation.removeWish(id),
    onSuccess: async () => {
      await refresh("invitation");
      onClose();
    },
  });

  return (
    <Dialog open={item !== null} onClose={onClose} title={`Hapus “${item?.name}”?`}>
      {item && (
        <>
          <p>Hadiah ini dan fotonya dihapus dari wishlist.</p>
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
              Hapus hadiah
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
