import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  children: ReactNode;
};

export function Checkbox({ children, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 text-sm ${className}`}>
      <input type="checkbox" className="check-box" {...props} />
      <span>{children}</span>
    </label>
  );
}
