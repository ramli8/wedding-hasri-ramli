import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DEFAULT_MESSAGE_TEMPLATE,
  type Event,
  formatEventDate,
  MESSAGE_TEMPLATE_VARIABLES,
  renderTemplate,
} from "@wedding/shared";
import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { PageHeader } from "../components/page-header.js";
import { Alert } from "../components/ui/alert.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Checkbox } from "../components/ui/checkbox.js";
import { Dialog } from "../components/ui/dialog.js";
import { Field } from "../components/ui/field.js";
import { Input } from "../components/ui/input.js";
import { Textarea } from "../components/ui/textarea.js";
import { adminApi } from "../lib/admin-api.js";
import { formatDateTime, isoToWibInput, wibInputToIso } from "../lib/datetime.js";
import { eventsQuery, useRefresh } from "../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; event: Event } | null;

export function EventsPage() {
  const events = useQuery(eventsQuery);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);

  return (
    <>
      <PageHeader
        tag="Acara"
        title="Acara pernikahan"
        description="Akad, resepsi, dan acara lain. Check-in QR hanya aktif untuk acara yang ditandai."
        actions={
          <Button onClick={() => setEditing({ kind: "new" })}>
            <Plus className="size-4" aria-hidden />
            Tambah acara
          </Button>
        }
      />

      {events.isPending ? (
        <p className="text-ink-soft">Memuat…</p>
      ) : events.isError ? (
        <Alert tone="error">{events.error.message}</Alert>
      ) : events.data.length === 0 ? (
        <Card>
          <p className="text-ink-soft">
            Belum ada acara. Tambahkan acara pertama, misalnya Resepsi.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.data.map((event) => (
            <Card key={event.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold tracking-h3 uppercase">
                    {event.name}
                  </h2>
                  <p className="text-xs text-ink-soft">/{event.slug}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {event.checkinEnabled && <Badge variant="solid">Check-in QR</Badge>}
                  {event.hasRsvp && <Badge variant="tag">RSVP</Badge>}
                </div>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-ink-soft">Mulai</dt>
                <dd>{formatDateTime(event.startsAt)}</dd>
                <dt className="text-ink-soft">Selesai</dt>
                <dd>{formatDateTime(event.endsAt)}</dd>
                <dt className="text-ink-soft">Tempat</dt>
                <dd>{event.venueName ?? "—"}</dd>
                <dt className="text-ink-soft">Diundang</dt>
                <dd>{event.invitedCount} tamu</dd>
              </dl>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing({ kind: "edit", event })}
                >
                  Ubah
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleting(event)}>
                  Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EventDialog editing={editing} onClose={() => setEditing(null)} />
      <DeleteEventDialog event={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function EventDialog({ editing, onClose }: { editing: Editing; onClose: () => void }) {
  return (
    <Dialog
      open={editing !== null}
      onClose={onClose}
      wide
      title={editing?.kind === "edit" ? "Ubah acara" : "Tambah acara"}
    >
      {editing && (
        <EventForm event={editing.kind === "edit" ? editing.event : null} onDone={onClose} />
      )}
    </Dialog>
  );
}

function EventForm({ event, onDone }: { event: Event | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [name, setName] = useState(event?.name ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(event !== null);
  const [startsAt, setStartsAt] = useState(isoToWibInput(event?.startsAt));
  const [endsAt, setEndsAt] = useState(isoToWibInput(event?.endsAt));
  const [venueName, setVenueName] = useState(event?.venueName ?? "");
  const [address, setAddress] = useState(event?.address ?? "");
  const [mapsUrl, setMapsUrl] = useState(event?.mapsUrl ?? "");
  const [checkinEnabled, setCheckinEnabled] = useState(event?.checkinEnabled ?? false);
  const [hasRsvp, setHasRsvp] = useState(event?.hasRsvp ?? false);
  const [messageTemplate, setMessageTemplate] = useState(event?.messageTemplate ?? "");

  const save = useMutation({
    mutationFn: () => {
      const input = {
        slug,
        name,
        startsAt: wibInputToIso(startsAt),
        endsAt: wibInputToIso(endsAt),
        venueName,
        address,
        mapsUrl,
        checkinEnabled,
        hasRsvp,
        messageTemplate,
      };
      return event ? adminApi.events.update(event.id, input) : adminApi.events.create(input);
    },
    onSuccess: async () => {
      await refresh("events");
      onDone();
    },
  });

  function onSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    save.mutate();
  }

  const preview = renderTemplate(messageTemplate || DEFAULT_MESSAGE_TEMPLATE, {
    panggilan: "Bpk. Budi & Keluarga",
    link: "https://contoh.com/u/ABC234",
    acara: name || "Resepsi",
    tanggal: formatEventDate(wibInputToIso(startsAt)) || "Jumat, 21 Mei 2027",
    jam_sesi: "10.00–12.00 WIB",
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama acara">
          {(id) => (
            <Input
              id={id}
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          )}
        </Field>
        <Field label="Slug" hint="Dipakai di impor CSV, mis. resepsi.">
          {(id) => (
            <Input
              id={id}
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          )}
        </Field>
        <Field label="Mulai (WIB)">
          {(id) => (
            <Input
              id={id}
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          )}
        </Field>
        <Field label="Selesai (WIB)">
          {(id) => (
            <Input
              id={id}
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          )}
        </Field>
        <Field label="Nama tempat">
          {(id) => (
            <Input id={id} value={venueName} onChange={(e) => setVenueName(e.target.value)} />
          )}
        </Field>
        <Field label="Link peta">
          {(id) => (
            <Input
              id={id}
              type="url"
              placeholder="https://maps.google.com/…"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
            />
          )}
        </Field>
      </div>
      <Field label="Alamat">
        {(id) => <Input id={id} value={address} onChange={(e) => setAddress(e.target.value)} />}
      </Field>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Checkbox checked={checkinEnabled} onChange={(e) => setCheckinEnabled(e.target.checked)}>
          Check-in QR aktif
        </Checkbox>
        <Checkbox checked={hasRsvp} onChange={(e) => setHasRsvp(e.target.checked)}>
          Ada RSVP
        </Checkbox>
      </div>

      <div className="flex flex-col gap-2">
        <Field
          label="Template pesan undangan"
          hint="Kosong = memakai template bawaan. Klik variabel untuk menambahkannya."
        >
          {(id) => (
            <Textarea
              id={id}
              value={messageTemplate}
              placeholder={DEFAULT_MESSAGE_TEMPLATE}
              spellCheck={false}
              onChange={(e) => setMessageTemplate(e.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-1">
          {MESSAGE_TEMPLATE_VARIABLES.map((variable) => (
            <button
              key={variable.name}
              type="button"
              title={variable.description}
              onClick={() => setMessageTemplate((text) => `${text}${variable.name}`)}
              className="border-2 border-ink px-2 py-0.5 text-xs hover:bg-bone"
            >
              {variable.name}
            </button>
          ))}
        </div>
        <div className="bg-bone p-3">
          <p className="mb-1 text-xs text-ink-soft">Pratinjau</p>
          <p className="whitespace-pre-wrap text-sm">{preview}</p>
        </div>
      </div>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteEventDialog({ event, onClose }: { event: Event | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.events.remove(id),
    onSuccess: async () => {
      await refresh("events", "guests", "groups");
      onClose();
    },
  });

  return (
    <Dialog open={event !== null} onClose={onClose} title={`Hapus acara "${event?.name}"?`}>
      {event && (
        <>
          <p>
            {event.invitedCount > 0
              ? `${event.invitedCount} tamu diundang ke acara ini. Undangan dan jam sesi kelompok untuk acara ini ikut terhapus; tamunya tetap ada.`
              : "Jam sesi kelompok untuk acara ini ikut terhapus."}
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(event.id)}
              disabled={remove.isPending}
            >
              Hapus acara
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
