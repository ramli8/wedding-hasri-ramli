import { useNavigate } from "@tanstack/react-router";
import { PAIRING_CODE_LENGTH } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Card } from "../../components/ui/card.js";
import { Field } from "../../components/ui/field.js";
import { Input } from "../../components/ui/input.js";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 px-4 py-10">
      <Card shadow="lg" className="flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <span className="tag grid size-12 place-items-center border-2 border-ink bg-acid">
            H&amp;R
          </span>
          <h1 className="font-display text-3xl font-bold tracking-h1 uppercase">
            Pasang perangkat
          </h1>
          <p className="text-ink-soft">
            Minta admin membuat perangkat di menu Perangkat, lalu masukkan kode 8 karakternya.
            Lakukan saat internet masih menyala.
          </p>
        </header>

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
                  className="text-center font-mono text-2xl tracking-label uppercase"
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
      </Card>
    </main>
  );
}
