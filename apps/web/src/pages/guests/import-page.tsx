import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { IMPORT_COLUMNS, type ImportCommitResponse, type ImportPreview } from "@wedding/shared";
import { type ChangeEvent, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Checkbox } from "@/components/kit/checkbox";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { adminApi, downloads } from "../../lib/admin-api.js";
import { useRefresh } from "../../lib/queries.js";

const statusLabel = { ok: "Siap", duplicate: "Duplikat", error: "Error" } as const;

type PreviewRow = ImportPreview["rows"][number];

const previewColumns: ColumnDef<PreviewRow, unknown>[] = [
  {
    id: "baris",
    accessorFn: (row) => row.line,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Baris" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.line}</span>,
  },
  {
    id: "status",
    accessorFn: (row) => row.status,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.status === "ok" ? "secondary" : "outline"}>
        {statusLabel[row.original.status]}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    id: "nama",
    accessorFn: (row) => row.displayName || "—",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
  },
  {
    id: "kontak",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kontak" />,
    cell: ({ row }) => (
      <>
        {row.original.phone && <p>+{row.original.phone}</p>}
        {row.original.instagram && (
          <p className="text-muted-foreground">@{row.original.instagram}</p>
        )}
      </>
    ),
    enableSorting: false,
  },
  {
    id: "kelompok",
    accessorFn: (row) => row.groupName ?? "—",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kelompok" />,
  },
  {
    id: "keterangan",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Keterangan" />,
    cell: ({ row }) => (
      <span className={row.original.status === "error" ? "text-destructive" : ""}>
        {row.original.messages.join("; ")}
      </span>
    ),
    enableSorting: false,
  },
];

export function ImportPage() {
  const refresh = useRefresh();
  const [csv, setCsv] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [result, setResult] = useState<ImportCommitResponse | null>(null);

  const preview = useMutation({
    mutationFn: (text: string) => adminApi.guests.importPreview(text),
  });
  const commit = useMutation({
    mutationFn: () => adminApi.guests.importCommit(csv ?? "", skipDuplicates),
    onSuccess: async (data) => {
      setResult(data);
      await refresh("guests", "groups", "events");
    },
  });

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setResult(null);
    commit.reset();
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    preview.mutate(text);
  }

  const data: ImportPreview | undefined = preview.data;
  const importable = data ? data.counts.ok + (skipDuplicates ? 0 : data.counts.duplicate) : 0;

  return (
    <>
      <PageHeader
        tag="Impor"
        title="Impor tamu dari CSV"
        description="Unggah berkas, periksa pratinjau, lalu impor."
        actions={
          <Link to="/admin/tamu" className={buttonVariants({ variant: "outline" })}>
            Kembali ke tamu
          </Link>
        }
      />

      <Card className="px-6 flex flex-col gap-3">
        <h2 className="text-base font-semibold">1. Pilih berkas</h2>
        <p className="text-muted-foreground">
          Kolom: {IMPORT_COLUMNS.join(", ")}. Hanya <b>nama_undangan</b> yang wajib, dan salah satu
          dari hp atau instagram harus terisi. Kolom acara berisi slug dipisah titik koma
          (resepsi;akad); kosong berarti diundang ke semua acara. Kelompok yang belum ada dibuat
          otomatis.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a href={downloads.templateCsv} className={buttonVariants({ variant: "outline" })}>
            Unduh template
          </a>
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="Berkas CSV"
            onChange={onFile}
            className="text-sm file:mr-3 file:h-11 file:cursor-pointer file:border file:border-border file:bg-card file:px-4 file:font-medium file:text-sm file:font-bold file: hover:file:bg-accent"
          />
        </div>
        {preview.isPending && <p className="text-muted-foreground">Memeriksa berkas…</p>}
        {preview.error && <Alert tone="error">{preview.error.message}</Alert>}
      </Card>

      {data && !result && (
        <Card className="px-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold">2. Pratinjau</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{data.counts.ok} siap</Badge>
            <Badge variant="outline">{data.counts.duplicate} duplikat</Badge>
            <Badge variant="outline">{data.counts.error} error</Badge>
          </div>
          {data.newGroups.length > 0 && (
            <Alert>Kelompok baru akan dibuat: {data.newGroups.join(", ")}.</Alert>
          )}

          <DataTable
            columns={previewColumns}
            data={data.rows}
            getRowId={(row) => String(row.line)}
            searchPlaceholder="Cari nama"
            searchKey="nama"
            filters={[
              {
                columnId: "status",
                title: "Status",
                options: [
                  { label: statusLabel.ok, value: "ok" },
                  { label: statusLabel.duplicate, value: "duplicate" },
                  { label: statusLabel.error, value: "error" },
                ],
              },
            ]}
          />

          {data.counts.duplicate > 0 && (
            <Checkbox
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
            >
              Lewati baris duplikat (HP atau Instagram sama dengan tamu lain)
            </Checkbox>
          )}
          {commit.error && <Alert tone="error">{commit.error.message}</Alert>}
          <div>
            <Button onClick={() => commit.mutate()} disabled={commit.isPending || importable === 0}>
              {commit.isPending ? "Mengimpor…" : `Impor ${importable} tamu`}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <Card className="px-6 flex flex-col gap-3">
          <h2 className="text-base font-semibold">Selesai</h2>
          <p>
            {result.imported} tamu diimpor, {result.skipped} baris dilewati.
            {result.createdGroups.length > 0 &&
              ` Kelompok baru: ${result.createdGroups.join(", ")}.`}
          </p>
          <div>
            <Link to="/admin/tamu" className={buttonVariants()}>
              Lihat daftar tamu
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}
