import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-hairline bg-paper p-5 shadow-subtle ${className}`}
      {...props}
    />
  );
}
