import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  children: ReactNode;
};

export function Checkbox({ children, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-body ${className}`}>
      <input type="checkbox" className="size-4 shrink-0 accent-ink" {...props} />
      <span>{children}</span>
    </label>
  );
}
