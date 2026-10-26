import type { ReactNode } from "react";

/** Judul halaman persis pola shadcn-admin (Tasks/Users): h2 `text-2xl font-bold tracking-tight` + deskripsi + aksi di kanan. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  /** Tidak ditampilkan lagi; dipertahankan agar pemanggil lama tetap valid. */
  tag?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
