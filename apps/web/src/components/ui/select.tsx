import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-9 w-full rounded-2xl border border-transparent bg-canvas px-3 text-body text-ink outline-none focus-visible:border-hairline focus-visible:ring-2 focus-visible:ring-ink/30 ${className}`}
      {...props}
    />
  );
}
