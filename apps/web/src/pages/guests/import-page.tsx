import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { IMPORT_COLUMNS, type ImportCommitResponse, type ImportPreview } from "@wedding/shared";
import { type ChangeEvent, useState } from "react";
import { PageHeader } from "../../components/page-header.js";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { adminApi, downloads } from "../../lib/admin-api.js";
import { useRefresh } from "../../lib/queries.js";

const statusLabel = { ok: "Siap", duplicate: "Duplikat", error: "Error" } as const;

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
        title="Impor tamu dari CSV"
        description="Unggah berkas, periksa pratinjau, lalu impor."
        actions={
          <Link
            to="/admin/tamu"
            className="inline-flex h-9 items-center rounded-2xl border border-hairline px-3 text-body font-medium hover:bg-canvas"
          >
            Kembali ke tamu
          </Link>
        }
      />

      <Card className="flex flex-col gap-3">
        <h2 className="text-subheading font-semibold">1. Pilih berkas</h2>
        <p className="text-mid-gray">
          Kolom: {IMPORT_COLUMNS.join(", ")}. Hanya <b>nama_undangan</b> yang wajib, dan salah satu
          dari hp atau instagram harus terisi. Kolom acara berisi slug dipisah titik koma
          (resepsi;akad); kosong berarti diundang ke semua acara. Kelompok yang belum ada dibuat
          otomatis.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={downloads.templateCsv}
            className="inline-flex h-9 items-center rounded-2xl border border-hairline px-3 text-body font-medium hover:bg-canvas"
          >
            Unduh template
          </a>
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="Berkas CSV"
            onChange={onFile}
            className="text-body file:mr-3 file:h-9 file:cursor-pointer file:rounded-2xl file:border-0 file:bg-canvas file:px-3 file:font-medium"
          />
        </div>
        {preview.isPending && <p className="text-mid-gray">Memeriksa berkas…</p>}
        {preview.error && <Alert tone="error">{preview.error.message}</Alert>}
      </Card>

      {data && !result && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-subheading font-semibold">2. Pratinjau</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="solid">{data.counts.ok} siap</Badge>
            <Badge variant="outline">{data.counts.duplicate} duplikat</Badge>
            <Badge variant="outline">{data.counts.error} error</Badge>
          </div>
          {data.newGroups.length > 0 && (
            <Alert>Kelompok baru akan dibuat: {data.newGroups.join(", ")}.</Alert>
          )}

          <div className="max-h-96 overflow-auto rounded-2xl border border-hairline">
            <table className="w-full text-left text-body">
              <thead className="sticky top-0 border-b border-hairline bg-paper text-caption text-mid-gray uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Baris</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Nama</th>
                  <th className="px-3 py-2 font-medium">Kontak</th>
                  <th className="px-3 py-2 font-medium">Kelompok</th>
                  <th className="px-3 py-2 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {data.rows.map((row) => (
                  <tr key={row.line}>
                    <td className="px-3 py-2 text-mid-gray">{row.line}</td>
                    <td className="px-3 py-2">
                      <Badge variant={row.status === "ok" ? "solid" : "outline"}>
                        {statusLabel[row.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{row.displayName || "—"}</td>
                    <td className="px-3 py-2">
                      {row.phone && <p>+{row.phone}</p>}
                      {row.instagram && <p className="text-mid-gray">@{row.instagram}</p>}
                    </td>
                    <td className="px-3 py-2">{row.groupName ?? "—"}</td>
                    <td className={`px-3 py-2 ${row.status === "error" ? "text-ember" : ""}`}>
                      {row.messages.join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        <Card className="flex flex-col gap-3">
          <h2 className="text-subheading font-semibold">Selesai</h2>
          <p>
            {result.imported} tamu diimpor, {result.skipped} baris dilewati.
            {result.createdGroups.length > 0 &&
              ` Kelompok baru: ${result.createdGroups.join(", ")}.`}
          </p>
          <div>
            <Link
              to="/admin/tamu"
              className="inline-flex h-9 items-center rounded-2xl bg-ink px-3 text-body font-medium text-surface-alt hover:bg-ink-soft"
            >
              Lihat daftar tamu
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}
