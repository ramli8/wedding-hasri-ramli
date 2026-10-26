import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  DEFAULT_MESSAGE_TEMPLATE,
  type Event,
  formatEventDate,
  MESSAGE_TEMPLATE_VARIABLES,
  renderTemplate,
} from "@wedding/shared";
import { CalendarDays, Plus, SquarePen, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormSection, SwitchRow } from "@/components/kit/form-rows";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
        title="Acara pernikahan"
        description="Akad, resepsi, dan acara lain. Check-in QR hanya aktif untuk acara yang ditandai."
        actions={
          <Button onClick={() => setEditing({ kind: "new" })}>
            Tambah acara
            <Plus aria-hidden />
          </Button>
        }
      />

      {events.isError && <Alert tone="error">{events.error.message}</Alert>}
      {events.isPending && <p className="text-muted-foreground">Memuat…</p>}
      {events.isSuccess && events.data.length === 0 && (
        <Card className="items-center px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted">
            <CalendarDays className="size-6" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">Belum ada acara</p>
            <p className="text-sm text-muted-foreground">
              Mulai dengan acara utama, misalnya Akad Nikah atau Resepsi. Tamu diundang per acara.
            </p>
          </div>
          <Button onClick={() => setEditing({ kind: "new" })}>
            Tambah acara pertama
            <Plus aria-hidden />
          </Button>
        </Card>
      )}
      {events.isSuccess && events.data.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.data.map((event) => (
            <Card key={event.id} className="gap-4">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                    <CalendarDays className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <CardDescription>
                      {event.startsAt ? formatDateTime(event.startsAt) : "Waktu belum diatur"}
                    </CardDescription>
                  </div>
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Ubah",
                        icon: <SquarePen />,
                        onSelect: () => setEditing({ kind: "edit", event }),
                      },
                      "separator",
                      {
                        label: "Hapus",
                        icon: <Trash2 />,
                        destructive: true,
                        onSelect: () => setDeleting(event),
                      },
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={event.checkinEnabled ? "default" : "outline"}>
                    {event.checkinEnabled ? "Check-in QR aktif" : "Tanpa check-in"}
                  </Badge>
                  <Badge variant={event.hasRsvp ? "secondary" : "outline"}>
                    {event.hasRsvp ? "RSVP" : "Tanpa RSVP"}
                  </Badge>
                  <Badge variant="outline">/{event.slug}</Badge>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">Selesai</dt>
                  <dd>{event.endsAt ? formatDateTime(event.endsAt) : "—"}</dd>
                  <dt className="text-muted-foreground">Tempat</dt>
                  <dd>
                    {event.venueName ?? "—"}
                    {event.mapsUrl && (
                      <a
                        href={event.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ms-2 text-muted-foreground underline underline-offset-4"
                      >
                        peta
                      </a>
                    )}
                  </dd>
                </dl>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-2xl leading-none font-bold">{event.invitedCount}</p>
                    <p className="text-xs text-muted-foreground">tamu diundang</p>
                  </div>
                  <Link
                    to="/admin/tamu"
                    search={{ acara: event.id }}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Lihat tamu
                  </Link>
                </div>
              </CardContent>
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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection title="Informasi dasar">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama acara" hint='Mis. "Akad Nikah" atau "Resepsi".'>
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
          <Field label="Slug" hint="Singkatan untuk impor CSV, mis. resepsi.">
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
        </div>
      </FormSection>

      <FormSection title="Waktu" description="Jam ditulis dalam WIB.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mulai">
            {(id) => (
              <Input
                id={id}
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            )}
          </Field>
          <Field label="Selesai">
            {(id) => (
              <Input
                id={id}
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection title="Lokasi">
        <div className="grid gap-4 sm:grid-cols-2">
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
      </FormSection>

      <FormSection title="Fitur acara">
        <SwitchRow
          title="Check-in QR"
          description="Penjaga memindai QR tamu di pintu. Hanya satu acara yang biasanya perlu ini."
          checked={checkinEnabled}
          onCheckedChange={setCheckinEnabled}
        />
        <SwitchRow
          title="RSVP"
          description="Tamu menjawab hadir atau tidak dari halaman undangannya."
          checked={hasRsvp}
          onCheckedChange={setHasRsvp}
        />
      </FormSection>

      <FormSection
        title="Pesan undangan"
        description="Kosong berarti memakai template bawaan. Klik variabel untuk menyisipkannya."
      >
        <Field label="Template">
          {(id) => (
            <Textarea
              id={id}
              value={messageTemplate}
              placeholder={DEFAULT_MESSAGE_TEMPLATE}
              spellCheck={false}
              className="min-h-32 font-mono text-sm"
              onChange={(e) => setMessageTemplate(e.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {MESSAGE_TEMPLATE_VARIABLES.map((variable) => (
            <button
              key={variable.name}
              type="button"
              title={variable.description}
              onClick={() => setMessageTemplate((text) => `${text}${variable.name}`)}
            >
              <Badge variant="outline" className="font-mono hover:bg-accent">
                {variable.name}
              </Badge>
            </button>
          ))}
        </div>
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Pratinjau</p>
          <p className="text-sm whitespace-pre-wrap">{preview}</p>
        </div>
      </FormSection>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDone}>
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
            <Button variant="outline" onClick={onClose}>
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
