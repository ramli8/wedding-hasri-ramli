"use client";

import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";

interface DateTimeFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "datetime-local" | "time";
  placeholder?: string;
}

export function DateTimeField({
  id,
  label,
  value,
  onChange,
  type = "datetime-local",
  placeholder,
}: DateTimeFieldProps) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <Label htmlFor={id} className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
          {label}
        </Label>
      ) : null}
      <Input
        id={id}
        type={type}
        className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
