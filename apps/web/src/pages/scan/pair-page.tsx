import { useNavigate } from "@tanstack/react-router";
import { PAIRING_CODE_LENGTH } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getMeta, pendingCount, resetDevice, setMeta } from "../../lib/scan/db.js";
import { deviceApi } from "../../lib/scan/device-api.js";
import { syncEngine } from "../../lib/scan/sync.js";

/** "k7m2 9qxa" → "K7M2-9QXA" (hanya huruf dan angka, maksimal 8 karakter). */
function formatCode(raw: string) {
  const clean = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, PAIRING_CODE_LENGTH);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

export function PairPage() {
  const navigate = useNavigate();
  const auth = useLiveQuery(() => getMeta("auth"), []);
  const pending = useLiveQuery(() => pendingCount(), [], 0);

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await deviceApi.pair(code);
      await resetDevice();
      await setMeta("auth", {
        token: result.token,
        deviceId: result.deviceId,
        deviceName: result.deviceName,
      });
      await syncEngine.start();
      await syncEngine.syncNow();
      await navigate({ to: "/scan" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memasangkan perangkat");
      setBusy(false);
    }
  }

  async function release() {
    if (pending > 0) {
      setError(
        `Masih ada ${pending} check-in yang belum terkirim. Hubungkan internet dan tunggu sinkron dulu.`,
      );
      return;
    }
    await resetDevice();
    setError(null);
  }

  return (
    <main className="grid min-h-dvh items-center justify-center bg-muted/30 px-4">
      <div className="mx-auto flex w-full flex-col justify-center gap-2 py-8">
        <div className="mb-4 flex items-center justify-center">
          <span className="me-2 grid size-6 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
            H&amp;R
          </span>
          <h1 className="text-xl font-medium">Scanner tamu</h1>
        </div>
        <Card className="w-full max-w-sm gap-4 self-center">
          <CardHeader>
            <CardTitle className="text-lg tracking-tight">Pasang perangkat</CardTitle>
            <CardDescription>
              Minta admin membuat perangkat di menu Perangkat, lalu masukkan kode 8 karakternya.
              Lakukan saat internet masih menyala.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {auth ? (
              <div className="flex flex-col gap-3">
                <Alert>Perangkat ini sudah terpasang sebagai “{auth.deviceName}”.</Alert>
                {error && <Alert tone="error">{error}</Alert>}
                <Button onClick={() => void navigate({ to: "/scan" })}>Buka scanner</Button>
                <Button variant="destructive" onClick={() => void release()}>
                  Lepas perangkat ini
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <Field label="Kode pairing">
                  {(id) => (
                    <Input
                      id={id}
                      required
                      autoFocus
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      inputMode="text"
                      className="text-center font-mono text-2xl"
                      placeholder="XXXX-XXXX"
                      value={code}
                      onChange={(e) => setCode(formatCode(e.target.value))}
                    />
                  )}
                </Field>
                {error && <Alert tone="error">{error}</Alert>}
                <Button
                  type="submit"
                  disabled={busy || code.replace("-", "").length < PAIRING_CODE_LENGTH}
                >
                  {busy ? (
                    "Memasangkan…"
                  ) : (
                    <>
                      Pasangkan <ArrowRight className="size-4" aria-hidden />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
