import { useMutation, useQuery } from "@tanstack/react-query";
import type { AdminWish, MediaRef } from "@wedding/shared";
import { Gift, SquarePen, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { ImageField } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormSection } from "@/components/kit/form-rows";
import { EmptyState, FormFooter, Tip, Toolbar } from "@/components/kit/invitation-kit";
import { ReorderButtons } from "@/components/kit/reorder-buttons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi } from "../../lib/admin-api.js";
import { useRefresh, wishesQuery } from "../../lib/queries.js";
import { safeHref } from "../../lib/safe-url.js";

type Editing = { kind: "new" } | { kind: "edit"; item: AdminWish };
type Releasing = { wish: AdminWish; guestId: string; guestName: string };

export function WishlistPage() {
  const refresh = useRefresh();
  const wishes = useQuery(wishesQuery);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<AdminWish | null>(null);
  const [releasing, setReleasing] = useState<Releasing | null>(null);

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
    meta: { toast: "Pilihan tamu dilepas" },
    onSuccess: async () => {
      await refresh("invitation");
      setReleasing(null);
    },
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
      <Toolbar
        empty={!!wishes.data && items.length === 0}
        summary={`${items.length} hadiah`}
        addLabel="Tambah hadiah"
        onAdd={() => setEditing({ kind: "new" })}
      />
      <Tip>
        Isi jumlah yang dibutuhkan. Tamu memilih sendiri dari halaman undangan dan namanya tampil di
        sini; hadiah yang sudah penuh tetap tampil dengan tanda.
      </Tip>

      {wishes.isError && <Alert tone="error">{wishes.error.message}</Alert>}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}
      {receive.error && <Alert tone="error">{receive.error.message}</Alert>}

      {wishes.data && items.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Wishlist masih kosong"
          description="Tambahkan ide hadiah untuk tamu yang ingin memberi barang."
          addLabel="Tambah hadiah"
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
                {item.photo && (
                  <img
                    src={item.photo.thumb}
                    alt=""
                    width={item.photo.width}
                    height={item.photo.height}
                    className="size-20 shrink-0 rounded-lg border object-cover"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.name}</p>
                    <Badge variant="outline">
                      {item.isFulfilled ? "Terpenuhi" : `${item.claimed}/${item.quantity}`}
                    </Badge>
                  </div>
                  {item.note && <p className="text-sm break-words">{item.note}</p>}
                  {item.claims.length > 0 && (
                    <ul className="mt-1 flex flex-col gap-2 text-sm">
                      {item.claims.map((claim) => (
                        <li key={claim.guestId} className="flex flex-wrap items-center gap-2">
                          <span className="me-auto">
                            Dipilih <strong>{claim.guestName}</strong>
                            {item.quantity > 1 ? ` × ${claim.quantity}` : ""}
                          </span>
                          {claim.receivedGiftId ? (
                            <Badge variant="secondary">Sudah diterima</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={receive.isPending}
                              onClick={() =>
                                receive.mutate({ wishId: item.id, guestId: claim.guestId })
                              }
                            >
                              Tandai diterima
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={unclaim.isPending}
                            onClick={() =>
                              setReleasing({
                                wish: item,
                                guestId: claim.guestId,
                                guestName: claim.guestName,
                              })
                            }
                          >
                            Lepas
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.url && (
                    <a
                      href={safeHref(item.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm underline"
                    >
                      {item.url}
                    </a>
                  )}
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

      <AlertDialog open={releasing !== null} onOpenChange={(open) => !open && setReleasing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lepas pilihan {releasing?.guestName}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{releasing?.wish.name}” tidak lagi tercatat dipilih oleh tamu ini, dan tamu lain bisa
              memilihnya. Tamu tidak diberi tahu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {unclaim.error && <Alert tone="error">{unclaim.error.message}</Alert>}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={unclaim.isPending}
              onClick={(event) => {
                // Tetap terbuka sampai server menjawab; galat tampil di dialog.
                event.preventDefault();
                if (releasing)
                  unclaim.mutate({ wishId: releasing.wish.id, guestId: releasing.guestId });
              }}
            >
              Lepas pilihan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection title="Hadiah">
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field label="Nama hadiah" required>
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
          <Field
            label="Jumlah dibutuhkan"
            required
            hint="Yang terpenuhi dihitung dari pilihan tamu."
          >
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
      </FormSection>

      <FormSection title="Foto" description="Opsional.">
        <ImageField
          label="Foto"
          value={photo}
          onChange={setPhoto}
          recommendation="persegi 1:1, 800 × 800 px. Di undangan foto tampil kecil sebagai kotak, dan sisi yang tidak persegi dipotong dari tengah."
        />
      </FormSection>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} disabled={!name.trim()} />
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: AdminWish | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.invitation.removeWish(id),
    meta: { toast: "Terhapus" },
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
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
