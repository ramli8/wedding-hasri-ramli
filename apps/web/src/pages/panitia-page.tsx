import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { type PanitiaMember, type PanitiaTask, panitiaMessage, whatsappUrl } from "@wedding/shared";
import {
  Check,
  Copy,
  KeyRound,
  MessageCircle,
  Plus,
  SquarePen,
  Trash2,
  UserPlus,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { Select } from "@/components/kit/select";
import { toast } from "@/components/kit/toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi } from "../lib/admin-api.js";
import { formatPhone } from "../lib/format.js";
import { coupleNames } from "../lib/message.js";
import { panitiaQuery, settingsQuery, useRefresh } from "../lib/queries.js";

const WIB_OFFSET_MS = 7 * 3600_000;
const todayWib = () => new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatDue = (date: string) => dateFmt.format(new Date(`${date}T00:00:00Z`));

type TaskEditing = { kind: "new" } | { kind: "edit"; task: PanitiaTask };
type MemberEditing = { kind: "new" } | { kind: "edit"; member: PanitiaMember };

/**
 * Tugas persiapan untuk panitia keluarga. Satu tugas satu penanggung jawab; tiap anggota menerima
 * tautan pribadi lewat WhatsApp dan mencentang tugasnya sendiri dari HP tanpa akun.
 */
export function PanitiaPage() {
  const refresh = useRefresh();
  const query = useQuery(panitiaQuery);
  const settings = useQuery(settingsQuery);
  const members = query.data?.members ?? [];
  const tasks = query.data?.tasks ?? [];
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name ?? null;
  const [taskEditing, setTaskEditing] = useState<TaskEditing | null>(null);
  const [memberEditing, setMemberEditing] = useState<MemberEditing | null>(null);
  const [deletingTask, setDeletingTask] = useState<PanitiaTask | null>(null);
  const [deletingMember, setDeletingMember] = useState<PanitiaMember | null>(null);
  const today = todayWib();

  const done = useMutation({
    mutationFn: (v: { id: string; done: boolean }) => adminApi.panitia.setDone(v.id, v.done),
    meta: { toast: false },
    onSuccess: () => refresh("panitia"),
  });
  const resetToken = useMutation({
    mutationFn: (id: string) => adminApi.panitia.resetToken(id),
    meta: { toast: "Tautan baru dibuat; tautan lama tidak berlaku" },
    onSuccess: () => refresh("panitia"),
  });

  const base = settings.data?.publicBaseUrl?.replace(/\/+$/, "") || window.location.origin;
  const linkFor = (member: PanitiaMember) => `${base}/tugas/${member.token}`;
  const messageFor = (member: PanitiaMember) =>
    panitiaMessage({
      name: member.name,
      link: linkFor(member),
      couple: coupleNames(settings.data),
    });

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Tautan disalin");
    } catch {
      toast("Gagal menyalin; salin manual saja", "error");
    }
  }

  const columns: ColumnDef<PanitiaTask, unknown>[] = [
    {
      id: "tugas",
      accessorFn: (task) => task.title,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tugas" />,
      filterFn: (row, _id, value: string) => {
        const needle = value.toLowerCase();
        return [row.original.title, row.original.note, memberName(row.original.memberId)].some(
          (text) => text?.toLowerCase().includes(needle),
        );
      },
      cell: ({ row }) => (
        <div className="max-w-80">
          <p className={row.original.doneAt ? "text-muted-foreground line-through" : "font-medium"}>
            {row.original.title}
          </p>
          {row.original.note && (
            <p className="truncate text-xs text-muted-foreground">{row.original.note}</p>
          )}
        </div>
      ),
    },
    {
      id: "pj",
      accessorFn: (task) => memberName(task.memberId) ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Penanggung jawab" />,
      cell: ({ row }) =>
        memberName(row.original.memberId) ?? <span className="text-muted-foreground">–</span>,
    },
    {
      id: "tenggat",
      accessorFn: (task) => task.dueOn ?? "9999",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tenggat" />,
      cell: ({ row }) => {
        const { dueOn, doneAt } = row.original;
        if (!dueOn) return <span className="text-muted-foreground">–</span>;
        const late = !doneAt && dueOn < today;
        return (
          <span className="flex items-center gap-2">
            {formatDue(dueOn)}
            {late && <Badge variant="destructive">Terlambat</Badge>}
          </span>
        );
      },
    },
    {
      id: "selesai",
      accessorFn: (task) => (task.doneAt ? "yes" : "no"),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Selesai" />,
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      cell: ({ row }) => {
        const task = row.original;
        const busy = done.isPending && done.variables?.id === task.id;
        return task.doneAt ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => done.mutate({ id: task.id, done: false })}
            className="text-muted-foreground"
          >
            <Check aria-hidden />
            Selesai
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => done.mutate({ id: task.id, done: true })}
          >
            Tandai selesai
          </Button>
        );
      },
    },
    {
      id: "aksi",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DataTableRowActions
            actions={[
              {
                label: "Ubah",
                icon: <SquarePen />,
                onSelect: () => setTaskEditing({ kind: "edit", task: row.original }),
              },
              "separator",
              {
                label: "Hapus",
                icon: <Trash2 />,
                destructive: true,
                onSelect: () => setDeletingTask(row.original),
              },
            ]}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const doneCount = tasks.filter((t) => t.doneAt).length;

  return (
    <>
      <PageHeader
        title="Tugas panitia"
        description={
          tasks.length > 0
            ? `${doneCount} dari ${tasks.length} tugas selesai.`
            : "Bagi tugas persiapan ke keluarga; tiap orang mencentang tugasnya dari HP."
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setMemberEditing({ kind: "new" })}>
              <UserPlus aria-hidden />
              Tambah anggota
            </Button>
            <Button onClick={() => setTaskEditing({ kind: "new" })}>
              Tambah tugas
              <Plus aria-hidden />
            </Button>
          </>
        }
      />

      {query.isError && <Alert tone="error">{query.error.message}</Alert>}

      {members.length > 0 && (
        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => {
                const mine = tasks.filter((t) => t.memberId === member.id);
                const mineDone = mine.filter((t) => t.doneAt).length;
                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-2 rounded-lg border p-2 ps-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {mineDone}/{mine.length} selesai
                        {member.phone ? ` · ${formatPhone(member.phone)}` : ""}
                      </p>
                    </div>
                    {member.phone ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            whatsappUrl(member.phone ?? "", messageFor(member)),
                            "_blank",
                            "noopener",
                          )
                        }
                      >
                        <MessageCircle aria-hidden />
                        Kirim
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void copy(linkFor(member))}
                      >
                        <Copy aria-hidden />
                        Salin tautan
                      </Button>
                    )}
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Salin tautan",
                          icon: <Copy />,
                          onSelect: () => void copy(linkFor(member)),
                        },
                        {
                          label: "Ubah",
                          icon: <SquarePen />,
                          onSelect: () => setMemberEditing({ kind: "edit", member }),
                        },
                        {
                          label: "Ganti tautan",
                          icon: <KeyRound />,
                          onSelect: () => resetToken.mutate(member.id),
                        },
                        "separator",
                        {
                          label: "Hapus",
                          icon: <Trash2 />,
                          destructive: true,
                          onSelect: () => setDeletingMember(member),
                        },
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={tasks}
        getRowId={(task) => task.id}
        searchPlaceholder="Cari tugas atau penanggung jawab"
        searchKey="tugas"
        emptyText={
          query.isPending
            ? "Memuat…"
            : "Belum ada tugas. Tambahkan anggota panitia, lalu klik “Tambah tugas”."
        }
        filters={[
          {
            columnId: "selesai",
            title: "Status",
            options: [
              { label: "Belum selesai", value: "no" },
              { label: "Selesai", value: "yes" },
            ],
          },
        ]}
      />

      <Dialog
        open={taskEditing !== null}
        onClose={() => setTaskEditing(null)}
        title={taskEditing?.kind === "edit" ? "Ubah tugas" : "Tambah tugas"}
      >
        {taskEditing && (
          <TaskForm
            task={taskEditing.kind === "edit" ? taskEditing.task : null}
            members={members}
            onDone={() => setTaskEditing(null)}
          />
        )}
      </Dialog>
      <Dialog
        open={memberEditing !== null}
        onClose={() => setMemberEditing(null)}
        title={memberEditing?.kind === "edit" ? "Ubah anggota" : "Tambah anggota"}
      >
        {memberEditing && (
          <MemberForm
            member={memberEditing.kind === "edit" ? memberEditing.member : null}
            onDone={() => setMemberEditing(null)}
          />
        )}
      </Dialog>
      <ConfirmDelete
        open={deletingTask !== null}
        title="Hapus tugas?"
        text={deletingTask ? `“${deletingTask.title}” dihapus.` : ""}
        onClose={() => setDeletingTask(null)}
        remove={() => adminApi.panitia.removeTask(deletingTask?.id ?? "")}
      />
      <ConfirmDelete
        open={deletingMember !== null}
        title="Hapus anggota?"
        text={
          deletingMember
            ? `${deletingMember.name} dihapus dan tautannya tidak berlaku. Tugasnya tetap ada tanpa penanggung jawab.`
            : ""
        }
        onClose={() => setDeletingMember(null)}
        remove={() => adminApi.panitia.removeMember(deletingMember?.id ?? "")}
      />
    </>
  );
}

