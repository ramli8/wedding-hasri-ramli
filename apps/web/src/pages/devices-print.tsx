import { useQuery } from "@tanstack/react-query";
import { DEVICE_PAIR_PAGE, type Device, type DeviceKind } from "@wedding/shared";
import { Printer, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Checkbox } from "@/components/kit/checkbox";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { adminApi } from "../lib/admin-api.js";
import { settingsQuery, useRefresh } from "../lib/queries.js";

export type PairingCard = {
  name: string;
  kind: DeviceKind;
  /** null: perangkat lama yang terpasang sebelum kode disimpan. */
  code: string | null;
  /** Kode sudah dipakai memasang perangkat ini; dicetak hanya sebagai arsip. */
  used?: boolean;
};

const KIND_TITLE: Record<DeviceKind, string> = {
  scanner: "Scanner pintu",
  booth: "Photobooth",
  buwuh: "Meja buwuh",
  layar: "Layar sapa/dapur",
};

/** Langkah memasang per jenis perangkat, ditulis untuk orang yang belum pernah memakainya. */
const STEPS: Record<DeviceKind, string[]> = {
  scanner: [
    "Nyalakan internet (data atau Wi-Fi) di HP.",
    "Buka kamera HP, arahkan ke QR di kartu ini, lalu ketuk tautan yang muncul. Tanpa QR: buka Chrome, ketik alamat di kartu ini, lalu ketik kodenya.",
    "Ketuk Pasangkan dan tunggu sampai daftar tamu selesai diunduh.",
    "Izinkan kamera bila diminta, lalu arahkan kamera ke QR di undangan tamu.",
    "Setelah terpasang, HP tetap bisa memindai walau internet hilang.",
  ],
  booth: [
    "Sambungkan laptop ke internet, lalu pasang kamera dan printer.",
    "Buka Chrome di laptop dan ketik alamat di kartu ini.",
    "Ketik kodenya, lalu klik Pasangkan.",
    "Buka panel petugas, pilih kamera, lalu pilih layar penuh.",
    "Foto tersimpan di laptop dan terunggah sendiri saat ada internet.",
  ],
  buwuh: [
    "Nyalakan internet (data atau Wi-Fi) di HP.",
    "Buka kamera HP, arahkan ke QR di kartu ini, lalu ketuk tautan yang muncul. Tanpa QR: buka Chrome, ketik alamat di kartu ini, lalu ketik kodenya.",
    "Ketuk Pasangkan.",
    "Untuk mencatat: pilih Uang atau Barang, ketuk jumlahnya, ketuk Lanjut, isi nama dan alamat, lalu Simpan.",
    "Catatan tersimpan di HP dan terkirim sendiri saat ada internet.",
  ],
  layar: [
    "Sambungkan laptop atau TV pintar ke internet, lalu ke TV/proyektor.",
    "Buka Chrome dan ketik alamat di kartu ini.",
    "Ketik kodenya, lalu klik Pasangkan.",
    "Pilih Sapa (ucapan untuk tamu yang datang) atau Dapur (hitungan porsi), lalu Layar penuh.",
    "Layar ini butuh internet selama dipakai.",
  ],
};

/** Alamat situs untuk QR di kartu: dari Pengaturan → Situs, atau alamat admin yang sedang dibuka. */
function useSiteBase() {
  const settings = useQuery(settingsQuery);
  const base = settings.data?.publicBaseUrl?.trim() || window.location.origin;
  return base.replace(/\/+$/, "");
}

/**
 * Memilih perangkat yang kartunya dicetak. Kode yang tersimpan dipakai apa adanya (tidak dibuat
 * ulang), jadi kartu bisa dicetak berkali-kali; kartu perangkat yang sudah terpasang ditandai
 * "sudah dipakai" dan memakainya lagi di perangkat lain ditolak server.
 */
