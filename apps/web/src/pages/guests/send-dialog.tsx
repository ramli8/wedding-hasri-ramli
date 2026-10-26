import { useMutation } from "@tanstack/react-query";
import {
  type Event,
  type Group,
  type Guest,
  instagramDmUrl,
  type Settings,
  whatsappUrl,
} from "@wedding/shared";
import { Copy, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { SwitchRow } from "@/components/kit/form-rows";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../../lib/admin-api.js";
import { formatDateTime } from "../../lib/datetime.js";
import { buildMessage } from "../../lib/message.js";
import { useRefresh } from "../../lib/queries.js";

type Props = {
  guest: Guest | null;
  events: Event[];
  groups: Group[];
  settings: Settings | null | undefined;
  onClose: () => void;
};

export function SendDialog({ guest, events, groups, settings, onClose }: Props) {
  return (
    <Dialog
      open={guest !== null}
      onClose={onClose}
      wide
      title={`Kirim undangan: ${guest?.displayName ?? ""}`}
      description="Pesan dibuka di WhatsApp atau Instagram, lalu Anda menekan kirim sendiri."
    >
      {guest && <SendBody guest={guest} events={events} groups={groups} settings={settings} />}
    </Dialog>
  );
}

function SendBody({
  guest,
  events,
  groups,
  settings,
}: Omit<Props, "onClose" | "guest"> & { guest: Guest }) {
  const group = groups.find((g) => g.id === guest.groupId);
  const invitations = guest.events.flatMap((invitation) => {
    const event = events.find((e) => e.id === invitation.eventId);
    return event ? [{ invitation, event }] : [];
  });
  const first = invitations[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {guest.phone && <span>WhatsApp +{guest.phone}</span>}
        {guest.instagram && <span>Instagram @{guest.instagram}</span>}
        {!guest.phone && !guest.instagram && (
          <span>Tamu ini belum punya nomor HP atau Instagram; pesan hanya bisa disalin.</span>
        )}
      </div>
      {!settings && (
        <Alert tone="error">
          Alamat situs belum diisi, jadi link undangan belum bisa dibuat. Isi di Pengaturan →
          Pernikahan.
        </Alert>
      )}
      {!first ? (
        <Alert>Tamu ini belum diundang ke acara apa pun. Ubah tamu untuk memilih acara.</Alert>
      ) : (
        <Tabs defaultValue={first.event.id} className="gap-4">
          {invitations.length > 1 && (
            <TabsList>
              {invitations.map(({ event, invitation }) => (
                <TabsTrigger key={event.id} value={event.id}>
                  {event.name}
                  {invitation.sentAt && " ✓"}
                </TabsTrigger>
              ))}
            </TabsList>
          )}
          {invitations.map(({ invitation, event }) => (
            <TabsContent key={event.id} value={event.id}>
              <EventMessage
                guest={guest}
                event={event}
                sentAt={invitation.sentAt}
                sentVia={invitation.sentVia}
                initialText={buildMessage({ guest, event, group, settings })}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

const viaLabel = { whatsapp: "WhatsApp", instagram: "Instagram", other: "lainnya" } as const;

function EventMessage({
  guest,
  event,
  sentAt,
  sentVia,
  initialText,
}: {
  guest: Guest;
  event: Event;
  sentAt: string | null;
  sentVia: Guest["events"][number]["sentVia"];
  initialText: string;
}) {
  const refresh = useRefresh();
  const [text, setText] = useState(initialText);
  const [notice, setNotice] = useState<string | null>(null);

  const mark = useMutation({
    mutationFn: (input: { sent: boolean; via?: "whatsapp" | "instagram" | "other" }) =>
      adminApi.guests.markSent(guest.id, { eventId: event.id, ...input }),
    onSuccess: () => refresh("guests"),
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
    if (!guest.phone) return;
    // window.open harus dipanggil langsung dari klik agar tidak diblokir pop-up blocker.
    window.open(whatsappUrl(guest.phone, text), "_blank", "noopener");
    mark.mutate({ sent: true, via: "whatsapp" });
  }

  async function sendInstagram() {
    if (!guest.instagram) return;
    window.open(instagramDmUrl(guest.instagram), "_blank", "noopener");
    // Instagram tidak bisa mengisi teks otomatis, jadi pesan disalin untuk ditempel.
    await copy();
    mark.mutate({ sent: true, via: "instagram" });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`pesan-${event.id}`} className="text-sm leading-none font-medium">
            Isi pesan
          </label>
          {sentAt ? (
            <Badge variant="secondary">
              Terkirim via {viaLabel[sentVia ?? "other"]} · {formatDateTime(sentAt)}
            </Badge>
          ) : (
            <Badge variant="outline">Belum dikirim</Badge>
          )}
        </div>
        <Textarea
          id={`pesan-${event.id}`}
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
        {guest.phone && (
          <Button onClick={sendWhatsApp}>
            <MessageCircle aria-hidden />
            Buka WhatsApp
          </Button>
        )}
        {guest.instagram && (
          <Button variant={guest.phone ? "outline" : "default"} onClick={sendInstagram}>
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
        title="Sudah terkirim"
        description="Tandai manual bila Anda mengirimnya lewat cara lain."
        checked={sentAt !== null}
        onCheckedChange={(checked) =>
          mark.mutate(checked ? { sent: true, via: "other" } : { sent: false })
        }
      />
      {mark.error && <Alert tone="error">{mark.error.message}</Alert>}
    </div>
  );
}
