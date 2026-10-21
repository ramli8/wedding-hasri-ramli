import { useQuery } from "@tanstack/react-query";
import { RSVP_LABEL, type RsvpStatus } from "@wedding/shared";
import { useMemo, useState } from "react";
import { PageHeader } from "../components/page-header.js";
import { Alert } from "../components/ui/alert.js";
import { Badge } from "../components/ui/badge.js";
import { Card } from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import { Select } from "../components/ui/select.js";
import { formatDateTime } from "../lib/datetime.js";
import { eventsQuery, rsvpQuery } from "../lib/queries.js";

type Filter = "" | RsvpStatus | "belum";

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <Card shadow="md" className="flex flex-col gap-1 p-4">
      <p className="tag text-ink-soft">{label}</p>
      <p className="font-display text-4xl leading-none font-bold">{value}</p>
      {note && <p className="text-xs text-ink-soft">{note}</p>}
    </Card>
  );
}

export function RsvpPage() {
  const events = useQuery(eventsQuery);
  const rsvpEvents = (events.data ?? []).filter((e) => e.hasRsvp);
  const [eventId, setEventId] = useState("");
  const [filter, setFilter] = useState<Filter>("");
  const [search, setSearch] = useState("");

  const rsvp = useQuery({ ...rsvpQuery(eventId || undefined), enabled: events.isSuccess });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (rsvp.data?.items ?? []).filter((row) => {
      if (filter === "belum" ? row.status !== null : filter && row.status !== filter) return false;
      return !term || row.displayName.toLowerCase().includes(term);
    });
  }, [rsvp.data, filter, search]);

  const totals = rsvp.data?.totals;

  return (
    <>
      <PageHeader
        tag="Undangan"
        title="RSVP"
        description="Jawaban tamu dari halaman undangan mereka. Tamu bisa mengubah jawabannya sampai hari acara."
      />

      {rsvpEvents.length > 1 && (
        <div className="max-w-xs">
          <Select
            compact
            aria-label="Acara"
            value={eventId || rsvp.data?.event.id || ""}
            onChange={(e) => setEventId(e.target.value)}
          >
            {rsvpEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {rsvp.isError && <Alert tone="error">{rsvp.error.message}</Alert>}

      {totals && rsvp.data && (
        <>
          <p className="text-sm text-ink-soft">
            {rsvp.data.event.name} · {totals.invited} undangan
          </p>
          <section aria-label="Ringkasan RSVP" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Hadir" value={totals.hadir} note={`${totals.hadirPax} orang`} />
            <Stat label="Tidak hadir" value={totals.tidakHadir} />
            <Stat label="Belum pasti" value={totals.ragu} />
            <Stat label="Belum menjawab" value={totals.belum} />
          </section>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full md:w-80">
              <Input
                type="search"
                aria-label="Cari tamu"
                placeholder="Cari nama tamu"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-52">
              <Select
                compact
                aria-label="Status"
                value={filter}
                onChange={(e) => setFilter(e.target.value as Filter)}
              >
                <option value="">Semua status</option>
                <option value="hadir">{RSVP_LABEL.hadir}</option>
                <option value="tidak_hadir">{RSVP_LABEL.tidak_hadir}</option>
                <option value="ragu">{RSVP_LABEL.ragu}</option>
                <option value="belum">Belum menjawab</option>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto border-2 border-ink bg-paper shadow-hard">
            <table className="table-cards w-full text-left text-sm">
              <thead className="tag border-b-2 border-ink text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kelompok</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Orang</th>
                  <th className="px-4 py-3">Dijawab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bone-2">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                      Tidak ada tamu yang cocok.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.guestId}>
                      <td className="px-4 py-3 font-medium">
                        {row.displayName}
                        {row.isRombongan && (
                          <span className="ml-2 text-xs text-ink-soft">rombongan</span>
                        )}
                      </td>
                      <td data-label="Kelompok" className="px-4 py-3">
                        {row.groupName ?? "—"}
                      </td>
                      <td data-label="Status" className="px-4 py-3">
                        {row.status ? (
                          <Badge variant={row.status === "hadir" ? "pillAcid" : "pill"}>
                            {RSVP_LABEL[row.status]}
                          </Badge>
                        ) : (
                          <span className="text-ink-soft">Belum menjawab</span>
                        )}
                      </td>
                      <td data-label="Orang" className="px-4 py-3 font-mono">
                        {row.status ? row.pax : "—"}
                      </td>
                      <td data-label="Dijawab" className="px-4 py-3 text-ink-soft">
                        {formatDateTime(row.submittedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
