import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GUESTBOOK_MAX_MESSAGE, GUESTBOOK_MAX_NAME } from "@wedding/shared";
import { type FormEvent, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Input } from "../../components/ui/input.js";
import { Textarea } from "../../components/ui/textarea.js";
import { formatDateTime } from "../../lib/datetime.js";
import { publicApi } from "../../lib/public-api.js";

const KEY = ["guestbook", "public"];

/** Buku ucapan: tamu menulis dari tautan pribadinya, dan semua ucapan yang tampil bisa dibaca. */
export function GuestbookCard({ code, defaultName }: { code: string; defaultName: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const list = useInfiniteQuery({
    queryKey: KEY,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => publicApi.guestbook(pageParam),
    getNextPageParam: (last, pages) =>
      pages.reduce((sum, page) => sum + page.items.length, 0) < last.total
        ? last.page + 1
        : undefined,
    retry: false,
  });

  const post = useMutation({
    mutationFn: () => publicApi.postGuestbook({ code, name, message }),
    onSuccess: async () => {
      setMessage("");
      setSent(true);
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSent(false);
    post.mutate();
  }

  const entries = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Card className="flex flex-col gap-5">
      <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Ucapan</h2>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="ucapan-nama" className="tag">
            Nama
          </label>
          <Input
            id="ucapan-nama"
            maxLength={GUESTBOOK_MAX_NAME}
            placeholder={defaultName}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="ucapan-pesan" className="tag">
            Ucapan dan doa
          </label>
          <Textarea
            id="ucapan-pesan"
            required
            maxLength={GUESTBOOK_MAX_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-ink-soft">
            {message.length}/{GUESTBOOK_MAX_MESSAGE}
          </p>
        </div>
        {post.error && <Alert tone="error">{post.error.message}</Alert>}
        {sent && !post.error && <Alert>Terima kasih, ucapan Anda sudah terkirim.</Alert>}
        <Button type="submit" disabled={post.isPending || !message.trim()}>
          {post.isPending ? "Mengirim…" : "Kirim ucapan"}
        </Button>
      </form>

      {list.isError ? (
        <Alert tone="error">Ucapan belum bisa dimuat. Coba lagi nanti.</Alert>
      ) : entries.length === 0 ? (
        !list.isPending && (
          <p className="text-sm text-ink-soft">Belum ada ucapan. Jadilah yang pertama.</p>
        )
      ) : (
        <ul className="flex flex-col divide-y divide-bone-2 border-t-2 border-ink">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{entry.name}</p>
                <p className="text-xs text-ink-soft">{formatDateTime(entry.createdAt)}</p>
              </div>
              <p className="break-words whitespace-pre-wrap">{entry.message}</p>
              {entry.reply && (
                <div className="border-2 border-ink bg-acid p-3 text-sm">
                  <p className="tag mb-1">Balasan mempelai</p>
                  <p className="break-words whitespace-pre-wrap">{entry.reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {list.hasNextPage && (
        <Button
          variant="secondary"
          onClick={() => void list.fetchNextPage()}
          disabled={list.isFetchingNextPage}
        >
          {list.isFetchingNextPage ? "Memuat…" : "Tampilkan lebih banyak"}
        </Button>
      )}
    </Card>
  );
}
