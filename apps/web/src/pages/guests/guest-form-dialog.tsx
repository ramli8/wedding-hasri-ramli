import { useMutation } from "@tanstack/react-query";
import type { Event, Group, Guest } from "@wedding/shared";
import { type FormEvent, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { Dialog } from "../../components/ui/dialog.js";
import { Field } from "../../components/ui/field.js";
import { Input } from "../../components/ui/input.js";
import { Select } from "../../components/ui/select.js";
import { adminApi } from "../../lib/admin-api.js";
import { useRefresh } from "../../lib/queries.js";

export type GuestEditing = { kind: "new" } | { kind: "edit"; guest: Guest } | null;

type Props = {
  editing: GuestEditing;
  groups: Group[];
  events: Event[];
  onClose: () => void;
};

export function GuestFormDialog({ editing, groups, events, onClose }: Props) {
  return (
    <Dialog
      open={editing !== null}
      onClose={onClose}
      wide
      title={editing?.kind === "edit" ? "Ubah tamu" : "Tambah tamu"}
    >
      {editing && (
        <GuestForm
          guest={editing.kind === "edit" ? editing.guest : null}
          groups={groups}
          events={events}
          onDone={onClose}
        />
      )}
    </Dialog>
  );
}

function GuestForm({
  guest,
  groups,
  events,
  onDone,
}: {
  guest: Guest | null;
  groups: Group[];
  events: Event[];
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const [displayName, setDisplayName] = useState(guest?.displayName ?? "");
  const [fullName, setFullName] = useState(guest?.fullName ?? "");
  const [phone, setPhone] = useState(guest?.phone ? `+${guest.phone}` : "");
  const [instagram, setInstagram] = useState(guest?.instagram ?? "");
  const [groupId, setGroupId] = useState(guest?.groupId ?? "");
  const [quota, setQuota] = useState(String(guest?.quota ?? 1));
  const [note, setNote] = useState(guest?.note ?? "");
  const [usherNote, setUsherNote] = useState(guest?.usherNote ?? "");
  // Tamu baru diundang ke semua acara secara bawaan.
  const [eventIds, setEventIds] = useState<string[]>(
    guest ? guest.events.map((e) => e.eventId) : events.map((e) => e.id),
  );

  const save = useMutation({
    mutationFn: () => {
      const input = {
        displayName,
        fullName,
        phone,
        instagram,
        groupId: groupId || null,
        quota: Number(quota),
        note,
        usherNote,
        eventIds,
      };
      return guest ? adminApi.guests.update(guest.id, input) : adminApi.guests.create(input);
    },
    onSuccess: async () => {
      await refresh("guests", "groups", "events");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const toggleEvent = (id: string, checked: boolean) =>
    setEventIds((current) => (checked ? [...current, id] : current.filter((e) => e !== id)));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama undangan" hint='Seperti di pesan, mis. "Bpk. Budi & Keluarga".'>
          {(id) => (
            <Input
              id={id}
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
        </Field>
        <Field label="Nama lengkap">
          {(id) => <Input id={id} value={fullName} onChange={(e) => setFullName(e.target.value)} />}
        </Field>
        <Field label="Nomor HP / WhatsApp" hint="Boleh diketik 0812-… atau +62 812-…">
          {(id) => (
            <Input
              id={id}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}
        </Field>
        <Field label="Instagram" hint="Isi bila tidak ada nomor HP. Tanpa @.">
          {(id) => (
            <Input id={id} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          )}
        </Field>
        <Field label="Kelompok">
          {(id) => (
            <Select id={id} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Tanpa kelompok</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Kuota orang" hint="Jumlah orang yang diundang dengan satu QR.">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={1}
              max={500}
              required
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
            />
          )}
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-body font-medium">Diundang ke acara</legend>
        {events.length === 0 ? (
          <p className="text-mid-gray">Belum ada acara. Tambahkan di menu Acara.</p>
        ) : (
          events.map((event) => (
            <Checkbox
              key={event.id}
              checked={eventIds.includes(event.id)}
              onChange={(e) => toggleEvent(event.id, e.target.checked)}
            >
              {event.name}
            </Checkbox>
          ))
        )}
      </fieldset>

      <Field label="Catatan untuk penjaga" hint="Tampil di layar scanner, mis. 'Pemain inti klub'.">
        {(id) => <Input id={id} value={usherNote} onChange={(e) => setUsherNote(e.target.value)} />}
      </Field>
      <Field label="Catatan internal">
        {(id) => <Input id={id} value={note} onChange={(e) => setNote(e.target.value)} />}
      </Field>

      {guest?.code && <p className="text-caption text-mid-gray">Kode tamu: {guest.code}</p>}
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
