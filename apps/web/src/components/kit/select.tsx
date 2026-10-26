import {
  type ChangeEvent,
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  SelectContent,
  SelectItem,
  Select as SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectProps = {
  value?: string | number;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
  /** Tinggi 32px (size="sm") seperti pemilih di bilah paginasi dan filter. */
  compact?: boolean;
  children?: ReactNode;
};

// Radix melarang nilai kosong pada item; nilai "" dipetakan ke penanda ini dan dikembalikan saat onChange.
const EMPTY = "__kosong__";

type OptionProps = { value?: string | number; children?: ReactNode; disabled?: boolean };

/**
 * Select Radix shadcn-admin (SelectTrigger/SelectContent/SelectItem) dengan API <select> lama:
 * anak berupa <option>, `value` dan `onChange(event)`. Dropdown-nya ikut tema, bukan bawaan browser.
 */
export function Select({
  value,
  onChange,
  compact,
  className = "",
  children,
  ...rest
}: SelectProps) {
  const options = Children.toArray(children).filter((child): child is ReactElement<OptionProps> =>
    isValidElement(child),
  );
  const current = value === undefined ? undefined : String(value) === "" ? EMPTY : String(value);
  return (
    <SelectRoot
      value={current}
      disabled={rest.disabled}
      required={rest.required}
      name={rest.name}
      onValueChange={(next) =>
        onChange?.({
          target: { value: next === EMPTY ? "" : next },
        } as ChangeEvent<HTMLSelectElement>)
      }
    >
      <SelectTrigger
        id={rest.id}
        aria-label={rest["aria-label"]}
        size={compact ? "sm" : "default"}
        className={`w-full max-md:h-11 ${className}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const raw = option.props.value ?? "";
          const itemValue = String(raw) === "" ? EMPTY : String(raw);
          return (
            <SelectItem key={itemValue} value={itemValue} disabled={option.props.disabled}>
              {option.props.children}
            </SelectItem>
          );
        })}
      </SelectContent>
    </SelectRoot>
  );
}
