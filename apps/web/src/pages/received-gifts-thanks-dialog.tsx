import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  giftPhrase,
  instagramDmUrl,
  type ReceivedGift,
  renderTemplate,
  whatsappUrl,
} from "@wedding/shared";
import { Copy, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { SwitchRow } from "@/components/kit/form-rows";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../lib/admin-api.js";
import { formatDateTime } from "../lib/datetime.js";
import { coupleNames } from "../lib/message.js";
import { receivedGiftsQuery, settingsQuery, thanksTemplateQuery } from "../lib/queries.js";

function thanksText(template: string, gift: ReceivedGift, couple: string) {
  return renderTemplate(template, {
    panggilan: gift.giverName,
    hadiah: giftPhrase(gift),
    mempelai: couple,
  });
}

/**
 * Kirim terima kasih ke satu pemberi, senada dengan "Kirim undangan" di Tamu: pesan bisa disunting
 * dulu, lalu dibuka di WhatsApp atau DM Instagram (pesan disalin), atau ditandai manual.
 */
export function ThanksSendDialog({
  giftId,
  onClose,
}: {
  giftId: string | null;
  onClose: () => void;
}) {
  const list = useQuery(receivedGiftsQuery({}));
  // Dibaca dari daftar agar status "sudah dibalas" ikut berubah setelah ditandai.
  const gift = list.data?.items.find((g) => g.id === giftId) ?? null;
  return (
    <Dialog
      open={giftId !== null}
      onClose={onClose}
      wide
      title={`Kirim terima kasih: ${gift?.giverName ?? ""}`}
      description="Pesan dibuka di WhatsApp atau Instagram, lalu Anda menekan kirim sendiri."
    >
      {gift && <SendBody key={gift.id} gift={gift} />}
    </Dialog>
  );
}

function SendBody({ gift }: { gift: ReceivedGift }) {
  const settings = useQuery(settingsQuery);
  const template = useQuery(thanksTemplateQuery);
  if (template.isError) return <Alert tone="error">{template.error.message}</Alert>;
  if (template.isPending || settings.isPending) {
    return <p className="text-muted-foreground">Memuat…</p>;
  }
  return (
    <SendForm
      gift={gift}
      initialText={thanksText(template.data, gift, coupleNames(settings.data))}
    />
  );
}

function SendForm({ gift, initialText }: { gift: ReceivedGift; initialText: string }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(initialText);
  const [notice, setNotice] = useState<string | null>(null);

  const mark = useMutation({
    mutationFn: (thanked: boolean) => adminApi.receivedGifts.thank(gift.id, thanked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["received-gifts"] }),
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Pesan disalin.");
      return true;
    } catch {
      setNotice("Gagal menyalin. Salin manual dari kotak pesan.");
      return false;
    }
  }

  function sendWhatsApp() {
    if (!gift.phone) return;
    // window.open harus dipanggil langsung dari klik agar tidak diblokir pop-up blocker.
    window.open(whatsappUrl(gift.phone, text), "_blank", "noopener");
    mark.mutate(true);
  }

  async function sendInstagram() {
    if (!gift.instagram) return;
    window.open(instagramDmUrl(gift.instagram), "_blank", "noopener");
    // Instagram tidak bisa mengisi teks otomatis, jadi pesan disalin untuk ditempel.
    await copy();
    mark.mutate(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {gift.phone && <span>WhatsApp +{gift.phone}</span>}
        {gift.instagram && <span>Instagram @{gift.instagram}</span>}
        {!gift.phone && !gift.instagram && (
          <span>Pemberi ini belum punya nomor HP atau Instagram; pesan hanya bisa disalin.</span>
        )}
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`terima-kasih-${gift.id}`} className="text-sm leading-none font-medium">
              Isi pesan
            </label>
            {gift.thankedAt ? (
              <Badge variant="secondary">Dibalas · {formatDateTime(gift.thankedAt)}</Badge>
            ) : (
              <Badge variant="outline">Belum dibalas</Badge>
            )}
          </div>
          <Textarea
            id={`terima-kasih-${gift.id}`}
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-44 font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            Pesan bisa disunting dulu.{" "}
            {notice ?? "Anda sendiri yang menekan tombol kirim di aplikasinya."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {gift.phone && (
            <Button onClick={sendWhatsApp}>
              <MessageCircle aria-hidden />
              Buka WhatsApp
            </Button>
          )}
          {gift.instagram && (
            <Button variant={gift.phone ? "outline" : "default"} onClick={sendInstagram}>
              <Send aria-hidden />
              Salin &amp; buka DM Instagram
            </Button>
          )}
          <Button variant="outline" onClick={copy}>
            <Copy aria-hidden />
            Salin pesan
          </Button>
        </div>

        <SwitchRow
          title="Sudah dibalas"
          description="Tandai manual bila Anda membalasnya lewat cara lain."
          checked={gift.thankedAt !== null}
          onCheckedChange={(checked) => mark.mutate(checked)}
        />
        {mark.error && <Alert tone="error">{mark.error.message}</Alert>}
      </div>
    </div>
  );
}

/**
 * Kirim terima kasih beruntun, senada dengan "Kirim beruntun" di Tamu: daftar pemberi yang belum
 * dibalas, masing-masing dengan tombol yang membuka WhatsApp (atau DM Instagram) dan langsung
 * menandai "sudah dibalas". Admin cukup menekan kirim, kembali, lalu lanjut ke baris paling atas.
 */
export function ThanksQueueDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      title="Kirim terima kasih beruntun"
      description="Tekan Buka WhatsApp, kirim di WhatsApp, lalu kembali ke sini untuk pemberi berikutnya."
    >
      {open && <QueueBody />}
    </Dialog>
  );
}

