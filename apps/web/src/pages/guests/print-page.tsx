import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { Guest } from "@wedding/shared";
import { ArrowLeft, Printer } from "lucide-react";
import { PageHeader } from "../../components/page-header.js";
import { Alert } from "../../components/ui/alert.js";
import { Button, buttonStyles } from "../../components/ui/button.js";
import { adminApi } from "../../lib/admin-api.js";
import { eventsQuery, groupsQuery } from "../../lib/queries.js";

const PAGE_SIZE = 200;

async function loadAllGuests(eventId: string): Promise<Guest[]> {
  const all: Guest[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await adminApi.guests.list({ eventId, page, pageSize: PAGE_SIZE });
    all.push(...result.items);
    if (all.length >= result.total) break;
  }
  return all;
}

/**
 * Daftar tamu urut nama dengan kolom centang, untuk dicetak sebagai cadangan terakhir bila semua
 * perangkat bermasalah (lihat docs/rancangan.md §6.5).
 */
export function PrintPage() {
  const events = useQuery(eventsQuery);
  const groups = useQuery(groupsQuery);
  const event = events.data?.find((e) => e.checkinEnabled);

  const guests = useQuery({
    queryKey: ["guests", "print", event?.id],
    queryFn: () => loadAllGuests(event?.id ?? ""),
    enabled: !!event,
  });

  const groupName = new Map((groups.data ?? []).map((g) => [g.id, g.name]));
  const totalQuota = (guests.data ?? []).reduce((sum, g) => sum + g.quota, 0);

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          tag="Cadangan"
          title="Daftar tamu cetak"
          description="Cetak sebelum acara dan simpan di meja penerima tamu. Dipakai bila semua perangkat bermasalah."
          actions={
            <>
              <Link to="/admin/tamu" className={buttonStyles({ variant: "secondary" })}>
                <ArrowLeft className="size-4" aria-hidden /> Kembali
              </Link>
              <Button onClick={() => window.print()} disabled={!guests.data?.length}>
                <Printer className="size-4" aria-hidden /> Cetak
              </Button>
            </>
          }
        />
      </div>

      {events.isSuccess && !event && (
        <Alert tone="error">Belum ada acara dengan check-in aktif. Aktifkan di menu Acara.</Alert>
      )}
      {guests.isPending && event && <p className="text-ink-soft">Memuat…</p>}
      {guests.isError && <Alert tone="error">{guests.error.message}</Alert>}

      {guests.data && event && (
        <section className="flex flex-col gap-3">
          <div className="hidden print:block">
            <h1 className="font-display text-2xl font-bold uppercase">{event.name}: daftar tamu</h1>
          </div>
          <p className="text-sm text-ink-soft print:text-ink">
            {guests.data.length} undangan, {totalQuota} orang diundang. Urut nama.
          </p>
          <table className="w-full border-2 border-ink bg-paper text-left text-sm print:text-xs">
            <thead className="tag border-b-2 border-ink">
              <tr>
                <th className="w-10 px-2 py-2">✓</th>
                <th className="px-2 py-2">Nama</th>
                <th className="px-2 py-2">Kelompok</th>
                <th className="px-2 py-2">Kuota</th>
                <th className="px-2 py-2">Kode</th>
                <th className="px-2 py-2">Jumlah hadir</th>
              </tr>
            </thead>
            <tbody>
              {guests.data.map((guest) => (
                <tr key={guest.id} className="border-b border-ink break-inside-avoid">
                  <td className="px-2 py-2">
                    <span className="block size-5 border-2 border-ink" />
                  </td>
                  <td className="px-2 py-2 font-semibold">{guest.displayName}</td>
                  <td className="px-2 py-2">
                    {guest.groupId ? (groupName.get(guest.groupId) ?? "") : ""}
                  </td>
                  <td className="px-2 py-2 font-mono">{guest.quota}</td>
                  <td className="px-2 py-2 font-mono font-semibold">{guest.code}</td>
                  <td className="px-2 py-2">
                    <span className="block h-5 w-16 border-b-2 border-ink" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
