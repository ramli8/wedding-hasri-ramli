import { useMutation, useQuery } from "@tanstack/react-query";
import { type Event, formatTimeRange, type Group } from "@wedding/shared";
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
import { adminApi } from "../lib/admin-api.js";
import { isoToWibDate, isoToWibTime, wibTimeToIso } from "../lib/datetime.js";
import { eventsQuery, groupsQuery, useRefresh } from "../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; group: Group } | null;

export function GroupsPage() {
  const groups = useQuery(groupsQuery);
  const events = useQuery(eventsQuery);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);

  const eventName = (id: string) => events.data?.find((e) => e.id === id)?.name ?? "Acara";

  return (
    <>
      <PageHeader
        tag="Kelompok"
        title="Kelompok tamu"
        description="Kelompok menentukan warna, penanda VIP, dan jam sesi tamu di tiap acara."
        actions={
          <Button onClick={() => setEditing({ kind: "new" })}>
            <Plus className="size-4" aria-hidden />
            Tambah kelompok
          </Button>
        }
      />

      {groups.isPending ? (
        <p className="text-ink-soft">Memuat…</p>
      ) : groups.isError ? (
        <Alert tone="error">{groups.error.message}</Alert>
      ) : groups.data.length === 0 ? (
        <Card>
          <p className="text-ink-soft">
            Belum ada kelompok, misalnya Keluarga, Teman Kuliah, atau Tim Klub.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto border-2 border-ink bg-paper shadow-hard">
          <table className="table-cards w-full text-left text-sm">
            <thead className="tag border-b-2 border-ink text-ink-soft">
              <tr>
                <th className="px-4 py-3">Kelompok</th>
                <th className="px-4 py-3">Tamu</th>
                <th className="px-4 py-3">Jam sesi</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-2">
              {groups.data.map((group) => (
                <tr key={group.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="size-3 shrink-0 border-2 border-ink"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                      {group.isVip && <Badge variant="solid">VIP</Badge>}
                    </span>
                  </td>
                  <td data-label="Tamu" className="px-4 py-3">
                    {group.guestCount}
                  </td>
                  <td data-label="Jam sesi" className="px-4 py-3">
                    {group.sessions.length === 0
                      ? "—"
                      : group.sessions.map((s) => (
                          <p key={s.eventId}>
                            {eventName(s.eventId)}: {formatTimeRange(s.startsAt, s.endsAt)}
                          </p>
                        ))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1 max-md:flex-wrap max-md:justify-start">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditing({ kind: "edit", group })}
                      >
                        Ubah
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleting(group)}>
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <DeleteGroupDialog group={deleting} onClose={() => setDeleting(null)} />
    </>
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
  const [color, setColor] = useState(group?.color ?? "#737373");
  const [isVip, setIsVip] = useState(group?.isVip ?? false);
  // Jam sesi per acara (WIB), disimpan sebagai nilai input time ("10:00"). Tanggalnya diambil dari
  // tanggal acara saat disimpan.
  const [sessions, setSessions] = useState<Record<string, { start: string; end: string }>>(() =>
    Object.fromEntries(
      (group?.sessions ?? []).map((s) => [
        s.eventId,
        { start: isoToWibTime(s.startsAt), end: isoToWibTime(s.endsAt) },
      ]),
    ),
  );

  const setSession = (eventId: string, patch: Partial<{ start: string; end: string }>) =>
    setSessions((current) => ({
      ...current,
      [eventId]: { start: "", end: "", ...current[eventId], ...patch },
    }));

  const save = useMutation({
    mutationFn: () => {
      const input = {
        name,
        color,
        isVip,
        sessions: Object.entries(sessions).flatMap(([eventId, range]) => {
          const date = isoToWibDate(events.find((e) => e.id === eventId)?.startsAt);
          const startsAt = wibTimeToIso(date, range.start);
          const endsAt = wibTimeToIso(date, range.end);
          return startsAt && endsAt ? [{ eventId, startsAt, endsAt }] : [];
        }),
      };
      return group ? adminApi.groups.update(group.id, input) : adminApi.groups.create(input);
    },
    onSuccess: async () => {
      await refresh("groups", "guests");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama kelompok">
          {(id) => (
            <Input id={id} required value={name} onChange={(e) => setName(e.target.value)} />
          )}
        </Field>
        <Field label="Warna">
          {(id) => (
            <input
              id={id}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 cursor-pointer border-2 border-ink bg-bone p-1"
            />
          )}
        </Field>
      </div>
      <Checkbox checked={isVip} onChange={(e) => setIsVip(e.target.checked)}>
        VIP (tampil berbeda di layar penjaga)
      </Checkbox>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Jam sesi per acara</legend>
        <p className="text-xs text-ink-soft">
          Isi jam saja (WIB); tanggalnya mengikuti tanggal acara. Kosongkan bila kelompok ini tidak
          punya jam khusus. Sesi dipakai untuk info di undangan dan dicatat di log; penjaga tidak
          diberi peringatan.
        </p>
        {events.length === 0 ? (
          <p className="text-ink-soft">Belum ada acara.</p>
        ) : (
          events.map((event) => {
            const noDate = !event.startsAt;
            return (
              <div key={event.id} className="grid items-center gap-2 sm:grid-cols-[8rem_1fr_1fr]">
                <span className="text-sm">{event.name}</span>
                <Input
                  type="time"
                  aria-label={`Mulai sesi di ${event.name}`}
                  disabled={noDate}
                  value={sessions[event.id]?.start ?? ""}
                  onChange={(e) => setSession(event.id, { start: e.target.value })}
                />
                <Input
                  type="time"
                  aria-label={`Selesai sesi di ${event.name}`}
                  disabled={noDate}
                  value={sessions[event.id]?.end ?? ""}
                  onChange={(e) => setSession(event.id, { end: e.target.value })}
                />
                {noDate && (
                  <p className="text-xs text-ink-soft sm:col-span-3">
                    Isi tanggal mulai acara ini dulu di menu Acara.
                  </p>
                )}
              </div>
            );
          })
        )}
      </fieldset>

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

function DeleteGroupDialog({ group, onClose }: { group: Group | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.groups.remove(id),
    onSuccess: async () => {
      await refresh("groups");
      onClose();
    },
  });

  return (
    <Dialog open={group !== null} onClose={onClose} title={`Hapus kelompok "${group?.name}"?`}>
      {group && (
        <>
          {group.guestCount > 0 ? (
            <Alert>
              Kelompok ini masih dipakai {group.guestCount} tamu. Pindahkan tamunya ke kelompok lain
              dulu, baru kelompok bisa dihapus.
            </Alert>
          ) : (
            <p>Jam sesi kelompok ini ikut terhapus.</p>
          )}
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(group.id)}
              disabled={remove.isPending || group.guestCount > 0}
            >
              Hapus kelompok
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
