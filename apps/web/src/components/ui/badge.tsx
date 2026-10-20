import type { HTMLAttributes } from "react";

const variants = {
  solid: "bg-ink-soft text-surface-alt",
  soft: "bg-canvas text-ink-soft",
  outline: "border border-hairline text-ink",
} as const;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants };

export function Badge({ variant = "soft", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-2xl px-2 py-0.5 text-caption font-medium whitespace-nowrap ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