function TaskForm({
  task,
  members,
  onDone,
}: {
  task: PanitiaTask | null;
  members: PanitiaMember[];
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const [title, setTitle] = useState(task?.title ?? "");
  const [memberId, setMemberId] = useState(task?.memberId ?? "");
  const [dueOn, setDueOn] = useState(task?.dueOn ?? "");
  const [note, setNote] = useState(task?.note ?? "");
  const [submitted, setSubmitted] = useState(false);

  const save = useMutation({
    mutationFn: () => {
      const input = { title, memberId: memberId || null, dueOn: dueOn || null, note };
      return task
        ? adminApi.panitia.updateTask(task.id, input)
        : adminApi.panitia.createTask(input);
    },
    onSuccess: async () => {
      await refresh("panitia");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (title.trim()) save.mutate();
  }

  const inputClass = "h-11 text-base md:h-9 md:text-sm";
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Tugas" required error={submitted && !title.trim() ? "Tugas wajib diisi" : null}>
        {(id) => (
          <Input
            id={id}
            autoFocus={!task}
            maxLength={160}
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Penanggung jawab">
          {(id) => (
            <Select id={id} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Belum ditentukan</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Tenggat">
          {(id) => (
            <Input
              id={id}
              type="date"
              value={dueOn}
              onChange={(e) => setDueOn(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
      </div>
      <Field label="Catatan">
        {(id) => (
          <Input
            id={id}
            maxLength={500}
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

function MemberForm({ member, onDone }: { member: PanitiaMember | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [name, setName] = useState(member?.name ?? "");
  const [phone, setPhone] = useState(member?.phone ? formatPhone(member.phone) : "");
  const [submitted, setSubmitted] = useState(false);

  const save = useMutation({
    mutationFn: () => {
      const input = { name, phone };
      return member
        ? adminApi.panitia.updateMember(member.id, input)
        : adminApi.panitia.createMember(input);
    },
    onSuccess: async () => {
      await refresh("panitia");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (name.trim()) save.mutate();
  }

  const inputClass = "h-11 text-base md:h-9 md:text-sm";
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Nama" required error={submitted && !name.trim() ? "Nama wajib diisi" : null}>
        {(id) => (
          <Input
            id={id}
            autoFocus
            maxLength={60}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="No. HP">
        {(id) => (
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="08…"
            maxLength={30}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

function ConfirmDelete({
  open,
  title,
  text,
  onClose,
  remove,
}: {
  open: boolean;
  title: string;
  text: string;
  onClose: () => void;
  remove: () => Promise<unknown>;
}) {
  const refresh = useRefresh();
  const mutation = useMutation({
    mutationFn: remove,
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("panitia");
      onClose();
    },
  });
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p>{text}</p>
      {mutation.error && <Alert tone="error">{mutation.error.message}</Alert>}
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="destructive"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          Hapus
        </Button>
      </DialogActions>
    </Dialog>
  );
}
