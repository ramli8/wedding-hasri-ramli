import { useMutation, useQuery } from "@tanstack/react-query";
import type { MediaRef, StoryItem } from "@wedding/shared";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ImageField } from "../../components/image-field.js";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Dialog } from "../../components/ui/dialog.js";
import { Field } from "../../components/ui/field.js";
import { Input } from "../../components/ui/input.js";
import { Textarea } from "../../components/ui/textarea.js";
import { adminApi } from "../../lib/admin-api.js";
import { storyQuery, useRefresh } from "../../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; item: StoryItem };

export function StoryPage() {
  const refresh = useRefresh();
  const story = useQuery(storyQuery);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<StoryItem | null>(null);

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminApi.invitation.reorderStory(ids),
    onSuccess: () => refresh("invitation"),
  });

  const items = story.data ?? [];
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
          Linimasa cerita Anda berdua, tampil berurutan dari atas ke bawah di undangan.
        </p>
        <Button onClick={() => setEditing({ kind: "new" })}>
          <Plus className="size-4" aria-hidden /> Tambah cerita
        </Button>
      </div>

      {story.isError && <Alert tone="error">{story.error.message}</Alert>}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}

      {story.data && items.length === 0 ? (
        <Card className="text-center text-ink-soft">
          Belum ada cerita. Tambahkan momen pertama Anda, mis. "Pertama bertemu".
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
                  {item.whenLabel && <p className="tag text-ink-soft">{item.whenLabel}</p>}
                  <p className="font-display text-lg font-bold">{item.title}</p>
                  {item.body && (
                    <p className="line-clamp-3 break-words whitespace-pre-wrap text-sm">
                      {item.body}
                    </p>
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
        title={editing?.kind === "edit" ? "Ubah cerita" : "Tambah cerita"}
      >
        {editing && (
          <StoryForm
            item={editing.kind === "edit" ? editing.item : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function StoryForm({ item, onDone }: { item: StoryItem | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [whenLabel, setWhenLabel] = useState(item?.whenLabel ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [photo, setPhoto] = useState<MediaRef | null>(item?.photo ?? null);

  const save = useMutation({
    mutationFn: () => {
      const input = { whenLabel, title, body, photoMediaId: photo?.id ?? null };
      return item
        ? adminApi.invitation.updateStory(item.id, input)
        : adminApi.invitation.createStory(input);
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
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field label="Waktu" hint='Mis. "2019" atau "Mei 2022".'>
          {(id) => (
            <Input id={id} value={whenLabel} onChange={(e) => setWhenLabel(e.target.value)} />
          )}
        </Field>
        <Field label="Judul">
          {(id) => (
            <Input id={id} required value={title} onChange={(e) => setTitle(e.target.value)} />
          )}
        </Field>
      </div>
      <Field label="Cerita" hint="Maksimal 1500 karakter.">
        {(id) => (
          <Textarea
            id={id}
            className="min-h-32"
            maxLength={1500}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        )}
      </Field>
      <ImageField
        label="Foto"
        value={photo}
        onChange={setPhoto}
        recommendation="lanskap 3:2, 2400 × 1600 px (minimal 1200 px lebar). Foto tampil utuh selebar kartu tanpa dipotong, jadi potret pun boleh."
      />

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending || !title.trim()}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: StoryItem | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.invitation.removeStory(id),
    onSuccess: async () => {
      await refresh("invitation");
      onClose();
    },
  });

  return (
    <Dialog open={item !== null} onClose={onClose} title={`Hapus “${item?.title}”?`}>
      {item && (
        <>
          <p>Cerita ini dan fotonya dihapus dari undangan.</p>
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
              Hapus cerita
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
