import { useNavigate } from "@tanstack/react-router";
import { type BuwuhItem, type BuwuhKind, buwuhKind, formatBuwuhItems } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CircleAlert,
  CircleCheck,
  CloudOff,
  EllipsisVertical,
  History,
  LogOut,
  Package,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeProvider } from "@/context/theme-provider";
import { useDocumentTitle } from "@/lib/document-title";
import {
  addEntry,
  type BuwuhRow,
  buwuhDb,
  canEdit,
  deleteEntry,
  frequentAddresses,
  getBuwuhMeta,
  getCatalog,
  releaseBuwuh,
  setBuwuhMeta,
  updateEntry,
  visibleEntries,
} from "../../lib/buwuh/db.js";
import { startBuwuhSync, useBuwuhSyncStatus } from "../../lib/buwuh/sync.js";
import { formatRupiah } from "../../lib/format.js";
import { ConfirmDialog } from "./confirm-dialog.js";
import { GoodsGrid } from "./goods-grid.js";
import { HistoryView } from "./history-view.js";
import { MoneyPad } from "./money-pad.js";
import { NameSheet } from "./name-sheet.js";

type View = "catat" | "riwayat";

const FLASH_MS = 3000;

/**
 * HP meja buwuh, dibuat seperti aplikasi kasir: pilih Uang atau Barang (satu pemberi selalu salah
 * satu), ketuk jumlahnya, Lanjut, isi nama dan alamat, Simpan. Catatan disimpan di HP lebih dulu
 * sehingga meja tetap jalan tanpa internet, lalu dikirim ke server setiap ada sinyal.
 */
export function BuwuhPage() {
  // Warna mengikuti tema admin (terang/gelap) di perangkat ini.
  return (
    <ThemeProvider>
      <BuwuhScreen />
    </ThemeProvider>
  );
}

