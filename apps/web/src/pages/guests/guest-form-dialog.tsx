import { useMutation } from "@tanstack/react-query";
import type { Event, Group, Guest } from "@wedding/shared";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { CheckCard, FormSection, SwitchRow } from "@/components/kit/form-rows";
import { Select } from "@/components/kit/select";
import { Input } from "@/components/ui/input";
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
  const [phone, setPhone] = useState(guest?.phone ? `+${guest.phone}` : "");
  const [instagram, setInstagram] = useState(guest?.instagram ?? "");
  const [groupId, setGroupId] = useState(guest?.groupId ?? "");
  const [isRombongan, setIsRombongan] = useState(guest?.isRombongan ?? false);
  const [usherNote, setUsherNote] = useState(guest?.usherNote ?? "");
  // Tamu baru diundang ke semua acara secara bawaan.
  const [eventIds, setEventIds] = useState<string[]>(
    guest ? guest.events.map((e) => e.eventId) : events.map((e) => e.id),
  );

  const save = useMutation({
    mutationFn: () => {
      const input = {
        displayName,
        phone,
        instagram,
        groupId: groupId || null,
        isRombongan,
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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection
        title="Identitas"
        description="Nama seperti yang akan tertulis di pesan undangan."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nama undangan" hint='Mis. "Bpk. Budi & Keluarga".'>
              {(id) => (
                <Input
                  id={id}
                  required
                  autoFocus
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              )}
            </Field>
          </div>
          <Field label="Nomor HP / WhatsApp" hint="Boleh 0812-… atau +62 812-…">
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
        </div>
      </FormSection>

      <FormSection title="Pengelompokan">
        <Field label="Kelompok" hint="Menentukan warna, penanda VIP, dan jam sesi.">
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
        <SwitchRow
          title="Rombongan"
          description="Penjaga mengisi jumlah orang saat check-in. Selain itu otomatis 1 orang."
          checked={isRombongan}
          onCheckedChange={setIsRombongan}
        />
      </FormSection>

      <FormSection title="Diundang ke acara">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada acara. Tambahkan di menu Acara.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {events.map((event) => (
              <CheckCard
                key={event.id}
                title={event.name}
                checked={eventIds.includes(event.id)}
                onCheckedChange={(checked) => toggleEvent(event.id, checked)}
              />
            ))}
          </div>
        )}
      </FormSection>

      <Field label="Catatan untuk penjaga" hint="Tampil di layar scanner, mis. 'Pemain inti klub'.">
        {(id) => <Input id={id} value={usherNote} onChange={(e) => setUsherNote(e.target.value)} />}
      </Field>

      {guest?.code && <p className="text-xs text-muted-foreground">Kode tamu: {guest.code}</p>}
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
