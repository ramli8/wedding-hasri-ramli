import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { Dashboard, ReviewItem } from "@wedding/shared";
import { type FormEvent, useState } from "react";
import { PageHeader } from "../components/page-header.js";
import { Alert } from "../components/ui/alert.js";
import { Badge } from "../components/ui/badge.js";
import { Button, buttonStyles } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Dialog } from "../components/ui/dialog.js";
import { Field } from "../components/ui/field.js";
import { Input } from "../components/ui/input.js";
import { adminApi } from "../lib/admin-api.js";
import { dashboardQuery, logQuery, reviewQuery, useRefresh } from "../lib/queries.js";
import { formatAgo, formatClock } from "../lib/scan/format.js";

const METHOD = {
  qr: "QR",
  code: "Kode",
  search: "Cari nama",
  walkin: "Tamu baru",
  admin: "Admin",
} as const;
type Recent = Dashboard["recent"][number];

export function CheckinPage() {
  const dashboard = useQuery(dashboardQuery);
  const review = useQuery(reviewQuery);
  const [correcting, setCorrecting] = useState<Recent | null>(null);
  const [undoing, setUndoing] = useState<Recent | null>(null);

  if (dashboard.isPending) return <p className="text-ink-soft">Memuat…</p>;
  if (dashboard.isError) {
    return (
      <>
        <PageHeader tag="Hari-H" title="Check-in" />
        <Alert tone="error">{dashboard.error.message}</Alert>
        <div>
          <Link to="/admin/acara" className={buttonStyles({ variant: "secondary" })}>
            Buka menu Acara
          </Link>
        </div>
      </>
    );
  }

  const d = dashboard.data;
  const items = review.data ?? [];

  return (
    <>
      <PageHeader
        tag="Hari-H"
        title="Check-in"
        description={`${d.event.name}. Disegarkan otomatis tiap 5 detik.`}
      />

      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Undangan masuk" value={`${d.totals.arrived}`} of={`/ ${d.totals.invited}`} />
        <Stat
          label="Orang hadir"
          value={`${d.totals.arrivedPax}`}
          of={`/ ${d.totals.expectedPax} diundang`}
        />
        <Stat label="Kartu souvenir" value={`${d.totals.arrivedPax}`} of="terbagi" />
        <Stat
          label="Perlu diperiksa"
          value={`${d.totals.needsReview}`}
          of="duplikat"
          highlight={d.totals.needsReview > 0}
        />
      </section>
      {(d.totals.walkins > 0 || d.totals.outsideSession > 0) && (
        <p className="text-sm text-ink-soft">
          {d.totals.walkins > 0 && `${d.totals.walkins} tamu baru (walk-in). `}
          {d.totals.outsideSession > 0 &&
            `${d.totals.outsideSession} masuk di luar jam sesi kelompoknya (hanya catatan).`}
        </p>
      )}

      {items.length > 0 && <ReviewSection items={items} />}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Per kelompok</h2>
        <div className="overflow-x-auto border-2 border-ink bg-paper shadow-hard">
          <table className="w-full text-left text-sm">
            <thead className="tag border-b-2 border-ink text-ink-soft">
              <tr>
                <th className="px-4 py-3">Kelompok</th>
                <th className="px-4 py-3">Gerbang</th>
                <th className="px-4 py-3">Masuk</th>
                <th className="px-4 py-3">Orang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-2">
              {d.groups.map((group) => (
                <tr key={group.id ?? "none"}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-semibold">
                      <span
                        className="size-3 border-2 border-ink"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                      {group.isVip && <Badge variant="solid">VIP</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-3">{group.gate ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">
                    {group.arrived} / {group.invited}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {group.pax} / {group.quota}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Terbaru</h2>
        {d.recent.length === 0 ? (
          <Card>
            <p className="text-ink-soft">Belum ada yang masuk.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto border-2 border-ink bg-paper shadow-hard">
            <table className="w-full text-left text-sm">
              <thead className="tag border-b-2 border-ink text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Jam</th>
                  <th className="px-4 py-3">Tamu</th>
                  <th className="px-4 py-3">Orang</th>
                  <th className="px-4 py-3">Lewat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-bone-2">
                {d.recent.map((row) => (
                  <tr key={row.checkinId}>
                    <td className="px-4 py-3 font-mono">{formatClock(row.scannedAt)}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap items-center gap-2 font-semibold">
                        {row.displayName}
                        {row.isVip && <Badge variant="solid">VIP</Badge>}
                        {row.hasDuplicates && <Badge variant="pill">Duplikat</Badge>}
                        {row.outsideSession && <Badge variant="pill">Luar sesi</Badge>}
                      </span>
                      {row.groupName && (
                        <span className="text-xs text-ink-soft">{row.groupName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">{row.pax}</td>
                    <td className="px-4 py-3">
                      {row.deviceName ?? "—"}
                      {row.method && (
                        <span className="text-xs text-ink-soft"> · {METHOD[row.method]}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="secondary" onClick={() => setCorrecting(row)}>
                          Ubah
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setUndoing(row)}>
                          Batal
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Perangkat</h2>
        <div className="overflow-x-auto border-2 border-ink bg-paper shadow-hard">
          <table className="w-full text-left text-sm">
            <thead className="tag border-b-2 border-ink text-ink-soft">
              <tr>
                <th className="px-4 py-3">Perangkat</th>
                <th className="px-4 py-3">Terakhir sinkron</th>
                <th className="px-4 py-3">Antrean</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-2">
              {d.devices
                .filter((device) => device.status === "active")
                .map((device) => {
                  const stale =
                    !device.lastSyncAt || Date.now() - Date.parse(device.lastSyncAt) > 60_000;
                  return (
                    <tr key={device.id}>
                      <td className="px-4 py-3 font-semibold">{device.name}</td>
                      <td className="px-4 py-3">
                        {device.lastSyncAt
                          ? formatAgo(Date.parse(device.lastSyncAt))
                          : "belum pernah"}
                        {stale && (
                          <Badge variant="solid" className="ml-2">
                            Lama
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {device.pendingOutbox}
                        {device.pendingOutbox > 0 && (
                          <Badge variant="pill" className="ml-2">
                            menunggu
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <LogSection />
      <PaxDialog row={correcting} onClose={() => setCorrecting(null)} />
      <UndoDialog row={undoing} onClose={() => setUndoing(null)} />
    </>
  );
}

function Stat({
  label,
  value,
  of,
  highlight,
}: {
  label: string;
  value: string;
  of: string;
  highlight?: boolean;
}) {
  return (
    <Card tone={highlight ? "acid" : "paper"} shadow="md" className="flex flex-col gap-2 p-4">
      <p className="tag text-ink-soft">{label}</p>
      <p className="font-mono text-4xl font-bold">{value}</p>
      <p className="text-xs text-ink-soft">{of}</p>
    </Card>
  );
}

function ReviewSection({ items }: { items: ReviewItem[] }) {
  const refresh = useRefresh();
  const resolve = useMutation({
    mutationFn: (input: {
      guestId: string;
      eventId: string;
      resolution: "keep_first" | "merge_pax";
    }) => adminApi.checkins.resolve(input),
    onSuccess: () => refresh("checkin"),
  });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Perlu diperiksa</h2>
      <p className="text-ink-soft">
        Tamu yang tercatat masuk lebih dari sekali (biasanya dua gerbang menerima tamu yang sama
        saat offline). Yang paling awal dihitung; pilih apakah sisanya diabaikan atau jumlahnya
        digabung.
      </p>
      {resolve.error && <Alert tone="error">{resolve.error.message}</Alert>}
      {items.map((item) => (
        <Card key={item.guestId} tone="acid" className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-xl font-bold">{item.displayName}</p>
            <p className="text-xs">
              {item.groupName ?? "Tanpa kelompok"} · kuota {item.quota}
            </p>
          </div>
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <b>Dihitung:</b> {formatClock(item.primary.scannedAt)} · {item.primary.pax} orang ·{" "}
              {item.primary.deviceName ?? "—"}
            </li>
            {item.duplicates.map((dup) => (
              <li key={dup.id}>
                <b>Duplikat:</b> {formatClock(dup.scannedAt)} · {dup.pax} orang ·{" "}
                {dup.deviceName ?? "—"}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={resolve.isPending}
              onClick={() =>
                resolve.mutate({
                  guestId: item.guestId,
                  eventId: item.eventId,
                  resolution: "keep_first",
                })
              }
            >
              Abaikan duplikat
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={resolve.isPending}
              onClick={() =>
                resolve.mutate({
                  guestId: item.guestId,
                  eventId: item.eventId,
                  resolution: "merge_pax",
                })
              }
            >
              Gabungkan jumlah
            </Button>
          </div>
        </Card>
      ))}
    </section>
  );
}

function LogSection() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const log = useQuery({ ...logQuery(page), enabled: open });
  const pageCount = Math.max(1, Math.ceil((log.data?.total ?? 0) / 30));
  const KIND = { checkin: "Masuk", undo: "Dibatalkan", set_pax: "Ubah jumlah" } as const;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-h2 uppercase">Riwayat lengkap</h2>
        <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Sembunyikan" : "Tampilkan"}
        </Button>
      </div>
      {open && log.data && (
        <>
          <div className="overflow-x-auto border-2 border-ink bg-paper shadow-hard">
            <table className="w-full text-left text-sm">
              <thead className="tag border-b-2 border-ink text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Jam</th>
                  <th className="px-4 py-3">Kejadian</th>
                  <th className="px-4 py-3">Tamu</th>
                  <th className="px-4 py-3">Orang</th>
                  <th className="px-4 py-3">Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bone-2">
                {log.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-2 font-mono">{formatClock(entry.scannedAt)}</td>
                    <td className="px-4 py-2">
                      {KIND[entry.kind]}
                      {entry.outsideSession && (
                        <span className="text-xs text-ink-soft"> · luar sesi</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{entry.displayName}</td>
                    <td className="px-4 py-2 font-mono">{entry.pax ?? "—"}</td>
                    <td className="px-4 py-2">
                      {entry.byAdmin ? "Admin" : (entry.deviceName ?? "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-ink-soft">
                Halaman {page} dari {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= pageCount}
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PaxDialog({ row, onClose }: { row: Recent | null; onClose: () => void }) {
  const refresh = useRefresh();
  const [pax, setPax] = useState("");
  const save = useMutation({
    mutationFn: (input: { id: string; pax: number }) =>
      adminApi.checkins.setPax(input.id, input.pax),
    onSuccess: async () => {
      await refresh("checkin");
      onClose();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (row) save.mutate({ id: row.checkinId, pax: Number(pax) });
  }

  return (
    <Dialog open={row !== null} onClose={onClose} title={`Ubah jumlah: ${row?.displayName ?? ""}`}>
      {row && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Jumlah orang yang masuk"
            hint="Admin bisa mengubah kapan saja, tanpa batas 2 menit."
          >
            {(id) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={500}
                required
                autoFocus
                value={pax || String(row.pax)}
                onChange={(e) => setPax(e.target.value)}
              />
            )}
          </Field>
          {save.error && <Alert tone="error">{save.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={save.isPending}>
              Simpan
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function UndoDialog({ row, onClose }: { row: Recent | null; onClose: () => void }) {
  const refresh = useRefresh();
  const undo = useMutation({
    mutationFn: (id: string) => adminApi.checkins.undo(id),
    onSuccess: async () => {
      await refresh("checkin");
      onClose();
    },
  });

  return (
    <Dialog
      open={row !== null}
      onClose={onClose}
      title={`Batalkan check-in ${row?.displayName ?? ""}?`}
    >
      {row && (
        <>
          <p>Tamu ini kembali dianggap belum masuk. Riwayatnya tetap tersimpan di log.</p>
          {undo.error && <Alert tone="error">{undo.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              onClick={() => undo.mutate(row.checkinId)}
              disabled={undo.isPending}
            >
              Batalkan check-in
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
