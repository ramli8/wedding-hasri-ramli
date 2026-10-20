import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 w-full border-2 border-ink bg-paper px-3 text-base text-ink placeholder:text-placeholder focus:bg-bone ${className}`}
      {...props}
    />
  );
}
