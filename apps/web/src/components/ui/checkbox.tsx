import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  children: ReactNode;
};

export function Checkbox({ children, className = "", ...props }: CheckboxProps) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-3 text-sm md:min-h-0 ${className}`}
    >
      <input type="checkbox" className="check-box" {...props} />
      <span>{children}</span>
    </label>
  );
}
