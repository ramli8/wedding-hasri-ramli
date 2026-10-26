import { useMutation, useQuery } from "@tanstack/react-query";
import type { MediaRef, StoryItem } from "@wedding/shared";
import { ArrowDown, ArrowUp, BookHeart, Plus, SquarePen, Trash2 } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      <Toolbar
        summary={`${items.length} tahap`}
        addLabel="Tambah cerita"
        onAdd={() => setEditing({ kind: "new" })}
      />
      <Tip>
        Tahap tampil berurutan dari atas ke bawah di undangan. Foto opsional; potret atau lanskap
        sama baiknya.
      </Tip>

      {story.isError && <Alert tone="error">{story.error.message}</Alert>}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}

      {story.data && items.length === 0 ? (
        <EmptyState
          icon={BookHeart}
          title="Belum ada cerita"
          description="Mulai dari momen pertama kalian, mis. “Pertama bertemu”."
          addLabel="Tambah cerita"
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
                  {item.whenLabel && (
                    <p className="text-xs font-medium text-muted-foreground">{item.whenLabel}</p>
                  )}
                  <p className="font-semibold">{item.title}</p>
                  {item.body && (
                    <p className="line-clamp-3 break-words whitespace-pre-wrap text-sm">
                      {item.body}
                    </p>
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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection title="Momen" description="Satu tahap dalam perjalanan kalian.">
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
        <Field label="Cerita" hint={`${body.length}/1500 karakter.`}>
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
      </FormSection>

      <FormSection title="Foto" description="Opsional.">
        <ImageField
          label="Foto"
          value={photo}
          onChange={setPhoto}
          recommendation="lanskap 3:2, 2400 × 1600 px (minimal 1200 px lebar). Foto tampil utuh selebar kartu tanpa dipotong, jadi potret pun boleh."
        />
      </FormSection>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} disabled={!!title.trim()} />
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
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
