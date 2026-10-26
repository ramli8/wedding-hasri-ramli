import { Check, CirclePlus } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "./button";

type FilterChipProps = Omit<ComponentProps<typeof Button>, "onChange"> & {
  active: boolean;
  onActiveChange: (active: boolean) => void;
};

/** Tombol filter DataTableFacetedFilter shadcn-admin: `variant="outline" size="sm" h-8 border-dashed`. */
export function FilterChip({
  active,
  onActiveChange,
  children,
  className = "",
  ...props
}: FilterChipProps) {
  const Icon = active ? Check : CirclePlus;
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={active}
      onClick={() => onActiveChange(!active)}
      className={`h-8 ${active ? "bg-accent" : "border-dashed"} ${className}`}
      {...props}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </Button>
  );
}
