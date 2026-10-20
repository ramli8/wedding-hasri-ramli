import { useMutation } from "@tanstack/react-query";
import {
  type Event,
  type Group,
  type Guest,
  instagramDmUrl,
  type Settings,
  whatsappUrl,
} from "@wedding/shared";
import { useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Dialog } from "../../components/ui/dialog.js";
import { Textarea } from "../../components/ui/textarea.js";
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

  return (
    <div className="flex flex-col gap-4">
      {!settings && (
        <Alert tone="error">
          Alamat situs belum diisi, jadi link undangan belum bisa dibuat. Isi di menu Pengaturan.
        </Alert>
      )}
      {invitations.length === 0 && (
        <Alert>Tamu ini belum diundang ke acara apa pun. Ubah tamu untuk memilih acara.</Alert>
      )}
      {invitations.map(({ invitation, event }) => (
        <EventMessage
          key={event.id}
          guest={guest}
          event={event}
          sentAt={invitation.sentAt}
          sentVia={invitation.sentVia}
          initialText={buildMessage({ guest, event, group, settings })}
        />
      ))}
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
    <section className="flex flex-col gap-3 rounded-2xl border border-hairline p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-body font-semibold">{event.name}</h3>
        {sentAt ? (
          <Badge variant="solid">
            Terkirim via {viaLabel[sentVia ?? "other"]} · {formatDateTime(sentAt)}
          </Badge>
        ) : (
          <Badge variant="outline">Belum dikirim</Badge>
        )}
      </div>
      <Textarea
        aria-label={`Pesan untuk ${event.name}`}
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-32"
      />
      {notice && <p className="text-caption text-mid-gray">{notice}</p>}
      {mark.error && <Alert tone="error">{mark.error.message}</Alert>}
      <div className="flex flex-wrap gap-2">
        {guest.phone && <Button onClick={sendWhatsApp}>Buka WhatsApp</Button>}
        {guest.instagram && (
          <Button variant={guest.phone ? "outline" : "primary"} onClick={sendInstagram}>
            Salin &amp; buka DM Instagram
          </Button>
        )}
        <Button variant="secondary" onClick={copy}>
          Salin pesan
        </Button>
        {sentAt ? (
          <Button
            variant="outline"
            onClick={() => mark.mutate({ sent: false })}
            disabled={mark.isPending}
          >
            Batal tandai terkirim
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => mark.mutate({ sent: true, via: "other" })}
            disabled={mark.isPending}
          >
            Tandai terkirim
          </Button>
        )}
      </div>
    </section>
  );
}
