import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { Guest } from "@wedding/shared";
import { ArrowLeft, Printer } from "lucide-react";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { PageHeader } from "@/components/page-header";
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

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          tag="Cadangan"
          title="Daftar tamu cetak"
          description="Cetak sebelum acara dan simpan di meja penerima tamu. Dipakai bila semua perangkat bermasalah."
          actions={
            <>
              <Link to="/admin/tamu" className={buttonVariants({ variant: "outline" })}>
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
      {guests.isPending && event && <p className="text-muted-foreground">Memuat…</p>}
      {guests.isError && <Alert tone="error">{guests.error.message}</Alert>}

      {guests.data && event && (
        <section className="flex flex-col gap-3">
          <div className="hidden print:block">
            <h1 className="text-2xl font-bold">{event.name}: daftar tamu</h1>
          </div>
          <p className="text-sm text-muted-foreground print:text-foreground">
            {guests.data.length} undangan. Urut nama.
          </p>
          <table className="w-full rounded-lg border bg-card text-left text-sm print:text-xs">
            <thead className="text-xs font-medium border-b border-border">
              <tr>
                <th className="w-10 px-2 py-2">✓</th>
                <th className="px-2 py-2">Nama</th>
                <th className="px-2 py-2">Kelompok</th>
                <th className="px-2 py-2">Rombongan</th>
                <th className="px-2 py-2">Kode</th>
                <th className="px-2 py-2">Jumlah hadir</th>
              </tr>
            </thead>
            <tbody>
              {guests.data.map((guest) => (
                <tr key={guest.id} className="border-b border-border break-inside-avoid">
                  <td className="px-2 py-2">
                    <span className="block size-5 border" />
                  </td>
                  <td className="px-2 py-2 font-semibold">{guest.displayName}</td>
                  <td className="px-2 py-2">
                    {guest.groupId ? (groupName.get(guest.groupId) ?? "") : ""}
                  </td>
                  <td className="px-2 py-2">{guest.isRombongan ? "Ya" : ""}</td>
                  <td className="px-2 py-2 font-mono font-semibold">{guest.code}</td>
                  <td className="px-2 py-2">
                    <span className="block h-5 w-16 border-b border-border" />
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
