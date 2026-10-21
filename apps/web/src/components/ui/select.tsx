import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Gaya filter: teks mono kapital kecil, seperti kontrol "URUTKAN" di referensi. */
  compact?: boolean;
};

export function Select({ compact, className = "", ...props }: SelectProps) {
  return (
    <select
      className={`h-11 w-full border-2 border-ink bg-paper px-3 text-ink focus:bg-bone ${compact ? "tag max-md:text-base" : "text-base"} ${className}`}
      {...props}
    />
  );
}
