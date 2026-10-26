import { type ReactNode, useId } from "react";
import { Label } from "@/components/ui/label";

type FieldProps = {
  label: string;
  hint?: string;
  /** Menerima id yang sudah dipasangkan dengan <label>. */
  children: (id: string) => ReactNode;
};

/** FormItem shadcn-admin: grid gap-2, Label, isian, lalu deskripsi `text-sm text-muted-foreground`. */
export function Field({ label, hint, children }: FieldProps) {
  const id = useId();
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
