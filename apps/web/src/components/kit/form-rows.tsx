import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Baris pengaturan hidup-mati: kartu `rounded-lg border p-4` dengan Switch di kanan (Notifications shadcn-admin). */
export function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label>{title}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}

/** Pilihan kotak centang berbentuk kartu; aktif = pinggir lebih tegas. */
export function CheckCard({
  title,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <Label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal transition-colors hover:bg-accent/50",
        checked && "border-primary bg-accent/30",
        className,
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <span className="grid gap-0.5">
        <span className="text-sm leading-none font-medium">{title}</span>
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </span>
    </Label>
  );
}

/** Judul bagian di dalam formulir panjang. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
