import { formatBuwuhItems } from "@wedding/shared";
import { CircleAlert, CloudUpload, Lock, Search, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { type BuwuhRow, canEdit, editableUntil } from "../../lib/buwuh/db.js";
import { formatRupiah } from "../../lib/format.js";

const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

/**
 * Riwayat catatan di HP ini, bergaya buku buwuh: nomor urut, nama, alamat, dan pemberiannya.
 * Di atasnya total uang yang dicatat di HP ini. Tombol Ubah hanya ada selama 10 menit setelah
 * mencatat (lihat BUWUH_EDIT_WINDOW_MS); sesudahnya perbaikan lewat admin.
 */
export function HistoryView({
  rows,
  onPick,
}: {
  rows: BuwuhRow[];
  onPick: (row: BuwuhRow) => void;
}) {
  const [query, setQuery] = useState("");
  // Diperbarui tiap 15 detik supaya tombol Ubah hilang tepat waktu.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  const money = rows.reduce((sum, row) => sum + row.amount, 0);
  const envelopes = rows.filter((row) => row.amount > 0).length;

  // Nomor urut seperti di buku: catatan pertama = 1.
  const numbered = rows.map((row, i) => ({ row, number: rows.length - i }));
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? numbered.filter(({ row }) =>
        [row.name, row.address, formatBuwuhItems(row.items)].some((text) =>
          text?.toLowerCase().includes(needle),
        ),
      )
    : numbered;

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-10">
      <section className="rounded-2xl bg-[var(--bw-surface)] p-4 shadow-[0_1px_2px_rgb(28_25_23/0.06)]">
        <p className="text-sm text-[var(--bw-muted)]">Uang di meja ini</p>
        <p className="bw-num mt-1 text-3xl font-extrabold tracking-tight">{formatRupiah(money)}</p>
        <p className="text-sm text-[var(--bw-muted)]">
          {envelopes} amplop · {rows.length - envelopes} pemberi barang
        </p>
      </section>

      <label className="relative block">
        <span className="sr-only">Cari nama, alamat, atau barang</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[var(--bw-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, alamat, atau barang"
          className="h-12 w-full rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-surface)] ps-10 pe-3 text-base outline-none focus:border-2 focus:border-[var(--bw-accent)]"
        />
      </label>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--bw-muted)]">
          {rows.length === 0 ? "Belum ada catatan." : "Tidak ada yang cocok."}
        </p>
      ) : (
        <ol className="flex flex-col rounded-2xl bg-[var(--bw-surface)] px-4">
          {shown.map(({ row, number }) => (
            <li key={row.id} className="border-b border-[var(--bw-line)] last:border-b-0">
              <div className="flex w-full items-start gap-3 py-3.5 text-start">
                <span className="bw-num w-7 shrink-0 pt-0.5 text-end text-sm font-semibold text-[var(--bw-muted)]">
                  {number}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base font-bold">{row.name}</span>
                  {row.address && (
                    <span className="truncate text-sm text-[var(--bw-muted)]">{row.address}</span>
                  )}
                  {row.items.length > 0 && (
                    <span className="text-sm">{formatBuwuhItems(row.items)}</span>
                  )}
                  {row.syncError && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-[var(--bw-danger)]">
                      <CircleAlert className="size-4 shrink-0" aria-hidden />
                      {row.syncError}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {row.amount > 0 && (
                    <span className="bw-num text-base font-bold">{formatRupiah(row.amount)}</span>
                  )}
                  <span className="bw-num text-xs text-[var(--bw-muted)]">
                    {timeFmt.format(new Date(row.recordedAt))}
                  </span>
                  {row.version > row.syncedVersion && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[var(--bw-warn-ink)]">
                      <CloudUpload className="size-3.5" aria-hidden />
                      antre
                    </span>
                  )}
                  {canEdit(row, now) ? (
                    <button
                      type="button"
                      onClick={() => onPick(row)}
                      aria-label={`Ubah catatan ${row.name}`}
                      className="bw-press mt-1 flex h-10 items-center gap-1.5 rounded-xl border border-[var(--bw-line-strong)] px-3 text-sm font-bold"
                    >
                      <SquarePen className="size-4" aria-hidden />
                      Ubah
                      {!row.syncError && (
                        <span className="bw-num font-normal text-[var(--bw-muted)]">
                          {Math.max(1, Math.ceil((editableUntil(row) - now) / 60_000))} mnt
                        </span>
                      )}
                    </button>
                  ) : (
                    <Lock
                      className="mt-1 size-3.5 text-[var(--bw-muted)]"
                      aria-label="Tidak bisa diubah lagi di HP; hubungi admin"
                    />
                  )}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
