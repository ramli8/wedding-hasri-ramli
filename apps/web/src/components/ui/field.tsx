import { type ReactNode, useId } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  /** Menerima id yang sudah dipasangkan dengan <label>. */
  children: (id: string) => ReactNode;
};

export function Field({ label, hint, children }: FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="tag text-ink">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
