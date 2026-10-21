import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-electric text-paper",
  secondary: "bg-paper text-ink hover:bg-acid",
  destructive: "bg-paper text-alert hover:bg-alert hover:text-paper",
} as const;

// md: tombol penuh dengan bayangan keras. sm: tombol baris tabel, bayangan baru muncul saat hover
// supaya baris yang berisi banyak tombol tidak terasa berat.
const sizes = {
  md: "h-11 px-4 shadow-hard lift",
  sm: "h-9 px-3 max-md:h-11 transition-[translate,box-shadow,background-color,color] duration-150 hover:not-disabled:-translate-x-0.5 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-hard-sm active:not-disabled:translate-x-0.5 active:not-disabled:translate-y-0.5 active:not-disabled:shadow-none",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Kelas tombol, supaya tautan (<a>, <Link>) bisa tampil seperti tombol. */
export function buttonStyles({
  variant = "primary",
  size = "md",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} = {}) {
  return `inline-flex items-center justify-center gap-2 border-2 border-ink font-display text-sm font-bold tracking-button whitespace-nowrap uppercase disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={`${buttonStyles({ variant, size })} ${className}`} {...props} />
  );
}
