import type { HTMLAttributes } from "react";

const variants = {
  /** Label halaman: acid, border 2px, mono kapital. */
  tag: "tag border-2 border-ink bg-acid px-2 py-1",
  /** Penanda kuat: ink dengan teks acid (VIP, check-in aktif). */
  solid: "tag bg-ink px-2 py-1 text-acid",
  /** Pil meta kecil: putih, border 1px, mono. */
  pill: "border border-ink bg-paper px-2 py-0.5 font-mono text-xs",
  /** Pil meta yang menyala: untuk status selesai (terkirim). */
  pillAcid: "border border-ink bg-acid px-2 py-0.5 font-mono text-xs",
} as const;

export type BadgeVariant = keyof typeof variants;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant };

export function Badge({ variant = "pill", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
