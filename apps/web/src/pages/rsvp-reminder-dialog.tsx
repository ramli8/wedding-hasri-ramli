import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DEFAULT_REMINDER_TEMPLATE, type RsvpRow, whatsappUrl } from "@wedding/shared";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Checkbox } from "@/components/kit/checkbox";
import { Dialog } from "@/components/kit/dialog";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "../lib/admin-api.js";
import { formatDateTime } from "../lib/datetime.js";
import { renderGuestText } from "../lib/message.js";
import { eventsQuery, groupsQuery, settingsQuery } from "../lib/queries.js";

/**
 * Pengingat RSVP: daftar tamu yang belum menjawab, masing-masing dengan tombol WhatsApp. Admin
 * menekan kirim sendiri di WhatsApp; di sini hanya ditandai bahwa pengingat sudah dibuka.
 */
export function ReminderDialog({
  open,
  onClose,
  eventId,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  rows: RsvpRow[];
}) {
  const queryClient = useQueryClient();
  const events = useQuery(eventsQuery);
  const groups = useQuery(groupsQuery);
  const settings = useQuery(settingsQuery);
  const [hideReminded, setHideReminded] = useState(true);

  const event = events.data?.find((e) => e.id === eventId);
  // Isi pesan diatur di Pengaturan → Pesan WhatsApp → Pengingat RSVP.
  const template = event?.reminderTemplate || DEFAULT_REMINDER_TEMPLATE;
  const pending = rows.filter((row) => row.status === null);
  const withPhone = pending.filter((row) => row.phone);
  const noPhone = pending.length - withPhone.length;
  const shown = withPhone.filter((row) => !(hideReminded && row.remindedAt));
  const remindedCount = withPhone.filter((row) => row.remindedAt).length;

  const mark = useMutation({
    mutationFn: (v: { guestId: string; reminded: boolean }) =>
      adminApi.rsvps.markReminded(v.guestId, eventId, v.reminded),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rsvp"] }),
  });

  const textFor = (row: RsvpRow) =>
    event
      ? renderGuestText(template, {
          guest: { displayName: row.displayName, code: row.code },
          event,
          group: groups.data?.find((g) => g.id === row.groupId),
          settings: settings.data,
        })
      : "";

  function send(row: RsvpRow) {
    if (!row.phone) return;
    // window.open harus dipanggil langsung dari klik agar tidak diblokir pop-up blocker.
    window.open(whatsappUrl(row.phone, textFor(row)), "_blank", "noopener");
    mark.mutate({ guestId: row.guestId, reminded: true });
  }

  const first = shown[0] ?? withPhone[0];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      title="Kirim pengingat RSVP"
      description={`${withPhone.length} tamu belum menjawab dan punya nomor HP; ${remindedCount} sudah diingatkan.`}
    >
      <div className="flex flex-col gap-2">
        {first && (
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold">
              Isi pesan (contoh untuk {first.displayName})
            </summary>
            <pre className="mt-2 border bg-background p-3 break-words whitespace-pre-wrap">
              {textFor(first)}
            </pre>
          </details>
        )}
        <Link
          to="/admin/pengaturan/pesan"
          search={{ acara: eventId, jenis: "pengingat" }}
          className={buttonVariants({ variant: "outline", size: "sm", className: "self-start" })}
        >
          <Pencil aria-hidden />
          Ubah isi pesan di Pengaturan
        </Link>
      </div>

      <Checkbox checked={hideReminded} onChange={(e) => setHideReminded(e.target.checked)}>
        Sembunyikan yang sudah diingatkan
      </Checkbox>
      {noPhone > 0 && (
        <p className="text-sm text-muted-foreground">
          {noPhone} tamu lain belum menjawab tetapi tidak punya nomor HP (hanya Instagram); kirim
          manual dari menu Tamu.
        </p>
      )}
      {mark.error && <Alert tone="error">{mark.error.message}</Alert>}
      {!settings.data?.publicBaseUrl && (
        <Alert>Isi alamat situs di Pengaturan agar tautan undangan ikut terkirim.</Alert>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {withPhone.length === 0
            ? "Semua tamu sudah menjawab."
            : "Semua tamu yang belum menjawab sudah diingatkan."}
        </p>
      ) : (
        <ul className="flex max-h-80 flex-col overflow-y-auto border">
          {shown.map((row) => (
            <li
              key={row.guestId}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-semibold break-words">{row.displayName}</p>
                {row.remindedAt ? (
                  <Badge variant="secondary">Diingatkan {formatDateTime(row.remindedAt)}</Badge>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {row.groupName ?? "Tanpa kelompok"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => send(row)} disabled={!event}>
                  {row.remindedAt ? "Kirim lagi" : "Buka WhatsApp"}
                </Button>
                {row.remindedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mark.isPending}
                    onClick={() => mark.mutate({ guestId: row.guestId, reminded: false })}
                  >
                    Batalkan tanda
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