export function PrintCardsDialog({
  open,
  devices,
  onClose,
  onReady,
}: {
  open: boolean;
  devices: Device[];
  onClose: () => void;
  onReady: (cards: PairingCard[]) => void;
}) {
  const refresh = useRefresh();
  const printable = devices.filter((device) => device.status !== "revoked");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPicked(new Set(devices.filter((d) => d.status === "pending").map((d) => d.id)));
      setError(null);
    }
  }, [open, devices]);

  async function make() {
    setBusy(true);
    setError(null);
    try {
      const ids = printable.filter((d) => picked.has(d.id)).map((d) => d.id);
      const { items } = await adminApi.devices.cards(ids);
      // Perangkat pending lama tanpa kode tersimpan mendapat kode baru: segarkan daftar.
      await refresh("devices");
      onReady(
        items.map((item) => ({
          name: item.name,
          kind: item.kind,
          code: item.code,
          used: item.status === "active",
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyiapkan kartu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Cetak kartu pasang">
      {printable.length === 0 ? (
        <>
          <p>Belum ada perangkat. Tambah perangkat dulu untuk mencetak kartunya.</p>
          <DialogActions>
            <Button onClick={onClose}>Tutup</Button>
          </DialogActions>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {printable.map((device) => (
              <Checkbox
                key={device.id}
                checked={picked.has(device.id)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setPicked((current) => {
                    const next = new Set(current);
                    if (checked) next.add(device.id);
                    else next.delete(device.id);
                    return next;
                  });
                }}
              >
                {device.name}{" "}
                <span className="text-muted-foreground">
                  · {KIND_TITLE[device.kind]}
                  {device.status === "active" ? " · sudah dipasang" : ""}
                </span>
              </Checkbox>
            ))}
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button disabled={busy || picked.size === 0} onClick={() => void make()}>
              {busy ? "Menyiapkan…" : `Cetak ${picked.size} kartu`}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

/**
 * Pratinjau kartu pasang satu layar penuh dengan tombol Cetak. Dialog cetak browser juga
 * menyediakan "Simpan sebagai PDF". Saat dicetak, hanya kartu yang tampil (lihat styles.css).
 */
export function PairingCardsPreview({
  cards,
  onClose,
}: {
  cards: PairingCard[];
  onClose: () => void;
}) {
  const base = useSiteBase();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      data-print-cards=""
      role="dialog"
      aria-modal="true"
      aria-label="Kartu pasang perangkat"
      className="fixed inset-0 z-[60] overflow-y-auto bg-muted print:static print:overflow-visible print:bg-white"
    >
      <style>{"@page { size: A4 portrait; margin: 12mm; }"}</style>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background px-4 py-3 print:hidden">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Kartu pasang ({cards.length})</p>
          <p className="text-sm text-muted-foreground">
            Pilih printer untuk mencetak, atau “Simpan sebagai PDF” di dialog cetak.
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X aria-hidden />
          Tutup
        </Button>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden />
          Cetak / PDF
        </Button>
      </div>
      <div className="mx-auto flex max-w-[210mm] flex-col gap-6 p-4 print:block print:max-w-none print:p-0">
        {cards.map((card) => (
          <CardSheet key={`${card.name}-${card.code}`} card={card} base={base} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

function CardSheet({ card, base }: { card: PairingCard; base: string }) {
  const page = DEVICE_PAIR_PAGE[card.kind];
  const url = card.code ? `${base}${page}?kode=${encodeURIComponent(card.code)}` : null;
  const shortAddress = `${base.replace(/^https?:\/\//, "")}${page}`;
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!url) return;
    QRCode.toDataURL(url, { width: 600, margin: 1, errorCorrectionLevel: "M" })
      .then((data) => !cancelled && setQr(data))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <article className="flex break-inside-avoid flex-col gap-3 rounded-xl border-2 border-dashed border-neutral-400 bg-white p-[6mm] text-neutral-950 print:mb-[8mm] print:rounded-none">
      <header className="flex items-baseline justify-between gap-4 border-b-2 border-neutral-950 pb-2">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] text-neutral-600 uppercase">
            Kartu pasang · {KIND_TITLE[card.kind]}
          </p>
          <h2 className="text-2xl font-extrabold">{card.name}</h2>
        </div>
        {card.used && (
          <span className="shrink-0 rounded-md border-2 border-neutral-950 px-2 py-0.5 text-xs font-extrabold tracking-wider uppercase">
            Sudah dipakai
          </span>
        )}
      </header>

      <div className="flex gap-6">
        {qr && url ? (
          <img src={qr} alt={`QR pasang ${card.name}`} className="size-[36mm] shrink-0" />
        ) : (
          <div className="grid size-[36mm] shrink-0 place-items-center border text-center text-sm">
            {url ? "QR…" : "—"}
          </div>
        )}
        <div className="flex min-w-0 flex-col justify-center gap-3">
          <div>
            <p className="text-xs font-bold tracking-wider text-neutral-600 uppercase">Kode</p>
            <p className="font-mono text-[28pt] leading-tight font-extrabold tracking-wider">
              {card.code ?? "—"}
            </p>
            {!card.code && (
              <p className="text-xs text-neutral-600">
                Kode perangkat lama tidak tersimpan. Pasang ulang lewat perangkat baru.
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-neutral-600 uppercase">Alamat</p>
            <p className="font-mono text-base font-semibold break-all">{shortAddress}</p>
          </div>
        </div>
      </div>

      <ol className="flex list-none flex-col gap-1 text-[10.5pt] leading-snug">
        {STEPS[card.kind].map((step, index) => (
          <li key={step} className="flex gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-neutral-950 text-xs font-bold text-white print:[print-color-adjust:exact]">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-auto text-[9pt] text-neutral-600">
        {card.used
          ? "Kode ini sudah dipakai untuk memasang perangkat di atas. Memakainya di perangkat lain akan ditolak."
          : "Kode berlaku sampai dipakai sekali. Simpan kartu ini baik-baik: siapa pun yang memegangnya bisa memasang perangkat."}
      </p>
    </article>
  );
}
