import { type ComponentProps, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseAmount } from "../../lib/format.js";

const grouped = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/**
 * Isian rupiah: menampilkan pemisah ribuan saat diketik ("1.500.000"), papan angka di HP, dan
 * awalan "Rp". Nilainya bilangan bulat atau null bila kosong.
 */
export function MoneyInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(value === null ? "" : grouped.format(value));

  // Nilai diganti dari luar (mis. diisi otomatis): tampilkan ulang.
  useEffect(() => {
    setText((current) => {
      const parsed = parseAmount(current);
      return parsed === value ? current : value === null ? "" : grouped.format(value);
    });
  }, [value]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        Rp
      </span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
          const next = digits ? Number(digits) : null;
          setText(next === null ? "" : grouped.format(next));
          onValueChange(next);
        }}
        className={cn("ps-10 tabular-nums", className)}
      />
    </div>
  );
}