function BuwuhScreen() {
  useDocumentTitle("Meja buwuh");
  const [view, setView] = useState<View>("catat");
  const [amount, setAmount] = useState(0);
  const [items, setItems] = useState<BuwuhItem[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [editing, setEditing] = useState<BuwuhRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const syncRef = useRef<ReturnType<typeof startBuwuhSync> | null>(null);

  useEffect(() => {
    const sync = startBuwuhSync();
    syncRef.current = sync;
    return () => sync.stop();
  }, []);
  const syncNow = () => syncRef.current?.now();

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  // undefined = masih dibaca, null = belum dipilih.
  const mode = useLiveQuery(async () => (await getBuwuhMeta("mode")) ?? null, [], undefined);
  const rows = useLiveQuery(() => visibleEntries(), [], [] as BuwuhRow[]);
  const catalog = useLiveQuery(() => getCatalog(), [], null);
  // Alamat pilihan dari admin; selama admin belum mengisinya, alamat yang sering dicatat di HP ini.
  const adminAddresses = useLiveQuery(async () => (await getBuwuhMeta("addresses")) ?? [], [], []);
  const addresses = useMemo(
    () => (adminAddresses.length > 0 ? adminAddresses : frequentAddresses(rows)),
    [adminAddresses, rows],
  );

  // Catatan lama dibuka sesuai jenisnya sendiri; catatan baru mengikuti jenis meja.
  const kind: BuwuhKind = editing ? buwuhKind(editing) : (mode ?? "uang");
  const ready = kind === "uang" ? amount > 0 : items.length > 0;
  const summary =
    kind === "uang" ? `Uang ${formatRupiah(amount)}` : `Barang: ${formatBuwuhItems(items)}`;

  function reset() {
    setAmount(0);
    setItems([]);
    setName("");
    setAddress("");
    setEditing(null);
  }

  function startEdit(row: BuwuhRow) {
    if (!canEdit(row)) return;
    setEditing(row);
    setAmount(row.amount);
    setItems(row.items);
    setName(row.name);
    setAddress(row.address ?? "");
    setView("catat");
  }

  async function save() {
    setBusy(true);
    try {
      const draft = {
        name: name.trim(),
        address: address.trim() || null,
        amount: kind === "uang" ? amount : 0,
        items:
          kind === "barang"
            ? items.map((item) => ({ ...item, name: item.name.trim(), unit: item.unit.trim() }))
            : [],
      };
      const wasEditing = editing !== null;
      if (editing) await updateEntry(editing.id, draft);
      else await addEntry(draft);
      setFlash({ text: `Tersimpan: ${draft.name} · ${summary}`, tone: "ok" });
      setSheetOpen(false);
      reset();
      syncNow();
      if (wasEditing) setView("riwayat");
    } catch (err) {
      setFlash({ text: err instanceof Error ? err.message : "Gagal menyimpan", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (mode === undefined) return <div className="buwuh min-h-svh" />;
  if (mode === null) return <ModePicker onPick={(value) => void setBuwuhMeta("mode", value)} />;

  return (
    <div className="buwuh flex min-h-svh flex-col">
      <TopBar
        mode={mode}
        view={view}
        count={rows.length}
        onHistory={() => setView("riwayat")}
        onBack={() => setView("catat")}
        onSync={syncNow}
      />

      {flash && (
        <div
          role="status"
          className={`mx-4 mb-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${
            flash.tone === "ok"
              ? "bg-[var(--bw-accent-soft)] text-[var(--bw-accent-soft-ink)]"
              : "bg-[var(--bw-danger-bg)] text-[var(--bw-danger)]"
          }`}
        >
          {flash.tone === "ok" ? (
            <CircleCheck className="size-[18px] shrink-0" aria-hidden />
          ) : (
            <CircleAlert className="size-[18px] shrink-0" aria-hidden />
          )}
          <span className="min-w-0 truncate">{flash.text}</span>
        </div>
      )}

      {view === "riwayat" ? (
        <main className="mx-auto w-full max-w-lg flex-1">
          <HistoryView rows={rows} onPick={startEdit} />
        </main>
      ) : (
        <>
          <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pt-1 pb-4">
            {editing && (
              <div className="flex items-center gap-3 rounded-xl bg-[var(--bw-warn-bg)] px-3 py-2 text-sm text-[var(--bw-warn-ink)]">
                <span className="min-w-0 flex-1">
                  Mengubah catatan <b>{editing.name}</b>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setView("riwayat");
                  }}
                  className="h-10 shrink-0 px-2 font-bold underline underline-offset-2"
                >
                  Batal
                </button>
              </div>
            )}

            {kind === "uang" ? (
              <MoneyPad amount={amount} onChange={setAmount} />
            ) : (
              <section aria-label="Barang" className="flex flex-col gap-2">
                <p className="text-sm font-bold">Barang yang dibawa</p>
                {catalog && <GoodsGrid catalog={catalog} items={items} onChange={setItems} />}
              </section>
            )}

            {kind === "barang" && ready && !editing && (
              <button
                type="button"
                onClick={reset}
                className="h-11 self-center px-4 text-sm font-semibold text-[var(--bw-muted)] underline underline-offset-2"
              >
                Kosongkan
              </button>
            )}
          </main>

          {/* Bilah bawah menempel: ringkasan dan satu tombol utama, selalu terjangkau jempol. */}
          <footer className="sticky bottom-0 z-10 border-t border-[var(--bw-line)] bg-[var(--bw-surface)] px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="bw-num truncate text-xl font-extrabold">
                  {kind === "uang" ? formatRupiah(amount) : `${items.length} barang`}
                </span>
                <span className="truncate text-xs text-[var(--bw-muted)]">
                  {kind === "uang"
                    ? amount > 0
                      ? "amplop"
                      : "ketuk jumlah uang"
                    : formatBuwuhItems(items) || "ketuk barangnya"}
                </span>
              </div>
              <button
                type="button"
                disabled={!ready}
                onClick={() => setSheetOpen(true)}
                className="bw-press flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--bw-accent)] px-5 text-base font-bold whitespace-nowrap text-[var(--bw-on-accent)] disabled:opacity-40"
              >
                {editing ? "Lanjut" : "Lanjut: isi nama"}
                <ArrowRight className="size-[18px]" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </footer>
        </>
      )}

      <NameSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        summary={summary}
        name={name}
        address={address}
        onNameChange={setName}
        onAddressChange={setAddress}
        addresses={addresses}
        editing={editing !== null}
        busy={busy}
        onSave={() => void save()}
        onDelete={editing ? () => setDeleting(true) : undefined}
      />

      {editing && (
        <ConfirmDialog
          open={deleting}
          title="Hapus catatan ini?"
          description={`${editing.name}: ${editing.amount > 0 ? formatRupiah(editing.amount) : formatBuwuhItems(editing.items)}`}
          action="Hapus"
          destructive
          onCancel={() => setDeleting(false)}
          onConfirm={async () => {
            await deleteEntry(editing.id);
            setDeleting(false);
            setSheetOpen(false);
            setFlash({ text: `Dihapus: ${editing.name}`, tone: "ok" });
            reset();
            syncNow();
            setView("riwayat");
          }}
        />
      )}
    </div>
  );
}

function TopBar({
  mode,
  view,
  count,
  onHistory,
  onBack,
  onSync,
}: {
  mode: BuwuhKind;
  view: View;
  count: number;
  onHistory: () => void;
  onBack: () => void;
  onSync: () => void;
}) {
  const navigate = useNavigate();
  const status = useBuwuhSyncStatus();
  const deviceName = useLiveQuery(async () => (await getBuwuhMeta("auth"))?.deviceName, []);
  const pending = useLiveQuery(
    () => buwuhDb.entries.filter((row) => row.version > row.syncedVersion).count(),
    [],
    0,
  );
  const [releasing, setReleasing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  const warn = "bg-[var(--bw-warn-bg)] text-[var(--bw-warn-ink)]";
  const pill = status.authError
    ? { label: "Ditolak", className: "bg-[var(--bw-danger-bg)] text-[var(--bw-danger)]" }
    : !status.online
      ? { label: `Offline${pending > 0 ? ` · ${pending} antre` : ""}`, className: warn }
      : pending > 0
        ? { label: `Mengirim · ${pending}`, className: warn }
        : {
            label: "Terkirim",
            className: "bg-[var(--bw-accent-soft)] text-[var(--bw-accent-soft-ink)]",
          };

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-1.5 bg-[var(--bw-bg)] px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        {view === "riwayat" ? (
          <>
            <button
              type="button"
              aria-label="Kembali ke catat"
              onClick={onBack}
              className="bw-press grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--bw-line)] bg-[var(--bw-surface)]"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
            <h1 className="min-w-0 flex-1 text-lg font-extrabold">Riwayat ({count})</h1>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <h1 className="truncate text-lg font-extrabold tracking-tight">
              {mode === "uang" ? "Meja Uang" : "Meja Barang"}
            </h1>
            {deviceName && (
              <span className="truncate text-xs text-[var(--bw-muted)]">{deviceName}</span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onSync}
          title="Kirim sekarang"
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${pill.className}`}
        >
          {status.authError ? (
            <CircleAlert className="size-3.5" aria-hidden />
          ) : status.online ? (
            <span className="size-[7px] rounded-full bg-current" aria-hidden />
          ) : (
            <CloudOff className="size-3.5" aria-hidden />
          )}
          {pill.label}
          {status.syncing && <RefreshCw className="size-3 animate-spin" aria-hidden />}
        </button>

        {view === "catat" && (
          <button
            type="button"
            aria-label={`Ganti ke meja ${mode === "uang" ? "barang" : "uang"}`}
            title={`Ganti ke meja ${mode === "uang" ? "barang" : "uang"}`}
            onClick={() => setSwitching(true)}
            className="bw-press grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--bw-line)] bg-[var(--bw-surface)]"
          >
            {mode === "uang" ? (
              <Package className="size-5" aria-hidden />
            ) : (
              <Banknote className="size-5" aria-hidden />
            )}
          </button>
        )}

        {view === "catat" && (
          <button
            type="button"
            aria-label={`Riwayat, ${count} catatan`}
            onClick={onHistory}
            className="bw-press relative grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--bw-line)] bg-[var(--bw-surface)]"
          >
            <History className="size-5" aria-hidden />
            {count > 0 && (
              <span className="bw-num absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--bw-ink)] px-1 text-[11px] font-bold text-[var(--bw-surface)]">
                {count}
              </span>
            )}
          </button>
        )}

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu"
              className="grid size-11 shrink-0 place-items-center rounded-xl"
            >
              <EllipsisVertical className="size-5" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={onSync}>
              <RefreshCw />
              Kirim sekarang
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setReleaseError(null);
                setReleasing(true);
              }}
            >
              <LogOut />
              Lepas HP ini
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {status.authError && (
        <p className="mx-4 mb-2 flex gap-2 rounded-xl bg-[var(--bw-danger-bg)] px-3 py-2.5 text-sm text-[var(--bw-danger)]">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {status.authError} Catatan tetap tersimpan di HP ini dan terkirim setelah HP dipasangkan
            ulang.
          </span>
        </p>
      )}

      <ConfirmDialog
        open={switching}
        title={`Ganti ke meja ${mode === "uang" ? "barang" : "uang"}?`}
        description="Catatan yang sudah ada tetap tersimpan. Pemberi baru akan dicatat sebagai jenis yang baru."
        action="Ganti"
        onCancel={() => setSwitching(false)}
        onConfirm={async () => {
          await setBuwuhMeta("mode", mode === "uang" ? "barang" : "uang");
          setSwitching(false);
        }}
      />
      <ConfirmDialog
        open={releasing}
        title="Lepas HP ini?"
        description="Semua catatan dan pengaturan meja di HP ini dihapus. Catatan yang sudah terkirim tetap ada di admin."
        action="Lepas"
        destructive
        error={releaseError}
        onCancel={() => setReleasing(false)}
        onConfirm={async () => {
          try {
            await releaseBuwuh();
            await navigate({ to: "/buwuh/pasang" });
          } catch (err) {
            setReleaseError(err instanceof Error ? err.message : "Gagal melepas HP");
          }
        }}
      />
    </>
  );
}

/**
 * Layar pertama di HP baru: penjaga uang dan penjaga barang dibedakan, jadi HP memilih sekali
 * mencatat apa. Pilihan disimpan di HP (bisa diganti dari menu).
 */
function ModePicker({ onPick }: { onPick: (mode: BuwuhKind) => void }) {
  useDocumentTitle("Meja buwuh");
  return (
    <div className="buwuh flex min-h-svh flex-col gap-4 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-extrabold tracking-tight">HP ini mencatat apa?</h1>
      {(["uang", "barang"] as const).map((value) => {
        const Icon = value === "uang" ? Banknote : Package;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className={`bw-press flex min-h-48 flex-1 flex-col items-center justify-center gap-3 rounded-3xl border-2 ${
              value === "uang"
                ? "border-[var(--bw-accent)] bg-[var(--bw-accent)] text-[var(--bw-on-accent)]"
                : "border-[var(--bw-accent)] bg-[var(--bw-surface)] text-[var(--bw-accent)]"
            }`}
          >
            <Icon className="size-14" strokeWidth={1.6} aria-hidden />
            <span className="text-3xl font-extrabold">{value === "uang" ? "Uang" : "Barang"}</span>
            <span className="text-sm opacity-80">
              {value === "uang" ? "amplop" : "gula, beras, mi kuning, bihun"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
