import { Lightbulb, type LucideIcon, Plus } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/kit/button";
import { Card } from "@/components/ui/card";

/** Baris atas halaman daftar: ringkasan di kiri, tombol tambah di kanan. */
export function Toolbar({
  summary,
  addLabel,
  onAdd,
  disabled,
  children,
}: {
  summary: ReactNode;
  addLabel: string;
  onAdd: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium">{summary}</p>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Button onClick={onAdd} disabled={disabled}>
          {addLabel}
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/** Saran singkat di atas daftar (ukuran foto, cara kerja bagian ini). */
export function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
      <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/** Keadaan kosong: ikon, penjelasan, dan satu tombol untuk memulai. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  addLabel,
  onAdd,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <Card className="items-center px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onAdd}>
        {addLabel}
        <Plus aria-hidden />
      </Button>
    </Card>
  );
}

/**
 * Tombol Batal dan Simpan di dasar formulir dialog (bertumpuk di HP, menempel di dasar lembar).
 * `again` menambah tombol "Simpan & tambah lagi"; di `onSubmit` periksa dengan `isAgain(event)`,
 * lalu kosongkan isian dan fokuskan kolom pertama alih-alih menutup dialog.
 */
export function FormFooter({
  onCancel,
  pending,
  disabled,
  submitLabel = "Simpan",
  again,
  againLabel = "Simpan & tambah lagi",
}: {
  onCancel: () => void;
  pending: boolean;
  disabled?: boolean;
  submitLabel?: string;
  again?: boolean;
  againLabel?: string;
}) {
  return (
    <div data-form-footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={onCancel}>
        Batal
      </Button>
      {again && (
        <Button type="submit" variant="secondary" data-again="" disabled={pending || disabled}>
          {againLabel}
        </Button>
      )}
      <Button type="submit" disabled={pending || disabled}>
        {pending ? "Menyimpan…" : submitLabel}
      </Button>
    </div>
  );
}

/** Formulir dikirim lewat tombol "Simpan & tambah lagi" dari `FormFooter`. */
export function isAgain(event: FormEvent): boolean {
  const submitter = (event.nativeEvent as SubmitEvent).submitter;
  return submitter instanceof HTMLElement && submitter.dataset.again !== undefined;
}
