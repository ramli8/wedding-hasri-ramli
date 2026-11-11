import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { IMPORT_COLUMNS, type ImportCommitResponse, type ImportPreview } from "@wedding/shared";
import { ClipboardPaste, FileSpreadsheet, FileUp, RefreshCw } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Checkbox } from "@/components/kit/checkbox";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, downloads } from "../../lib/admin-api.js";
import { groupsQuery, useRefresh } from "../../lib/queries.js";
import { xlsxToTsv } from "../../lib/xlsx.js";

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
  const groups = useQuery(groupsQuery);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<"file" | "paste">("file");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [csv, setCsv] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [result, setResult] = useState<ImportCommitResponse | null>(null);

  const preview = useMutation({
    mutationFn: (text: string) => adminApi.guests.importPreview(text),
    meta: { toast: false },
  });
  const commit = useMutation({
    mutationFn: () => adminApi.guests.importCommit(csv ?? "", skipDuplicates),
    meta: { toast: "Tamu diimpor" },
    onSuccess: async (data) => {
      setResult(data);
      await refresh("guests", "groups", "events");
    },
  });

  /** Teks berkas atau tempelan dikirim ke pratinjau yang sama; server mengenali pemisah tab. */
  function check(text: string) {
    setResult(null);
    commit.reset();
    setCsv(text);
    preview.mutate(text);
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Dikosongkan supaya memilih berkas yang sama (setelah diperbaiki) tetap memicu pemeriksaan.
    event.target.value = "";
    if (!file) return;
    setFileName(file.name);
    setFileError(null);
    // Hanya Excel (.xlsx): dibaca di peramban menjadi teks bertab untuk pratinjau yang sama.
    if (!/\.xlsx$/i.test(file.name)) {
      setFileError("Pilih berkas Excel (.xlsx). Pakai template Excel di bawah.");
      return;
    }
    try {
      check(xlsxToTsv(await file.arrayBuffer()));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Berkas Excel tidak bisa dibaca.");
    }
  }

  /** Periksa ulang: berkas harus dipilih lagi (isinya mungkin sudah diperbaiki di Excel). */
  function recheck() {
    if (source === "paste") check(pasted);
    else fileRef.current?.click();
  }

  const groupNames = (groups.data ?? []).map((g) => g.name);

  const data: ImportPreview | undefined = preview.data;
  const importable = data ? data.counts.ok + (skipDuplicates ? 0 : data.counts.duplicate) : 0;

  return (
    <>
      <PageHeader
        tag="Impor"
        title="Impor tamu"
        description="Pilih berkas Excel atau tempel dari Excel/Google Sheets, periksa pratinjau, lalu impor."
        actions={
          <Link to="/admin/tamu" className={buttonVariants({ variant: "outline" })}>
            Kembali ke tamu
          </Link>
        }
      />

      <Card className="flex flex-col gap-3 px-6">
        <h2 className="text-base font-semibold">1. Masukkan data tamu</h2>
        <div className="grid gap-1 text-sm text-muted-foreground">
          <p>
            Paling mudah: unduh <b>template Excel</b>, isi, lalu pilih berkasnya di sini. Kolom
            kelompok dan rombongan berupa pilihan (dropdown). Lima baris pertama adalah contoh:
            boleh ditimpa atau dihapus, dan bila dibiarkan otomatis dilewati.
          </p>
          <p>
            Kolom: {IMPORT_COLUMNS.join(", ")}. Wajib: <b>nama_undangan</b>, <b>kelompok</b>, dan
            salah satu dari hp atau instagram. Acara yang diundang mengikuti kelompok.{" "}
            {groupNames.length > 0
              ? `Kelompok yang ada: ${groupNames.join(", ")}.`
              : "Belum ada kelompok; buat dulu di menu Kelompok."}
          </p>
        </div>

        <Tabs value={source} onValueChange={(v) => setSource(v as typeof source)} className="gap-3">
          <TabsList>
            <TabsTrigger value="file">
              <FileUp aria-hidden />
              Berkas
            </TabsTrigger>
            <TabsTrigger value="paste">
              <ClipboardPaste aria-hidden />
              Tempel<span className="max-sm:hidden"> dari Excel/Sheets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                aria-label="Berkas Excel"
                onChange={onFile}
                className="sr-only"
                tabIndex={-1}
              />
              <Button onClick={() => fileRef.current?.click()}>
                <FileUp aria-hidden />
                Pilih berkas Excel
              </Button>
              <span className="min-w-0 text-sm break-all text-muted-foreground">
                {fileName ?? "Belum ada berkas dipilih"}
              </span>
            </div>
            {fileError && <Alert tone="error">{fileError}</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={downloads.templateXlsx}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <FileSpreadsheet aria-hidden />
                Unduh template Excel
              </a>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="flex flex-col gap-3">
            <label htmlFor="import-paste" className="text-sm font-medium">
              Tempel tabel di sini
            </label>
            <Textarea
              id="import-paste"
              spellCheck={false}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={"nama_undangan\thp\tkelompok\nBpk. Budi & Keluarga\t0812…\tKeluarga"}
              className="min-h-40 font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Di Excel atau Google Sheets, blok tabel termasuk baris judul kolom, salin (Ctrl+C),
              lalu tempel di sini.
            </p>
            <div>
              <Button onClick={() => check(pasted)} disabled={!pasted.trim() || preview.isPending}>
                Periksa
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {preview.isPending && <p className="text-muted-foreground">Memeriksa data…</p>}
        {preview.error && <Alert tone="error">{preview.error.message}</Alert>}
      </Card>

      {data && !result && (
        <Card className="flex flex-col gap-4 px-6">
          <h2 className="text-base font-semibold">2. Pratinjau</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{data.counts.ok} siap</Badge>
            <Badge variant="outline">{data.counts.duplicate} duplikat</Badge>
            <Badge variant="outline">{data.counts.error} error</Badge>
          </div>
          {data.rows.length === 0 ? (
            <Alert>
              {data.examplesSkipped > 0
                ? `Berkas ini baru berisi ${data.examplesSkipped} baris contoh dari template, dan baris contoh tidak ikut diimpor. Tulis data tamu di bawah baris contoh (atau timpa contohnya), simpan, lalu pilih berkasnya lagi.`
                : "Belum ada data tamu di berkas ini. Isi data tamu di bawah baris judul kolom, simpan, lalu pilih berkasnya lagi."}
            </Alert>
          ) : (
            data.examplesSkipped > 0 && (
              <p className="text-sm text-muted-foreground">
                {data.examplesSkipped} baris contoh dari template dilewati.
              </p>
            )
          )}
          {data.counts.error > 0 && (
            <Alert tone="error">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {data.counts.error} baris bermasalah dan tidak akan diimpor. Perbaiki
                {source === "paste" ? " teks di atas" : " berkasnya"}, lalu periksa ulang.
                <Button size="sm" variant="outline" onClick={recheck} disabled={preview.isPending}>
                  <RefreshCw aria-hidden />
                  Periksa ulang
                </Button>
              </span>
            </Alert>
          )}
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
        <Card className="flex flex-col gap-3 px-6">
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
