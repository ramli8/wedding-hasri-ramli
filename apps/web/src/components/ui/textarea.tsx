import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-24 w-full border-2 border-ink bg-paper px-3 py-2 text-base text-ink placeholder:text-placeholder focus:bg-bone ${className}`}
      {...props}
    />
  );
}
