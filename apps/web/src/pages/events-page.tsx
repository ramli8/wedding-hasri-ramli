import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type Event, eventInputSchema, formatEventDate } from "@wedding/shared";
import {
  CalendarCheck,
  CalendarDays,
  MapPin,
  MessageSquareText,
  Plus,
  ScanLine,
  SquarePen,
  Trash2,
  Users,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { SwitchRow } from "@/components/kit/form-rows";
import { FormFooter } from "@/components/kit/invitation-kit";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../lib/admin-api.js";
import { isoToWibDate, wibInputToIso } from "../lib/datetime.js";
import { eventsQuery, useRefresh } from "../lib/queries.js";
import { safeHref } from "../lib/safe-url.js";

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
        // Saat masih kosong, tombolnya cukup satu: yang ada di kartu "Belum ada acara".
        actions={
          events.isSuccess && events.data.length > 0 ? (
            <Button onClick={() => setEditing({ kind: "new" })}>
              Tambah acara
              <Plus aria-hidden />
            </Button>
          ) : undefined
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
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => setEditing({ kind: "edit", event })}
              onDelete={() => setDeleting(event)}
            />
          ))}
        </div>
      )}

      <EventDialog editing={editing} onClose={() => setEditing(null)} />
      <DeleteEventDialog event={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

const dayFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric" });
const monthFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "short" });
/** Kotak tanggal ala kalender: "21 / MEI". */
function DateTile({ iso }: { iso: string | null }) {
  return (
    <div className="grid w-14 shrink-0 place-items-center rounded-xl border bg-muted/50 py-2 leading-none">
      {iso ? (
        <>
          <span className="text-xl font-bold">{dayFormat.format(new Date(iso))}</span>
          <span className="mt-1 text-xs font-medium text-muted-foreground uppercase">
            {monthFormat.format(new Date(iso)).replace(".", "")}
          </span>
        </>
      ) : (
        <CalendarDays className="size-5 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const maps = safeHref(event.mapsUrl);
  const action = buttonVariants({ variant: "outline", size: "sm" });
  return (
    <Card className="gap-4 py-4">
      <div className="flex items-start gap-3 px-4">
        <DateTile iso={event.startsAt} />
        <button
          type="button"
          onClick={onEdit}
          className="grid min-w-0 flex-1 gap-1 text-start"
          aria-label={`Ubah ${event.name}`}
        >
          <span className="truncate text-base font-semibold">{event.name}</span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {event.startsAt ? formatEventDate(event.startsAt) : "Tanggal belum diatur"}
          </span>
          {event.venueName && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{event.venueName}</span>
            </span>
          )}
        </button>
        <DataTableRowActions
          actions={[
            { label: "Ubah", icon: <SquarePen />, onSelect: onEdit },
            "separator",
            { label: "Hapus", icon: <Trash2 />, destructive: true, onSelect: onDelete },
          ]}
        />
      </div>

      {(event.checkinEnabled || event.hasRsvp) && (
        <div className="flex flex-wrap gap-1.5 px-4">
          {event.checkinEnabled && (
            <Badge>
              <ScanLine aria-hidden />
              Check-in QR
            </Badge>
          )}
          {event.hasRsvp && (
            <Badge variant="secondary">
              <CalendarCheck aria-hidden />
              RSVP
            </Badge>
          )}
        </div>
      )}

      <div
        className={`mt-auto grid gap-2 border-t px-4 pt-4 ${maps ? "grid-cols-3" : "grid-cols-2"}`}
      >
        <Link to="/admin/tamu" search={{ acara: event.id }} className={action} data-slot="button">
          <Users aria-hidden />
          Tamu <span className="font-semibold">{event.invitedCount}</span>
        </Link>
        <Link
          to="/admin/pengaturan/pesan"
          search={{ acara: event.id }}
          className={action}
          data-slot="button"
        >
          <MessageSquareText aria-hidden />
          Pesan
        </Link>
        {maps && (
          <a href={maps} target="_blank" rel="noreferrer" className={action} data-slot="button">
            <MapPin aria-hidden />
            Peta
          </a>
        )}
      </div>
    </Card>
  );
}

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
  const events = useQuery(eventsQuery).data;
  const [name, setName] = useState(event?.name ?? "");
  // Acara cukup bertanggal; jam kedatangan diatur per kelompok (menu Kelompok).
  const [date, setDate] = useState(isoToWibDate(event?.startsAt));
  const [venueName, setVenueName] = useState(event?.venueName ?? "");
  const [address, setAddress] = useState(event?.address ?? "");
  const [mapsUrl, setMapsUrl] = useState(event?.mapsUrl ?? "");
  // Acara baru: RSVP langsung aktif; Check-in QR aktif hanya bila belum ada acara lain yang
  // memakainya, karena scanner melayani satu acara (yang paling awal bila lebih dari satu).
  const otherCheckin = (events ?? []).some((e) => e.checkinEnabled && e.id !== event?.id);
  const [checkinEnabled, setCheckinEnabled] = useState(event?.checkinEnabled ?? !otherCheckin);
  const [hasRsvp, setHasRsvp] = useState(event?.hasRsvp ?? true);
  const [errors, setErrors] = useState<Partial<Record<"name" | "mapsUrl", string>>>({});
  const startsAt = date ? wibInputToIso(`${date}T00:00`) : null;

  const save = useMutation({
    mutationFn: () => {
      // Kode singkat tidak diisi admin: dibuat server dari nama (lihat services/events.ts).
      const input = {
        name,
        startsAt,
        endsAt: null,
        venueName,
        address,
        mapsUrl,
        checkinEnabled,
        hasRsvp,
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
    // Aturan yang sama dengan server dicek di sini agar pesannya tampil di bawah kolomnya.
    const next: typeof errors = {};
    const parsed = eventInputSchema.safeParse({ name, startsAt, mapsUrl });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "name" || field === "mapsUrl") next[field] ??= issue.message;
      }
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field
        label="Nama acara"
        required
        hint='Mis. "Akad Nikah" atau "Resepsi".'
        error={errors.name}
      >
        {(id) => (
          <Input
            id={id}
            autoFocus={!event}
            value={name}
            aria-invalid={!!errors.name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
          />
        )}
      </Field>

      <Field label="Tanggal">
        {(id) => (
          <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        )}
      </Field>

      <Field label="Nama tempat">
        {(id) => (
          <Input
            id={id}
            placeholder="Gedung Graha Bunga"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
          />
        )}
      </Field>
      <Field label="Alamat">
        {(id) => (
          <Textarea
            id={id}
            rows={2}
            placeholder="Jl. Mawar No. 1, Surabaya"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        )}
      </Field>
      <Field label="Link Google Maps" error={errors.mapsUrl}>
        {(id) => (
          <Input
            id={id}
            type="url"
            inputMode="url"
            placeholder="https://maps.app.goo.gl/…"
            value={mapsUrl}
            onChange={(e) => {
              setMapsUrl(e.target.value);
              setErrors((current) => ({ ...current, mapsUrl: undefined }));
            }}
          />
        )}
      </Field>

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

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

function DeleteEventDialog({ event, onClose }: { event: Event | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.events.remove(id),
    meta: { toast: "Terhapus" },
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
