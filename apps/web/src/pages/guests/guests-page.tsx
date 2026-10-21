import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { Group, Guest } from "@wedding/shared";
import { Download, Plus, Printer, Upload } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { PageHeader } from "../../components/page-header.js";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button, buttonStyles } from "../../components/ui/button.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { Dialog } from "../../components/ui/dialog.js";
import { Input } from "../../components/ui/input.js";
import { Select } from "../../components/ui/select.js";
import { adminApi, downloads } from "../../lib/admin-api.js";
import {
  eventsQuery,
  groupsQuery,
  guestsQuery,
  settingsQuery,
  useRefresh,
} from "../../lib/queries.js";
import { type GuestEditing, GuestFormDialog } from "./guest-form-dialog.js";
import { SendDialog } from "./send-dialog.js";

const PAGE_SIZE = 50;

/** Dua filter per baris di HP, lebar tetap di layar lebar. */
function Filter({ children }: { children: ReactNode }) {
  return <div className="w-[calc(50%-0.375rem)] md:w-44">{children}</div>;
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function GuestsPage() {
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("");
  const [eventId, setEventId] = useState("");
  const [sent, setSent] = useState<"" | "sent" | "unsent">("");
  const [onlyInstagram, setOnlyInstagram] = useState(false);
  const [onlyRombongan, setOnlyRombongan] = useState(false);
  const [trash, setTrash] = useState(false);
  const [page, setPage] = useState(1);

  const q = useDebounced(search.trim(), 300);
  const query = {
    q,
    groupId,
    eventId,
    sent: eventId && sent ? sent : undefined,
    onlyInstagram,
    rombongan: onlyRombongan,
    deleted: trash,
    page,
    pageSize: PAGE_SIZE,
  };

  const guests = useQuery(guestsQuery(query));
  const groups = useQuery(groupsQuery);
  const events = useQuery(eventsQuery);
  const settings = useQuery(settingsQuery);

  const [editing, setEditing] = useState<GuestEditing>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Guest | null>(null);

  // Setiap perubahan filter kembali ke halaman 1.
  // biome-ignore lint/correctness/useExhaustiveDependencies: hanya filter yang mereset halaman
  useEffect(() => setPage(1), [q, groupId, eventId, sent, onlyInstagram, onlyRombongan, trash]);

  const refresh = useRefresh();
  const restore = useMutation({
    mutationFn: (id: string) => adminApi.guests.restore(id),
    onSuccess: () => refresh("guests", "groups", "events"),
  });

  const groupById = new Map<string, Group>((groups.data ?? []).map((g) => [g.id, g]));
  const eventName = (id: string) => events.data?.find((e) => e.id === id)?.name ?? "Acara";
  const items = guests.data?.items ?? [];
  const total = guests.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sendingGuest = items.find((g) => g.id === sendingId) ?? null;

  return (
    <>
      <PageHeader
        tag="Tamu"
        title="Daftar tamu"
        description={`${total} undangan${trash ? " di tempat sampah" : ""}.`}
        actions={
          <>
            <a href={downloads.guestsCsv} className={buttonStyles({ variant: "secondary" })}>
              <Download className="size-4" aria-hidden />
              Ekspor CSV
            </a>
            <Link to="/admin/tamu/cetak" className={buttonStyles({ variant: "secondary" })}>
              <Printer className="size-4" aria-hidden />
              Cetak daftar
            </Link>
            <Link to="/admin/tamu/impor" className={buttonStyles({ variant: "secondary" })}>
              <Upload className="size-4" aria-hidden />
              Impor CSV
            </Link>
            <Button onClick={() => setEditing({ kind: "new" })}>
              <Plus className="size-4" aria-hidden />
              Tambah tamu
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full md:w-96">
          <Input
            type="search"
            aria-label="Cari tamu"
            placeholder="Cari nama, HP, Instagram, atau kode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Filter>
          <Select
            compact
            aria-label="Kelompok"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">Semua kelompok</option>
            {(groups.data ?? []).map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        </Filter>
        <Filter>
          <Select
            compact
            aria-label="Acara"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">Semua acara</option>
            {(events.data ?? []).map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
        </Filter>
        {eventId && (
          <Filter>
            <Select
              compact
              aria-label="Status kirim"
              value={sent}
              onChange={(e) => setSent(e.target.value as typeof sent)}
            >
              <option value="">Semua status kirim</option>
              <option value="unsent">Belum dikirim</option>
              <option value="sent">Sudah dikirim</option>
            </Select>
          </Filter>
        )}
        <Checkbox checked={onlyInstagram} onChange={(e) => setOnlyInstagram(e.target.checked)}>
          Hanya Instagram
        </Checkbox>
        <Checkbox checked={onlyRombongan} onChange={(e) => setOnlyRombongan(e.target.checked)}>
          Hanya rombongan
        </Checkbox>
        <Checkbox checked={trash} onChange={(e) => setTrash(e.target.checked)}>
          Tempat sampah
        </Checkbox>
      </div>

      {guests.isError && <Alert tone="error">{guests.error.message}</Alert>}
      {restore.error && <Alert tone="error">{restore.error.message}</Alert>}

      <div className="overflow-x-auto border-2 border-ink bg-paper shadow-hard">
        <table className="w-full text-left text-sm">
          <thead className="tag border-b-2 border-ink text-ink-soft">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kontak</th>
              <th className="px-4 py-3">Kelompok</th>
              <th className="px-4 py-3">Rombongan</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Undangan</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-bone-2">
            {guests.isPending && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-ink-soft">
                  Memuat…
                </td>
              </tr>
            )}
            {guests.isSuccess && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-ink-soft">
                  {total === 0 &&
                  !q &&
                  !groupId &&
                  !eventId &&
                  !onlyInstagram &&
                  !onlyRombongan &&
                  !trash
                    ? "Belum ada tamu. Tambahkan satu per satu atau impor dari CSV."
                    : "Tidak ada tamu yang cocok dengan filter."}
                </td>
              </tr>
            )}
            {items.map((guest) => {
              const group = guest.groupId ? groupById.get(guest.groupId) : undefined;
              return (
                <tr key={guest.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{guest.displayName}</p>
                  </td>
                  <td className="px-4 py-3">
                    {guest.phone && <p>+{guest.phone}</p>}
                    {guest.instagram && <p className="text-ink-soft">@{guest.instagram}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {group ? (
                      <Badge variant="pill">
                        <span
                          className="size-2 border border-ink"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                        {group.isVip && " · VIP"}
                      </Badge>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{guest.isRombongan ? "Ya" : "—"}</td>
                  <td className="px-4 py-3 font-mono font-semibold tabular-nums">
                    {guest.code ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {guest.events.map((invitation) => (
                        <Badge
                          key={invitation.eventId}
                          variant={invitation.sentAt ? "pillAcid" : "pill"}
                        >
                          {eventName(invitation.eventId)}
                          {invitation.sentAt ? " ✓" : ""}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {trash ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => restore.mutate(guest.id)}
                          disabled={restore.isPending}
                        >
                          Pulihkan
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSendingId(guest.id)}
                          >
                            Kirim
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditing({ kind: "edit", guest })}
                          >
                            Ubah
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleting(guest)}
                          >
                            Hapus
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-ink-soft">
            Halaman {page} dari {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage(page + 1)}
              disabled={page >= pageCount}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      <GuestFormDialog
        editing={editing}
        groups={groups.data ?? []}
        events={events.data ?? []}
        onClose={() => setEditing(null)}
      />
      <SendDialog
        guest={sendingGuest}
        events={events.data ?? []}
        groups={groups.data ?? []}
        settings={settings.data}
        onClose={() => setSendingId(null)}
      />
      <DeleteGuestDialog guest={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function DeleteGuestDialog({ guest, onClose }: { guest: Guest | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.guests.remove(id),
    onSuccess: async () => {
      await refresh("guests", "groups", "events");
      onClose();
    },
  });

  return (
    <Dialog open={guest !== null} onClose={onClose} title={`Hapus "${guest?.displayName}"?`}>
      {guest && (
        <>
          <p>Tamu dipindahkan ke tempat sampah dan bisa dipulihkan kapan saja.</p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(guest.id)}
              disabled={remove.isPending}
            >
              Hapus
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
