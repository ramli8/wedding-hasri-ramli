import type { ChangeEvent, ReactNode } from "react";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type CheckboxProps = {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  /** Meniru <input>: pemanggil membaca `event.target.checked`. */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
};

/** Checkbox Radix shadcn-admin dengan label; API `onChange` dipertahankan agar pemanggil tetap sama. */
export function Checkbox({ checked, disabled, className = "", onChange, children }: CheckboxProps) {
  return (
    <Label className={`min-h-11 cursor-pointer md:min-h-0 ${className}`}>
      <ShadcnCheckbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) =>
          onChange?.({ target: { checked: value === true } } as ChangeEvent<HTMLInputElement>)
        }
      />
      {children}
    </Label>
  );
}
