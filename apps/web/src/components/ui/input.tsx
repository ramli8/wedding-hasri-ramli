import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      // Cincin fokus memakai ink/30: border hairline dari spec nyaris tak terlihat di atas #f5f5f5.
      className={`h-9 w-full rounded-2xl border border-transparent bg-canvas px-3 text-body text-ink outline-none placeholder:text-mid-gray focus-visible:border-hairline focus-visible:ring-2 focus-visible:ring-ink/30 ${className}`}
      {...props}
    />
  );
}
