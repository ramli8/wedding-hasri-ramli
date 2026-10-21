import { Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { buttonStyles } from "../../components/ui/button.js";

/** QR berisi kode tamu saja. Digambar di perangkat, tanpa jaringan. */
export function TicketQr({ code }: { code: string }) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(code, { width: 720, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => !cancelled && setImage(url))
      .catch(() => !cancelled && setImage(null));
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-4">
      {image ? (
        <img
          src={image}
          alt={`QR tiket ${code}`}
          className="size-64 max-w-full border-2 border-ink bg-white"
        />
      ) : (
        <div className="grid size-64 max-w-full place-items-center border-2 border-ink text-ink-soft">
          Membuat QR…
        </div>
      )}
      <p className="font-mono text-3xl font-bold tracking-widest">{code}</p>
      <a
        href={image ?? undefined}
        download={`tiket-${code}.png`}
        aria-disabled={!image}
        className={`${buttonStyles({ variant: "secondary" })} ${image ? "" : "pointer-events-none opacity-50"}`}
      >
        <Download className="size-4" aria-hidden /> Unduh PNG
      </a>
    </div>
  );
}
