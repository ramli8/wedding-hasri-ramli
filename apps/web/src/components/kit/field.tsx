import { type ReactNode, useId } from "react";
import { Label } from "@/components/ui/label";

type FieldProps = {
  label: string;
  hint?: string;
  /** Tandai kolom wajib di label ("wajib"), supaya admin tahu mana yang harus diisi. */
  required?: boolean;
  /** Pesan galat di bawah kolom (menggantikan hint). */
  error?: string | null;
  /** Menerima id yang sudah dipasangkan dengan <label>. */
  children: (id: string) => ReactNode;
};

/** FormItem shadcn-admin: grid gap-2, Label, isian, lalu deskripsi `text-sm text-muted-foreground`. */
export function Field({ label, hint, required, error, children }: FieldProps) {
  const id = useId();
  return (
    <div data-field className="grid content-start gap-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-xs font-normal text-muted-foreground">wajib</span>}
      </Label>
      {children(id)}
      {error ? (
        <p data-form-error className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
