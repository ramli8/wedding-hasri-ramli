import { useMutation, useQuery } from "@tanstack/react-query";
import {
  type Event,
  type Group,
  type Guest,
  instagramDmUrl,
  type Settings,
  whatsappUrl,
} from "@wedding/shared";
import { MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { Select } from "@/components/kit/select";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "../../lib/admin-api.js";
import { buildMessage } from "../../lib/message.js";
import { guestsQuery, useRefresh } from "../../lib/queries.js";

type Props = {
  open: boolean;
  onClose: () => void;
  events: Event[];
  groups: Group[];
  settings: Settings | null | undefined;
  /** Acara yang dipilih lebih dulu (mis. filter Acara yang sedang aktif). */
  initialEventId?: string;
};

/**
 * Kirim undangan beruntun: daftar tamu yang belum dikirimi undangan untuk satu acara, masing-masing
 * dengan tombol yang membuka WhatsApp (atau DM Instagram) dan langsung menandai terkirim. Admin
 * cukup menekan kirim di WhatsApp, kembali, lalu lanjut ke tamu berikutnya di baris paling atas.
 */
export function SendQueueDialog({ open, onClose, ...rest }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      title="Kirim undangan beruntun"
      description="Tekan Buka WhatsApp, kirim di WhatsApp, lalu kembali ke sini untuk tamu berikutnya."
    >
      {open && <QueueBody {...rest} />}
    </Dialog>
  );
}

function QueueBody({ events, groups, settings, initialEventId }: Omit<Props, "open" | "onClose">) {
  const refresh = useRefresh();
  const [eventId, setEventId] = useState(
    events.find((e) => e.id === initialEventId)?.id ?? events[0]?.id ?? "",
  );
  // Tamu yang sudah dibuka di sesi ini tetap tampil di bawah, agar bisa dikirim ulang atau dibatalkan.
  const [opened, setOpened] = useState<Guest[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Daftar acara bisa datang belakangan dari server.
  useEffect(() => {
    if (!eventId && events[0]) setEventId(events[0].id);
  }, [eventId, events]);

  const list = useQuery({
    ...guestsQuery({ eventId, sent: "unsent", page: 1, pageSize: 200 }),
    enabled: eventId !== "",
  });
  const event = events.find((e) => e.id === eventId);

  const mark = useMutation({
    mutationFn: (v: { guest: Guest; sent: boolean; via?: "whatsapp" | "instagram" }) =>
      adminApi.guests.markSent(v.guest.id, { eventId, sent: v.sent, via: v.via }),
    meta: { toast: false },
    onSuccess: () => refresh("guests"),
  });

  const openedIds = new Set(opened.map((g) => g.id));
  const pending = (list.data?.items ?? []).filter((g) => !openedIds.has(g.id));
  const reachable = pending.filter((g) => g.phone || g.instagram);
  const unreachable = pending.length - reachable.length;
  const more = (list.data?.total ?? 0) - (list.data?.items.length ?? 0);

  const textFor = (guest: Guest) =>
    event
      ? buildMessage({
          guest,
          event,
          group: groups.find((g) => g.id === guest.groupId),
          settings,
        })
      : "";

  function remember(guest: Guest) {
    setOpened((current) =>
      current.some((g) => g.id === guest.id) ? current : [guest, ...current],
    );
  }

  function sendWhatsApp(guest: Guest) {
    if (!guest.phone) return;
    // window.open harus dipanggil langsung dari klik agar tidak diblokir pop-up blocker.
    window.open(whatsappUrl(guest.phone, textFor(guest)), "_blank", "noopener");
    remember(guest);
    mark.mutate({ guest, sent: true, via: "whatsapp" });
  }

  async function sendInstagram(guest: Guest) {
    if (!guest.instagram) return;
    window.open(instagramDmUrl(guest.instagram), "_blank", "noopener");
    // Instagram tidak bisa mengisi teks otomatis, jadi pesan disalin untuk ditempel.
    try {
      await navigator.clipboard.writeText(textFor(guest));
      setNotice(`Pesan untuk ${guest.displayName} disalin; tempel di DM Instagram.`);
    } catch {
      setNotice("Gagal menyalin pesan. Kirim dari tombol Kirim di baris tamu.");
    }
    remember(guest);
    mark.mutate({ guest, sent: true, via: "instagram" });
  }

  function undo(guest: Guest) {
    setOpened((current) => current.filter((g) => g.id !== guest.id));
    mark.mutate({ guest, sent: false });
  }

  if (events.length === 0) {
    return <Alert>Belum ada acara. Buat acara dulu di menu Acara.</Alert>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Acara">
        {(id) => (
          <Select
            id={id}
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setOpened([]);
              setNotice(null);
            }}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {!settings?.publicBaseUrl && (
        <Alert tone="error">
          Alamat situs belum diisi, jadi link undangan belum bisa dibuat. Isi di Pengaturan →
          Pernikahan.
        </Alert>
      )}
      {list.isError && <Alert tone="error">{list.error.message}</Alert>}
      {mark.error && <Alert tone="error">{mark.error.message}</Alert>}
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

      <p className="text-sm text-muted-foreground">
        {list.isPending
          ? "Memuat…"
          : `${reachable.length}${more > 0 ? "+" : ""} tamu belum dikirimi undangan ${event?.name ?? ""}.`}
        {opened.length > 0 && ` ${opened.length} baru saja dibuka.`}
      </p>

      {!list.isPending && reachable.length === 0 ? (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          {opened.length > 0
            ? "Selesai. Semua tamu di daftar ini sudah dibuka."
            : "Semua tamu acara ini sudah dikirimi undangan."}
        </p>
      ) : (
        <ul className="flex max-h-[50dvh] flex-col overflow-y-auto rounded-lg border">
          {reachable.map((guest, index) => (
            <li
              key={guest.id}
              className={`flex flex-wrap items-center justify-between gap-2 border-b p-3 last:border-b-0 ${index === 0 ? "bg-accent/40" : ""}`}
            >
              <div className="min-w-0">
                <p className="font-semibold break-words">{guest.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {guest.phone ? `+${guest.phone}` : `@${guest.instagram}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {guest.phone ? (
                  <Button
                    size="sm"
                    variant={index === 0 ? "default" : "outline"}
                    onClick={() => sendWhatsApp(guest)}
                  >
                    <MessageCircle aria-hidden />
                    Buka WhatsApp
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={index === 0 ? "default" : "outline"}
                    onClick={() => sendInstagram(guest)}
                  >
                    <Send aria-hidden />
                    Salin &amp; buka DM
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {more > 0 && (
        <p className="text-sm text-muted-foreground">
          Menampilkan 200 tamu pertama; sisanya muncul setelah daftar ini berkurang.
        </p>
      )}
      {unreachable > 0 && (
        <p className="text-sm text-muted-foreground">
          {unreachable} tamu belum punya nomor HP atau Instagram; lengkapi dulu lewat Ubah tamu.
        </p>
      )}

      {opened.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">
            Baru dibuka di sesi ini ({opened.length})
          </summary>
          <ul className="mt-2 flex flex-col rounded-lg border">
            {opened.map((guest) => (
              <li
                key={guest.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b p-3 last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="break-words">{guest.displayName}</span>
                  <Badge variant="secondary">Terkirim</Badge>
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => (guest.phone ? sendWhatsApp(guest) : sendInstagram(guest))}
                  >
                    Kirim lagi
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={mark.isPending}
                    onClick={() => undo(guest)}
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
