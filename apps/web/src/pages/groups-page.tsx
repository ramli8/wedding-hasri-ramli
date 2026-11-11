import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DEFAULT_GROUP_COLOR, type Event, formatSessionTime, type Group } from "@wedding/shared";
import { Check, Clock, Palette, Plus, SquarePen, Star, Trash2, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Checkbox } from "@/components/kit/checkbox";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { SwitchRow } from "@/components/kit/form-rows";
import { EmptyState, FormFooter } from "@/components/kit/invitation-kit";
import { Select } from "@/components/kit/select";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api.js";
import { isoToWibDate, isoToWibTime, wibTimeToIso } from "../lib/datetime.js";
import { eventsQuery, groupsQuery, useRefresh } from "../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; group: Group } | null;

/** Isian jam datang satu acara: jam mulai, dan jam selesai atau "sampai selesai". */
type SessionDraft = { start: string; end: string; untilEnd: boolean };

/**
 * Isian awal saat admin memilih "Jam tertentu". Sengaja jam tetap: kolom jam yang kosong di HP
 * membuka pemilih pada jam sekarang, yang tidak ada hubungannya dengan jam acara.
 */
const DEFAULT_SESSION: SessionDraft = { start: "09:00", end: "11:00", untilEnd: false };

/**
 * Satu acara di formulir kelompok: dicentang bila kelompok ini diundang, lalu Jam bebas atau Jam
 * tertentu (mulai – selesai/sampai selesai).
 */