function QueueBody() {
  const queryClient = useQueryClient();
  const settings = useQuery(settingsQuery);
  // Semua catatan, tidak terpengaruh filter di halaman Hadiah.
  const all = useQuery(receivedGiftsQuery({}));
  const template = useQuery(thanksTemplateQuery);
  // Pemberi yang sudah dibuka di sesi ini tetap tampil di bawah, agar bisa dikirim ulang atau dibatalkan.
  const [opened, setOpened] = useState<ReceivedGift[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const mark = useMutation({
    mutationFn: (v: { id: string; thanked: boolean }) =>
      adminApi.receivedGifts.thank(v.id, v.thanked),
    meta: { toast: false },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["received-gifts"] }),
  });

  const openedIds = new Set(opened.map((g) => g.id));
  const pending = (all.data?.items ?? []).filter((g) => !g.thankedAt && !openedIds.has(g.id));
  const reachable = pending.filter((g) => g.phone || g.instagram);
  const unreachable = pending.length - reachable.length;
  const ready = Boolean(template.data);

  const textFor = (gift: ReceivedGift) =>
    thanksText(template.data ?? "", gift, coupleNames(settings.data));

  function remember(gift: ReceivedGift) {
    setOpened((current) => (current.some((g) => g.id === gift.id) ? current : [gift, ...current]));
  }

  function sendWhatsApp(gift: ReceivedGift) {
    if (!gift.phone) return;
    // window.open harus dipanggil langsung dari klik agar tidak diblokir pop-up blocker.
    window.open(whatsappUrl(gift.phone, textFor(gift)), "_blank", "noopener");
    remember(gift);
    mark.mutate({ id: gift.id, thanked: true });
  }

  async function sendInstagram(gift: ReceivedGift) {
    if (!gift.instagram) return;
    window.open(instagramDmUrl(gift.instagram), "_blank", "noopener");
    // Instagram tidak bisa mengisi teks otomatis, jadi pesan disalin untuk ditempel.
    try {
      await navigator.clipboard.writeText(textFor(gift));
      setNotice(`Pesan untuk ${gift.giverName} disalin; tempel di DM Instagram.`);
    } catch {
      setNotice("Gagal menyalin pesan. Kirim dari tombol Kirim di baris pemberi.");
    }
    remember(gift);
    mark.mutate({ id: gift.id, thanked: true });
  }

  const send = (gift: ReceivedGift) => (gift.phone ? sendWhatsApp(gift) : sendInstagram(gift));

  function undo(gift: ReceivedGift) {
    setOpened((current) => current.filter((g) => g.id !== gift.id));
    mark.mutate({ id: gift.id, thanked: false });
  }

  return (
    <div className="flex flex-col gap-4">
      {all.isError && <Alert tone="error">{all.error.message}</Alert>}
      {template.error && <Alert tone="error">{template.error.message}</Alert>}
      {mark.error && <Alert tone="error">{mark.error.message}</Alert>}
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

      <p className="text-sm text-muted-foreground">
        {all.isPending ? "Memuat…" : `${reachable.length} pemberi belum dibalas.`}
        {opened.length > 0 && ` ${opened.length} baru saja dibuka.`}
      </p>

      {!all.isPending && reachable.length === 0 ? (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          {opened.length > 0
            ? "Selesai. Semua pemberi di daftar ini sudah dibuka."
            : "Semua pemberi sudah dibalas."}
        </p>
      ) : (
        <ul className="flex max-h-[50dvh] flex-col overflow-y-auto rounded-lg border">
          {reachable.map((gift, index) => (
            <li
              key={gift.id}
              className={`flex flex-wrap items-center justify-between gap-2 border-b p-3 last:border-b-0 ${index === 0 ? "bg-accent/40" : ""}`}
            >
              <div className="min-w-0">
                <p className="font-semibold break-words">{gift.giverName}</p>
                <p className="text-xs text-muted-foreground">
                  {gift.phone ? `+${gift.phone}` : `@${gift.instagram}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={index === 0 ? "default" : "outline"}
                  disabled={!ready}
                  onClick={() => send(gift)}
                >
                  {gift.phone ? (
                    <>
                      <MessageCircle aria-hidden />
                      Buka WhatsApp
                    </>
                  ) : (
                    <>
                      <Send aria-hidden />
                      Salin &amp; buka DM
                    </>
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {unreachable > 0 && (
        <p className="text-sm text-muted-foreground">
          {unreachable} pemberi belum punya nomor HP atau Instagram; lengkapi dulu lewat Ubah di
          daftar.
        </p>
      )}

      {opened.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">
            Baru dibuka di sesi ini ({opened.length})
          </summary>
          <ul className="mt-2 flex flex-col rounded-lg border">
            {opened.map((gift) => (
              <li
                key={gift.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b p-3 last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="break-words">{gift.giverName}</span>
                  <Badge variant="secondary">Dibalas</Badge>
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => send(gift)}>
                    Kirim lagi
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={mark.isPending}
                    onClick={() => undo(gift)}
                  >
                    Batalkan tanda
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
