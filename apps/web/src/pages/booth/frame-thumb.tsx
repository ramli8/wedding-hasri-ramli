import { BOOTH_FRAME_LABELS, type BoothFrame } from "@wedding/shared";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { drawFrame, FRAME_SPECS, loadFrameFonts, PHOTO_SIZE } from "../../lib/booth/frames.js";

/** Contoh id foto untuk QR pratinjau; QR asli berbeda di setiap foto. */
export const SAMPLE_PHOTO_ID = "0190f4c2-6b1e-7a3c-9d2e-1f2a3b4c5d6e";
const SAMPLE_PHOTO_LINK = `https://hasriramli.com/foto/${SAMPLE_PHOTO_ID}`;

/**
 * Pratinjau bingkai: jendela foto diisi abu-abu bertuliskan "Foto tamu". Dipakai di layar booth
 * (pilihan bingkai) dan di admin.
 */
export function FrameThumb({
  frame,
  qr = SAMPLE_PHOTO_LINK,
  className,
}: {
  frame: BoothFrame;
  qr?: string | null;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    void loadFrameFonts().then(() => {
      const ctx = ref.current?.getContext("2d");
      if (cancelled || !ctx) return;
      const { x, y, w, h } = FRAME_SPECS[frame].window;
      ctx.clearRect(0, 0, PHOTO_SIZE.width, PHOTO_SIZE.height);
      ctx.fillStyle = "#d9cfc4";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#8a7268";
      ctx.font = '500 56px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = "center";
      ctx.fillText("Foto tamu", x + w / 2, y + h / 2);
      // Bingkai digambar di canvas lain lalu ditumpuk, agar jendela transparannya tidak menghapus
      // kotak abu-abu di bawahnya.
      const overlay = document.createElement("canvas");
      overlay.width = PHOTO_SIZE.width;
      overlay.height = PHOTO_SIZE.height;
      const overlayCtx = overlay.getContext("2d");
      if (!overlayCtx) return;
      drawFrame(overlayCtx, frame, qr);
      ctx.drawImage(overlay, 0, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [frame, qr]);
  return (
    <canvas
      ref={ref}
      width={PHOTO_SIZE.width}
      height={PHOTO_SIZE.height}
      className={cn("aspect-[3/2] w-full rounded-md border bg-[#fbf6ef]", className)}
      role="img"
      aria-label={`Pratinjau bingkai ${BOOTH_FRAME_LABELS[frame]}`}
    />
  );
}
