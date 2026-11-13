import { Link, useNavigate } from "@tanstack/react-router";
import { PAIRING_CODE_LENGTH } from "@wedding/shared";
import { ArrowRight, HandCoins, Loader2, LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/context/theme-provider";
import { useDocumentTitle } from "@/lib/document-title";
import { requestPersistentStorage } from "../../lib/booth/db.js";
import { pairBuwuh } from "../../lib/buwuh/db.js";
import { syncBuwuh } from "../../lib/buwuh/sync.js";
import { deviceApi } from "../../lib/scan/device-api.js";

function formatCode(raw: string) {
  const clean = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, PAIRING_CODE_LENGTH);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

/** Memasangkan HP meja buwuh dengan kode pairing dari menu Perangkat (sekali, saat online). */
export function BuwuhPairPage() {
  useDocumentTitle("Pasang meja buwuh");
  const navigate = useNavigate();
  const [code, setCode] = useState(() =>
    formatCode(new URLSearchParams(window.location.search).get("kode") ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await deviceApi.pair(code, "buwuh");
      // Catatan lama di HP ini tetap disimpan dan ikut terkirim dengan token baru.
      await pairBuwuh({
        token: result.token,
        deviceId: result.deviceId,
        deviceName: result.deviceName,
      });
      // Tidak ditunggu: Firefox meminta izin dulu, dan halaman tidak boleh tertahan karenanya.
      void requestPersistentStorage();
      await syncBuwuh();
      await navigate({ to: "/buwuh" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memasangkan HP meja");
      setBusy(false);
    }
  }

  return (
    <ThemeProvider>
      <main className="grid min-h-svh place-items-center bg-muted/40 px-4">
        <div className="flex w-full max-w-sm flex-col gap-6 py-10">
          <Card className="gap-6">
            <CardHeader className="text-center">
              <span className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-muted">
                <HandCoins className="size-6" aria-hidden />
              </span>
              <CardTitle className="text-xl tracking-tight">Pasang meja buwuh</CardTitle>
              <CardDescription>
                Di admin, buka menu Perangkat lalu Tambah perangkat dengan jenis Meja buwuh. Ketik
                kode 8 karakternya di sini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid gap-4">
                <Field label="Kode pairing">
                  {(id) => (
                    <Input
                      id={id}
                      required
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      className="h-14 text-center font-mono text-2xl tracking-[0.2em] uppercase placeholder:tracking-[0.2em] md:text-2xl"
                      placeholder="XXXX-XXXX"
                      value={code}
                      onChange={(e) => setCode(formatCode(e.target.value))}
                    />
                  )}
                </Field>
                {error && <Alert tone="error">{error}</Alert>}
                <Button
                  type="submit"
                  className="h-11 w-full md:h-10"
                  disabled={busy || code.replace("-", "").length < PAIRING_CODE_LENGTH}
                >
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden /> Memasangkan…
                    </>
                  ) : (
                    <>
                      Pasangkan <ArrowRight aria-hidden />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Button variant="outline" asChild className="h-11 w-full bg-background md:h-10">
            <Link to="/admin/masuk">
              <LogIn aria-hidden /> Masuk sebagai admin
            </Link>
          </Button>
        </div>
      </main>
    </ThemeProvider>
  );
}
