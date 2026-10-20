import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { IMPORT_COLUMNS, type ImportCommitResponse, type ImportPreview } from "@wedding/shared";
import { type ChangeEvent, useState } from "react";
import { PageHeader } from "../../components/page-header.js";
import { Alert } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button, buttonStyles } from "../../components/ui/button.js";
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
        tag="Impor"
        title="Impor tamu dari CSV"
        description="Unggah berkas, periksa pratinjau, lalu impor."
        actions={
          <Link to="/admin/tamu" className={buttonStyles({ variant: "secondary" })}>
            Kembali ke tamu
          </Link>
        }
      />

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold tracking-h3 uppercase">1. Pilih berkas</h2>
        <p className="text-ink-soft">
          Kolom: {IMPORT_COLUMNS.join(", ")}. Hanya <b>nama_undangan</b> yang wajib, dan salah satu
          dari hp atau instagram harus terisi. Kolom acara berisi slug dipisah titik koma
          (resepsi;akad); kosong berarti diundang ke semua acara. Kelompok yang belum ada dibuat
          otomatis.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a href={downloads.templateCsv} className={buttonStyles({ variant: "secondary" })}>
            Unduh template
          </a>
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="Berkas CSV"
            onChange={onFile}
            className="text-sm file:mr-3 file:h-11 file:cursor-pointer file:border-2 file:border-ink file:bg-paper file:px-4 file:font-display file:text-sm file:font-bold file:tracking-button file:uppercase hover:file:bg-acid"
          />
        </div>
        {preview.isPending && <p className="text-ink-soft">Memeriksa berkas…</p>}
        {preview.error && <Alert tone="error">{preview.error.message}</Alert>}
      </Card>

      {data && !result && (
        <Card className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold tracking-h3 uppercase">2. Pratinjau</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="pillAcid">{data.counts.ok} siap</Badge>
            <Badge variant="pill">{data.counts.duplicate} duplikat</Badge>
            <Badge variant="pill">{data.counts.error} error</Badge>
          </div>
          {data.newGroups.length > 0 && (
            <Alert>Kelompok baru akan dibuat: {data.newGroups.join(", ")}.</Alert>
          )}

          <div className="max-h-96 overflow-auto border-2 border-ink">
            <table className="w-full text-left text-sm">
              <thead className="tag sticky top-0 border-b-2 border-ink bg-paper text-ink-soft">
                <tr>
                  <th className="px-3 py-2">Baris</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Kontak</th>
                  <th className="px-3 py-2">Kelompok</th>
                  <th className="px-3 py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bone-2">
                {data.rows.map((row) => (
                  <tr key={row.line}>
                    <td className="px-3 py-2 text-ink-soft">{row.line}</td>
                    <td className="px-3 py-2">
                      <Badge variant={row.status === "ok" ? "pillAcid" : "pill"}>
                        {statusLabel[row.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{row.displayName || "—"}</td>
                    <td className="px-3 py-2">
                      {row.phone && <p>+{row.phone}</p>}
                      {row.instagram && <p className="text-ink-soft">@{row.instagram}</p>}
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
          <h2 className="font-display text-lg font-bold tracking-h3 uppercase">Selesai</h2>
          <p>
            {result.imported} tamu diimpor, {result.skipped} baris dilewati.
            {result.createdGroups.length > 0 &&
              ` Kelompok baru: ${result.createdGroups.join(", ")}.`}
          </p>
          <div>
            <Link to="/admin/tamu" className={buttonStyles()}>
              Lihat daftar tamu
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}
