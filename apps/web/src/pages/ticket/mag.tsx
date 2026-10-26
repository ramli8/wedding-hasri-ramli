import type { MediaRef } from "@wedding/shared";
import { type ReactNode, useState } from "react";

/** Lebar isi halaman tamu: penuh layar, dengan batas nyaman di monitor sangat lebar. */
export function MagContainer({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1600px] px-5 md:px-10 lg:px-16 ${className}`}>
      {children}
    </div>
  );
}

/** Judul bagian bergaya majalah: serif kapital besar. */
export function MagTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-4xl leading-[0.92] font-semibold tracking-h1 text-balance uppercase md:text-6xl ${className}`}
    >
      {children}
    </h2>
  );
}

/** Kepala bagian ala majalah: judul serif raksasa huruf kecil dengan kata terakhir miring, lalu keterangan. */
export function MagHead({
  folio,
  title,
  kicker,
  className = "",
}: {
  folio: string;
  title: string;
  kicker?: string;
  className?: string;
}) {
  const [first, ...rest] = title.split(" ");
  return (
    <header className={`flex flex-col gap-4 ${className}`}>
      <div className="tag flex items-center gap-3 text-ink-soft">
        <span>{folio}</span>
        <span className="h-px flex-1 bg-ink/30" />
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
        <h2 className="font-display text-[clamp(3.5rem,11vw,9.5rem)] leading-[0.82] font-medium tracking-[-0.05em] text-balance">
          {first}
          {rest.length > 0 && <em className="font-normal"> {rest.join(" ")}</em>}
        </h2>
        {kicker && (
          <p className="max-w-xs shrink-0 font-display text-lg leading-snug text-ink-soft italic">
            {kicker}
          </p>
        )}
      </div>
    </header>
  );
}

/** Dulu kolom kiri-kanan; kini judul di atas dan isi selebar halaman, jadi tak ada kelas khusus. */
export const HEAD_COL = "";
export const BODY_COL = "";

/** Foto hitam putih; disentuh atau diarahi kursor, warnanya muncul. */
export function MagPhoto({
  photo,
  variant = "large",
  alt = "",
  className = "",
  fill = false,
  eager = false,
  framed = false,
}: {
  photo: MediaRef;
  variant?: "large" | "thumb";
  alt?: string;
  className?: string;
  /** Mengisi kotak induk (object-cover) alih-alih mengikuti rasio aslinya. */
  fill?: boolean;
  eager?: boolean;
  /** Bingkai kertas putih di sekeliling foto, seperti foto cetak yang ditempel di halaman. */
  framed?: boolean;
}) {
  const [color, setColor] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={color}
      aria-label={alt ? `${alt} (ketuk untuk warna)` : "Ketuk untuk warna"}
      onClick={() => setColor((value) => !value)}
      className={`mag-photo block cursor-pointer overflow-hidden ${
        framed ? "bg-paper p-2 shadow-[0_6px_24px_-12px_rgba(17,16,16,0.5)] md:p-3" : "bg-bone-2"
      } ${fill ? "size-full" : "w-full"} ${className}`}
    >
      <img
        src={photo[variant]}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={fill ? "size-full object-cover" : "h-auto w-full"}
      />
    </button>
  );
}

/** Kode batang hiasan dari kode tamu (bentuk tetap untuk kode yang sama). Bukan untuk dipindai. */
export function Barcode({ value, className = "" }: { value: string; className?: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const chars = [...`>${value}<`];
  for (const [index, char] of chars.entries()) {
    const code = char.charCodeAt(0);
    for (let step = 0; step < 6; step++) {
      const width = ((code * (step + 3) + index * 7) % 4) + 1;
      if (step % 2 === 0) bars.push({ x, w: width });
      x += width;
    }
  }
  return (
    <svg
      viewBox={`0 0 ${x} 40`}
      preserveAspectRatio="none"
      aria-hidden
      className={`h-10 w-full ${className}`}
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y={0} width={bar.w} height={40} fill="currentColor" />
      ))}
    </svg>
  );
}
