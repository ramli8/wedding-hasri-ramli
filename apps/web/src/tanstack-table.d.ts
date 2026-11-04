import "@tanstack/react-query";
import "@tanstack/react-table";

declare module "@tanstack/react-query" {
  interface Register {
    /** Pesan Toaster setelah mutasi berhasil; `false` = tanpa pesan. Bawaan "Tersimpan". */
    mutationMeta: { toast?: string | false };
  }
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string; // apply to both th and td
    tdClassName?: string;
    thClassName?: string;
    /**
     * Peran sel di mode kartu (HP, kelas `table-cards`). Bila kosong ditebak otomatis: kotak
     * centang = select, kolom pertama berjudul = title, kolom terakhir tanpa judul = actions,
     * selebihnya baris "label: nilai".
     */
    card?: "title" | "select" | "actions" | "field" | "hidden";
  }
}