function EventRow({
  event,
  invited,
  onInvitedChange,
  value,
  onChange,
}: {
  event: Event;
  invited: boolean;
  onInvitedChange: (invited: boolean) => void;
  value: SessionDraft | null;
  onChange: (patch: Partial<SessionDraft> | null) => void;
}) {
  const noDate = !event.startsAt;
  const option = (active: boolean) =>
    cn(
      "min-h-9 flex-1 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors",
      active ? "bg-background shadow-sm" : "text-muted-foreground",
    );
  return (
    <div className={cn("grid gap-3 rounded-lg border p-3", !invited && "bg-muted/40")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Checkbox checked={invited} onChange={(e) => onInvitedChange(e.target.checked)}>
          <span className="font-medium">{event.name}</span>
        </Checkbox>
        {invited ? (
          <div className="flex w-full gap-1 rounded-lg bg-muted p-1 sm:w-auto">
            <button
              type="button"
              aria-pressed={value === null}
              className={option(value === null)}
              onClick={() => onChange(null)}
            >
              Jam bebas
            </button>
            <button
              type="button"
              aria-pressed={value !== null}
              disabled={noDate}
              className={option(value !== null)}
              onClick={() => onChange({})}
            >
              Jam tertentu
            </button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Tidak diundang</span>
        )}
      </div>
      {invited && noDate && (
        <p className="text-xs text-muted-foreground">Isi tanggal acara ini dulu di menu Acara.</p>
      )}
      {invited && value && (
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Mulai">
            {(id) => (
              <Input
                id={id}
                type="time"
                value={value.start}
                onChange={(e) => onChange({ start: e.target.value })}
              />
            )}
          </Field>
          <Field label="Selesai">
            {(id) => (
              <Input
                id={id}
                type="time"
                disabled={value.untilEnd}
                value={value.untilEnd ? "" : value.end}
                onChange={(e) => onChange({ end: e.target.value })}
              />
            )}
          </Field>
          <Checkbox
            checked={value.untilEnd}
            onChange={(e) => onChange({ untilEnd: e.target.checked })}
            className="sm:h-9"
          >
            Sampai selesai
          </Checkbox>
        </div>
      )}
    </div>
  );
}

/**
 * Kartu satu kelompok: warna dan nama, jumlah tamu, lalu acara yang diundang beserta jam datangnya.
 * Bentuknya sejalan dengan kartu di menu Acara.
 */
function GroupCard({
  group,
  events,
  onEdit,
  onDelete,
}: {
  group: Group;
  events: Event[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Urut seperti daftar acara; acara yang tidak diundang tidak ditampilkan.
  const invited = events.filter((e) => group.eventIds.includes(e.id));
  const action = buttonVariants({ variant: "outline", size: "sm" });
  return (
    <Card className="gap-4 py-4">
      <div className="flex items-start gap-3 px-4">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-xl text-lg font-semibold text-neutral-800 ring-1 ring-black/10"
          style={{ backgroundColor: group.color }}
        >
          {group.name.trim().charAt(0).toUpperCase()}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="grid min-w-0 flex-1 gap-1 text-start"
          aria-label={`Ubah ${group.name}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-semibold">{group.name}</span>
            {group.isVip && (
              <Badge>
                <Star aria-hidden />
                VIP
              </Badge>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-3.5 shrink-0" aria-hidden />
            {group.guestCount} tamu
          </span>
        </button>
        <DataTableRowActions
          actions={[
            { label: "Ubah", icon: <SquarePen />, onSelect: onEdit },
            "separator",
            { label: "Hapus", icon: <Trash2 />, destructive: true, onSelect: onDelete },
          ]}
        />
      </div>

      <ul className="grid gap-2 px-4">
        {invited.length === 0 ? (
          <li className="text-sm text-muted-foreground">Belum diundang ke acara apa pun.</li>
        ) : (
          invited.map((event) => {
            const session = group.sessions.find((s) => s.eventId === event.id);
            return (
              <li
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium">{event.name}</span>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1.5",
                    !session && "text-muted-foreground",
                  )}
                >
                  <Clock className="size-3.5" aria-hidden />
                  {session
                    ? formatSessionTime(session.startsAt, session.endsAt).replace(" WIB", "")
                    : "Jam bebas"}
                </span>
              </li>
            );
          })
        )}
      </ul>

      <div className="mt-auto grid grid-cols-2 gap-2 border-t px-4 pt-4">
        <Link
          to="/admin/tamu"
          search={{ kelompok: group.id }}
          className={action}
          data-slot="button"
        >
          <Users aria-hidden />
          Lihat tamu
        </Link>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <SquarePen aria-hidden />
          Ubah
        </Button>
      </div>
    </Card>
  );
}

export function GroupsPage() {
  const groups = useQuery(groupsQuery);
  const events = useQuery(eventsQuery);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);

  return (
    <>
      <PageHeader
        title="Kelompok tamu"
        description="Kelompok menentukan warna, penanda VIP, acara yang diundang, dan jam datang."
        // Saat masih kosong, tombolnya cukup satu: yang ada di kotak "Belum ada kelompok".
        actions={
          groups.isSuccess && groups.data.length > 0 ? (
            <Button onClick={() => setEditing({ kind: "new" })}>
              <Plus className="size-4" aria-hidden />
              Tambah kelompok
            </Button>
          ) : undefined
        }
      />

      {groups.isError && <Alert tone="error">{groups.error.message}</Alert>}
      {groups.isSuccess && groups.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada kelompok"
          description="Misalnya Keluarga, Teman Kuliah, atau Tim Klub. Kelompok memberi warna, penanda VIP, acara yang diundang, dan jam datang."
          addLabel="Tambah kelompok pertama"
          onAdd={() => setEditing({ kind: "new" })}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(groups.data ?? []).map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              events={events.data ?? []}
              onEdit={() => setEditing({ kind: "edit", group })}
              onDelete={() => setDeleting(group)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        wide
        title={editing?.kind === "edit" ? "Ubah kelompok" : "Tambah kelompok"}
      >
        {editing && (
          <GroupForm
            group={editing.kind === "edit" ? editing.group : null}
            events={events.data ?? []}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeleteGroupDialog
        group={deleting}
        groups={groups.data ?? []}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

/** Warna pastel siap pakai (kalem dan minimalis): cukup diketuk, tanpa membuka pemilih warna. */
const PRESET_COLORS = [
  { value: "#f4b6c2", name: "Merah muda" },
  { value: "#f7c9a9", name: "Peach" },
  { value: "#f3e0a3", name: "Krem" },
  { value: "#bcd9b4", name: "Hijau sage" },
  { value: "#a9dbd0", name: "Mint" },
  { value: "#b3cde8", name: "Biru langit" },
  { value: "#cfc0e8", name: "Lavender" },
  { value: "#d6d3d1", name: "Abu-abu" },
];

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const current = value.toLowerCase();
  const custom = !PRESET_COLORS.some((c) => c.value === current);
  return (
    <div role="radiogroup" aria-label="Warna" className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((color) => {
        const selected = color.value === current;
        return (
          // biome-ignore lint/a11y/useSemanticElements: tombol bulat lebih mudah diketuk daripada radio bawaan
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color.name}
            title={color.name}
            onClick={() => onChange(color.value)}
            className={cn(
              "grid size-11 place-items-center rounded-full border-2 text-neutral-800 transition-shadow",
              selected ? "border-foreground ring-2 ring-ring/40" : "border-black/5",
            )}
            style={{ backgroundColor: color.value }}
          >
            {selected && <Check className="size-5" aria-hidden />}
          </button>
        );
      })}
      <label
        title="Warna lain"
        className={cn(
          "relative grid size-11 cursor-pointer place-items-center rounded-full border-2",
          custom ? "border-foreground ring-2 ring-ring/40" : "border-dashed border-border",
        )}
        style={custom ? { backgroundColor: value } : undefined}
      >
        <Palette className={cn("size-5", custom && "text-neutral-800")} aria-hidden />
        <span className="sr-only">Warna lain</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

function GroupForm({
  group,
  events,
  onDone,
}: {
  group: Group | null;
  events: Event[];
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const [name, setName] = useState(group?.name ?? "");
  const [color, setColor] = useState(group?.color ?? DEFAULT_GROUP_COLOR);
  const [isVip, setIsVip] = useState(group?.isVip ?? false);
  // Kelompok baru belum diundang ke acara apa pun; admin mencentang acara yang diundang.
  const [eventIds, setEventIds] = useState<string[]>(() => group?.eventIds ?? []);
  const setInvited = (eventId: string, invited: boolean) => {
    setEventIds((current) =>
      invited ? [...current, eventId] : current.filter((id) => id !== eventId),
    );
    if (!invited) setSession(eventId, null);
  };
  // Jam datang per acara (WIB). Acara yang tidak ada di sini = jam bebas. Jam disimpan sebagai
  // nilai input time ("10:00"); tanggalnya diambil dari tanggal acara saat disimpan.
  const [sessions, setSessions] = useState<Record<string, SessionDraft>>(() =>
    Object.fromEntries(
      (group?.sessions ?? []).map((s) => [
        s.eventId,
        {
          start: isoToWibTime(s.startsAt),
          end: s.endsAt ? isoToWibTime(s.endsAt) : "",
          untilEnd: s.endsAt === null,
        },
      ]),
    ),
  );

  const setSession = (eventId: string, patch: Partial<SessionDraft> | null) =>
    setSessions((current) => {
      const next = { ...current };
      if (patch === null) delete next[eventId];
      else next[eventId] = { ...DEFAULT_SESSION, ...current[eventId], ...patch };
      return next;
    });

  const save = useMutation({
    mutationFn: () => {
      const input = {
        name,
        color,
        isVip,
        eventIds,
        sessions: Object.entries(sessions).flatMap(([eventId, range]) => {
          const date = isoToWibDate(events.find((e) => e.id === eventId)?.startsAt);
          const startsAt = wibTimeToIso(date, range.start);
          const endsAt = range.untilEnd ? null : wibTimeToIso(date, range.end);
          return startsAt && (range.untilEnd || endsAt) ? [{ eventId, startsAt, endsAt }] : [];
        }),
      };
      return group ? adminApi.groups.update(group.id, input) : adminApi.groups.create(input);
    },
    onSuccess: async () => {
      await refresh("groups", "guests");
      onDone();
    },
  });

  // "Jam tertentu" wajib berisi jam mulai, dan jam selesai bila tidak "sampai selesai".
  const halfSession = events.find((e) => {
    const range = sessions[e.id];
    return range && (!range.start || (!range.untilEnd && !range.end));
  });
  const backwardSession = events.find((e) => {
    const range = sessions[e.id];
    return range && !range.untilEnd && range.start && range.end && range.end <= range.start;
  });

  // Mengubah acara kelompok ikut mengubah undangan tamunya: beri tahu sebelum disimpan.
  const before = group?.eventIds ?? [];
  const removed = events.filter((e) => before.includes(e.id) && !eventIds.includes(e.id));
  const added = events.filter((e) => !before.includes(e.id) && eventIds.includes(e.id));
  const members = group?.guestCount ?? 0;
  const names = (list: Event[]) => list.map((e) => e.name).join(", ");

  const noEvent = events.length > 0 && eventIds.length === 0;

  // Pesan "belum lengkap" baru tampil setelah admin menekan Simpan, bukan saat sedang mengisi.
  const [tried, setTried] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setTried(true);
    if (noEvent || halfSession || backwardSession) return;
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama kelompok" required>
          {(id) => (
            <Input
              id={id}
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        <div className="grid content-start gap-2">
          <span className="text-sm leading-none font-medium">Warna</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
      <SwitchRow
        title="VIP"
        description="Tamu kelompok ini tampil berbeda di layar penjaga."
        checked={isVip}
        onCheckedChange={setIsVip}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Acara & jam datang</legend>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada acara.</p>
        ) : (
          events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              invited={eventIds.includes(event.id)}
              onInvitedChange={(invited) => setInvited(event.id, invited)}
              value={sessions[event.id] ?? null}
              onChange={(patch) => setSession(event.id, patch)}
            />
          ))
        )}
      </fieldset>

      {members > 0 && (removed.length > 0 || added.length > 0) && (
        <Alert>
          {added.length > 0 && `${members} tamu kelompok ini ikut diundang ke ${names(added)}. `}
          {removed.length > 0 && `${members} tamu kelompok ini dicabut dari ${names(removed)}.`}
        </Alert>
      )}

      {tried && noEvent && <Alert tone="error">Centang minimal satu acara.</Alert>}
      {tried && halfSession && (
        <Alert tone="error">
          Jam datang di {halfSession.name} belum lengkap. Isi jam mulai dan selesai, centang "Sampai
          selesai", atau pilih "Jam bebas".
        </Alert>
      )}
      {tried && !halfSession && backwardSession && (
        <Alert tone="error">Jam selesai di {backwardSession.name} harus setelah jam mulai.</Alert>
      )}
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

function DeleteGroupDialog({
  group,
  groups,
  onClose,
}: {
  group: Group | null;
  groups: Group[];
  onClose: () => void;
}) {
  return (
    <Dialog open={group !== null} onClose={onClose} title={`Hapus kelompok "${group?.name}"?`}>
      {group && <DeleteGroupBody group={group} groups={groups} onClose={onClose} />}
    </Dialog>
  );
}

function DeleteGroupBody({
  group,
  groups,
  onClose,
}: {
  group: Group;
  groups: Group[];
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const others = groups.filter((g) => g.id !== group.id);
  // Tamu wajib berkelompok: tamu kelompok ini dipindah dulu ke kelompok lain, lalu kelompok dihapus.
  const [moveTo, setMoveTo] = useState("");
  const hasGuests = group.guestCount > 0;
  const stuck = hasGuests && others.length === 0;
  const remove = useMutation({
    mutationFn: () => adminApi.groups.remove(group.id, hasGuests ? moveTo : undefined),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("groups", "guests");
      onClose();
    },
  });

  return (
    <>
      {stuck ? (
        <p>
          Kelompok ini masih punya {group.guestCount} tamu dan tidak ada kelompok lain untuk
          menampungnya. Buat kelompok lain dulu.
        </p>
      ) : hasGuests ? (
        <Field
          label={`Pindahkan ${group.guestCount} tamu ke`}
          hint="Tamunya tetap ada; kelompok dan acaranya ikut kelompok tujuan."
        >
          {(id) => (
            <Select id={id} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              <option value="" disabled>
                Pilih kelompok
              </option>
              {others.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : (
        <p>Jam datang kelompok ini ikut terhapus.</p>
      )}
      {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="destructive"
          onClick={() => remove.mutate()}
          disabled={remove.isPending || stuck || (hasGuests && !moveTo)}
        >
          {hasGuests ? "Pindahkan & hapus" : "Hapus kelompok"}
        </Button>
      </DialogActions>
    </>
  );
}
