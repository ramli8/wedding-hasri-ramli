import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-24 w-full rounded-2xl border border-transparent bg-canvas px-3 py-2 text-body text-ink outline-none placeholder:text-mid-gray focus-visible:border-hairline focus-visible:ring-2 focus-visible:ring-ink/30 ${className}`}
      {...props}
    />
  );
}
