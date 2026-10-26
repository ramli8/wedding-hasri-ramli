import { useMutation, useQuery } from "@tanstack/react-query";
import { type AdminGuestbookEntry, GUESTBOOK_MAX_MESSAGE } from "@wedding/shared";
import { Eye, EyeOff, MessagesSquare, Reply, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Pagination } from "@/components/kit/pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getDisplayNameInitials } from "@/lib/utils";
import { adminApi } from "../lib/admin-api.js";
import { formatDateTime } from "../lib/datetime.js";
import { guestbookQuery, useRefresh } from "../lib/queries.js";

type Visibility = "" | "shown" | "hidden";

const PAGE_SIZE = 20;

export function GuestbookPage() {
  const [visibility, setVisibility] = useState<Visibility>("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<AdminGuestbookEntry | null>(null);

  const list = useQuery(
    guestbookQuery({ page, hidden: visibility === "" ? undefined : visibility === "hidden" }),
  );
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{total} ucapan</p>
        <Tabs
          value={visibility === "" ? "semua" : visibility}
          onValueChange={(value) => {
            setVisibility(value === "semua" ? "" : (value as Visibility));
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="semua">Semua</TabsTrigger>
            <TabsTrigger value="shown">Tampil</TabsTrigger>
            <TabsTrigger value="hidden">Disembunyikan</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {list.isError && <Alert tone="error">{list.error.message}</Alert>}

      {list.data && list.data.items.length === 0 ? (
        <Card className="items-center px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted">
            <MessagesSquare className="size-6" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="font-semibold">Belum ada ucapan</p>
            <p className="text-sm text-muted-foreground">
              Ucapan muncul di sini setelah tamu menulisnya di halaman undangan.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.data?.items.map((entry) => (
            <li key={entry.id}>
              <EntryCard entry={entry} onDelete={() => setDeleting(entry)} />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onPage={setPage} />}

      <DeleteDialog entry={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function EntryCard({ entry, onDelete }: { entry: AdminGuestbookEntry; onDelete: () => void }) {
  const refresh = useRefresh();
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState(entry.reply ?? "");

  const saveReply = useMutation({
    mutationFn: () => adminApi.guestbook.reply(entry.id, reply),
    onSuccess: async () => {
      await refresh("guestbook");
      setReplying(false);
    },
  });
  const toggleHidden = useMutation({
    mutationFn: () => adminApi.guestbook.hide(entry.id, !entry.isHidden),
    onSuccess: () => refresh("guestbook"),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    saveReply.mutate();
  }

  return (
    <Card className={`gap-3 p-4 ${entry.isHidden ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <Avatar className="size-9">
          <AvatarFallback>{getDisplayNameInitials(entry.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {entry.name}
            {entry.isHidden && <Badge variant="secondary">Disembunyikan</Badge>}
          </p>
          <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
        </div>
        {!replying && (
          <DataTableRowActions
            actions={[
              {
                label: entry.reply ? "Ubah balasan" : "Balas",
                icon: <Reply />,
                onSelect: () => setReplying(true),
              },
              {
                label: entry.isHidden ? "Tampilkan" : "Sembunyikan",
                icon: entry.isHidden ? <Eye /> : <EyeOff />,
                onSelect: () => toggleHidden.mutate(),
              },
              "separator",
              { label: "Hapus", icon: <Trash2 />, destructive: true, onSelect: onDelete },
            ]}
          />
        )}
      </div>
      <p className="break-words whitespace-pre-wrap">{entry.message}</p>

      {entry.reply && !replying && (
        <div className="rounded-lg border-s-4 bg-muted/50 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Balasan Anda · {formatDateTime(entry.repliedAt)}
          </p>
          <p className="break-words whitespace-pre-wrap">{entry.reply}</p>
        </div>
      )}

      {replying && (
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <Textarea
            aria-label="Balasan"
            autoFocus
            maxLength={GUESTBOOK_MAX_MESSAGE}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Kosongkan lalu simpan untuk menghapus balasan.
          </p>
          {saveReply.error && <Alert tone="error">{saveReply.error.message}</Alert>}
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={saveReply.isPending}>
              Simpan balasan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setReplying(false);
                setReply(entry.reply ?? "");
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      {toggleHidden.error && <Alert tone="error">{toggleHidden.error.message}</Alert>}
      {!replying && !entry.reply && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setReplying(true)}>
            <Reply aria-hidden />
            Balas
          </Button>
        </div>
      )}
    </Card>
  );
}

function DeleteDialog({
  entry,
  onClose,
}: {
  entry: AdminGuestbookEntry | null;
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.guestbook.remove(id),
    onSuccess: async () => {
      await refresh("guestbook");
      onClose();
    },
  });

  return (
    <Dialog open={entry !== null} onClose={onClose} title={`Hapus ucapan dari “${entry?.name}”?`}>
      {entry && (
        <>
          <p>
            Ucapan dan balasannya dihapus permanen. Kalau hanya tidak ingin ditampilkan, pakai
            Sembunyikan.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(entry.id)}
              disabled={remove.isPending}
            >
              Hapus ucapan
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
