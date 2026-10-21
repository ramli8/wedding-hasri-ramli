import type { Group, Guest } from "@wedding/shared";
import { Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Dialog } from "../../components/ui/dialog.js";

type Props = { guest: Guest | null; group: Group | undefined; onClose: () => void };

export function QrDialog({ guest, group, onClose }: Props) {
  return (
    <Dialog
      open={guest !== null}
      onClose={onClose}
      title={`QR: ${guest?.displayName ?? ""}`}
      description="Isi QR hanya kode tamu. Scanner mencocokkannya dengan daftar di perangkat."
    >
      {guest && <QrBody guest={guest} group={group} />}
    </Dialog>
  );
}

function QrBody({ guest, group }: { guest: Guest; group: Group | undefined }) {
  const code = guest.code;
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    QRCode.toDataURL(code, { width: 640, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => !cancelled && setImage(url))
      .catch(() => !cancelled && setError("Gagal membuat QR"));
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!code) {
    return (
      <Alert>Tamu ini belum punya kode. Kode dibuat server saat tamu walk-in disinkronkan.</Alert>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {image ? (
        <img
          src={image}
          alt={`QR kode ${code}`}
          className="size-72 max-w-full border-2 border-ink bg-white"
        />
      ) : (
        <div className="grid size-72 max-w-full place-items-center border-2 border-ink text-ink-soft">
          {error ?? "Membuat QR…"}
        </div>
      )}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-mono text-3xl font-bold tracking-widest">{code}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {group && <Badge variant="pill">{group.name}</Badge>}
          {guest.isRombongan && <Badge variant="pill">Rombongan</Badge>}
        </div>
      </div>
      <a
        href={image ?? undefined}
        download={`qr-${code}.png`}
        aria-disabled={!image}
        className={`inline-flex h-11 items-center gap-2 border-2 border-ink bg-paper px-4 font-semibold hover:bg-acid ${image ? "" : "pointer-events-none opacity-50"}`}
      >
        <Download className="size-4" aria-hidden /> Unduh PNG
      </a>
    </div>
  );
}
