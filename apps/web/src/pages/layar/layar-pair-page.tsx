import { Link, useNavigate } from "@tanstack/react-router";
import { PAIRING_CODE_LENGTH } from "@wedding/shared";
import { ArrowRight, Loader2, LogIn, Monitor } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/context/theme-provider";
import { useDocumentTitle } from "@/lib/document-title";
import { setLayarAuth } from "../../lib/layar.js";
import { deviceApi } from "../../lib/scan/device-api.js";

function formatCode(raw: string) {
  const clean = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, PAIRING_CODE_LENGTH);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

/** Memasangkan layar sapa/dapur (laptop atau TV pintar) dengan kode pairing dari menu Perangkat. */
export function LayarPairPage() {
  useDocumentTitle("Pasang layar");
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
      const result = await deviceApi.pair(code, "layar");
      setLayarAuth({
        token: result.token,
        deviceId: result.deviceId,
        deviceName: result.deviceName,
      });
      await navigate({ to: "/layar" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memasangkan layar");
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
                <Monitor className="size-6" aria-hidden />
              </span>
              <CardTitle className="text-xl tracking-tight">Pasang layar</CardTitle>
              <CardDescription>
                Di admin, buka menu Perangkat lalu Tambah perangkat dengan jenis Layar sapa/dapur.
                Ketik kode 8 karakternya di sini.
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
