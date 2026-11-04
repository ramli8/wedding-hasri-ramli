import { useMutation, useQuery } from "@tanstack/react-query";
import type { Faq } from "@wedding/shared";
import { CircleHelp, Plus, SquarePen, Trash2 } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormSection } from "@/components/kit/form-rows";
import { EmptyState, FormFooter, isAgain, Toolbar } from "@/components/kit/invitation-kit";
import { ReorderButtons } from "@/components/kit/reorder-buttons";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../../lib/admin-api.js";
import { faqsQuery, useRefresh } from "../../lib/queries.js";

type Editing = { kind: "new"; question?: string } | { kind: "edit"; item: Faq };

/** Contoh pertanyaan di keadaan kosong; mengetuknya membuka formulir dengan pertanyaan terisi. */
const EXAMPLE_QUESTIONS = [
  "Apa dress code acaranya?",
  "Di mana tempat parkir?",
  "Bolehkah membawa anak?",
  "Jam berapa sebaiknya datang?",
  "Apakah ada siaran langsung?",
];

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
      <Toolbar
        summary={`${items.length} pertanyaan`}
        addLabel="Tambah pertanyaan"
        onAdd={() => setEditing({ kind: "new" })}
      />

      {faqs.isError && <Alert tone="error">{faqs.error.message}</Alert>}
      {reorder.error && <Alert tone="error">{reorder.error.message}</Alert>}

      {faqs.data && items.length === 0 ? (
        <>
          <EmptyState
            icon={CircleHelp}
            title="Belum ada pertanyaan"
            description="Tulis hal yang sering ditanyakan tamu, mis. dress code, parkir, atau membawa anak."
            addLabel="Tambah pertanyaan"
            onAdd={() => setEditing({ kind: "new" })}
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Atau mulai dari contoh, lalu tulis jawabannya:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setEditing({ kind: "new", question })}
                >
                  <Plus aria-hidden />
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </>
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
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-semibold">{item.question}</p>
                  <p className="line-clamp-3 break-words whitespace-pre-wrap text-sm">
                    {item.answer}
                  </p>
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
        title={editing?.kind === "edit" ? "Ubah pertanyaan" : "Tambah pertanyaan"}
      >
        {editing && (
          <FaqForm
            item={editing.kind === "edit" ? editing.item : null}
            initialQuestion={editing.kind === "new" ? editing.question : undefined}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function FaqForm({
  item,
  initialQuestion,
  onDone,
}: {
  item: Faq | null;
  initialQuestion?: string;
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const [question, setQuestion] = useState(item?.question ?? initialQuestion ?? "");
  const [answer, setAnswer] = useState(item?.answer ?? "");
  const first = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: (_again: boolean) => {
      const input = { question, answer };
      return item
        ? adminApi.invitation.updateFaq(item.id, input)
        : adminApi.invitation.createFaq(input);
    },
    onSuccess: async (_data, again) => {
      await refresh("invitation");
      if (!again) return onDone();
      // "Simpan & tambah lagi": dialog tetap terbuka dengan isian kosong.
      setQuestion("");
      setAnswer("");
      first.current?.focus();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate(isAgain(event));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection
        title="Tanya jawab"
        description="Tulis seperti Anda menjawab tamu secara langsung."
      >
        <Field label="Pertanyaan" required hint={`${question.length}/200 karakter.`}>
          {(id) => (
            <Input
              id={id}
              ref={first}
              required
              maxLength={200}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          )}
        </Field>
        <Field label="Jawaban" required hint={`${answer.length}/1000 karakter.`}>
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
      </FormSection>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        disabled={!question.trim() || !answer.trim()}
        again={!item}
      />
    </form>
  );
}

function DeleteDialog({ item, onClose }: { item: Faq | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.invitation.removeFaq(id),
    meta: { toast: "Terhapus" },
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
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
