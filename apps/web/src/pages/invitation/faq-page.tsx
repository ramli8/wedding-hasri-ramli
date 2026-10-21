import { useMutation, useQuery } from "@tanstack/react-query";
import type { Faq } from "@wedding/shared";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Dialog } from "../../components/ui/dialog.js";
import { Field } from "../../components/ui/field.js";
import { Input } from "../../components/ui/input.js";
import { Textarea } from "../../components/ui/textarea.js";
import { adminApi } from "../../lib/admin-api.js";
import { faqsQuery, useRefresh } from "../../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; item: Faq };

export function FaqPage() {
  const refresh = useRefresh();
  const faqs = useQuery(faqsQuery);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminApi.invitation.reorderFaqs(ids),
    onSuccess: () => refresh("invitation"),
  });

  const items = faqs.data ?? [];
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
          Pertanyaan yang sering diajukan tamu, mis. dress code, parkir, atau membawa anak.
        </p>
        <Button onClick={() => setEditing({ kind: "new" })}>
          <Plus className="size-4" aria-hidden /> Tambah pertanyaan
        </Button>
      </div>

      {faqs.isError && <Alert tone="error">{faqs.error.message}</Alert>}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}

      {faqs.data && items.length === 0 ? (
        <Card className="text-center text-ink-soft">Belum ada pertanyaan.</Card>
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
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-display text-lg font-bold">{item.question}</p>
                  <p className="line-clamp-3 break-words whitespace-pre-wrap text-sm">
                    {item.answer}
                  </p>
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
        title={editing?.kind === "edit" ? "Ubah pertanyaan" : "Tambah pertanyaan"}
      >
        {editing && (
          <FaqForm
            item={editing.kind === "edit" ? editing.item : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function FaqForm({ item, onDone }: { item: Faq | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [question, setQuestion] = useState(item?.question ?? "");
  const [answer, setAnswer] = useState(item?.answer ?? "");

  const save = useMutation({
    mutationFn: () => {
      const input = { question, answer };
      return item
        ? adminApi.invitation.updateFaq(item.id, input)
        : adminApi.invitation.createFaq(input);
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
      <Field label="Pertanyaan">
        {(id) => (
          <Input
            id={id}
            required
            maxLength={200}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        )}
      </Field>
      <Field label="Jawaban" hint="Maksimal 1000 karakter.">
        {(id) => (
          <Textarea
            id={id}
            required
            className="min-h-28"
            maxLength={1000}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending || !question.trim() || !answer.trim()}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: Faq | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.invitation.removeFaq(id),
    onSuccess: async () => {
      await refresh("invitation");
      onClose();
    },
  });

  return (
    <Dialog open={item !== null} onClose={onClose} title="Hapus pertanyaan ini?">
      {item && (
        <>
          <p className="font-semibold">{item.question}</p>
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
              Hapus pertanyaan
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
