import { useMutation, useQuery } from "@tanstack/react-query";
import { type AdminGuestbookEntry, GUESTBOOK_MAX_MESSAGE } from "@wedding/shared";
import { type FormEvent, useState } from "react";
import { Alert } from "../components/ui/alert.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Dialog } from "../components/ui/dialog.js";
import { Select } from "../components/ui/select.js";
import { Textarea } from "../components/ui/textarea.js";
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
      <p className="max-w-prose text-ink-soft">
        Ucapan dari tamu. Balasan Anda tampil di bawah ucapan itu; ucapan yang disembunyikan tidak
        terlihat oleh tamu.
      </p>
      <div className="max-w-xs">
        <Select
          compact
          aria-label="Tampilan"
          value={visibility}
          onChange={(e) => {
            setVisibility(e.target.value as Visibility);
            setPage(1);
          }}
        >
          <option value="">Semua ucapan</option>
          <option value="shown">Yang tampil</option>
          <option value="hidden">Yang disembunyikan</option>
        </Select>
      </div>

      {list.isError && <Alert tone="error">{list.error.message}</Alert>}

      {list.data && list.data.items.length === 0 ? (
        <Card className="text-center text-ink-soft">Belum ada ucapan.</Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.data?.items.map((entry) => (
            <li key={entry.id}>
              <EntryCard entry={entry} onDelete={() => setDeleting(entry)} />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            Halaman {page} dari {pageCount} · {total} ucapan
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

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
    <Card className={`flex flex-col gap-3 ${entry.isHidden ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold">
          {entry.name}
          {entry.isHidden && <Badge variant="solid">Disembunyikan</Badge>}
        </p>
        <p className="text-xs text-ink-soft">{formatDateTime(entry.createdAt)}</p>
      </div>
      <p className="break-words whitespace-pre-wrap">{entry.message}</p>

      {entry.reply && !replying && (
        <div className="border-2 border-ink bg-acid p-3 text-sm">
          <p className="tag mb-1">Balasan Anda · {formatDateTime(entry.repliedAt)}</p>
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
          <p className="text-xs text-ink-soft">Kosongkan lalu simpan untuk menghapus balasan.</p>
          {saveReply.error && <Alert tone="error">{saveReply.error.message}</Alert>}
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={saveReply.isPending}>
              Simpan balasan
            </Button>
            <Button
              size="sm"
              variant="secondary"
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
      {!replying && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setReplying(true)}>
            {entry.reply ? "Ubah balasan" : "Balas"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toggleHidden.mutate()}
            disabled={toggleHidden.isPending}
          >
            {entry.isHidden ? "Tampilkan" : "Sembunyikan"}
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Hapus
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
            <Button variant="secondary" onClick={onClose}>
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
