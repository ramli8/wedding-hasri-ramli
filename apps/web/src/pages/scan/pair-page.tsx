import { Link, useNavigate } from "@tanstack/react-router";
import { PAIRING_CODE_LENGTH } from "@wedding/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, Loader2, LogIn, ScanLine, Smartphone, Unlink } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/context/theme-provider";
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
  const [confirming, setConfirming] = useState(false);

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
      setConfirming(false);
      setError(
        `Masih ada ${pending} check-in yang belum terkirim. Hubungkan internet dan tunggu sinkron dulu.`,
      );
      return;
    }
    await resetDevice();
    setConfirming(false);
    setError(null);
  }

  return (
    <ThemeProvider>
      <main className="grid min-h-svh place-items-center bg-muted/40 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex w-full max-w-sm flex-col gap-6 py-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              H&amp;R
            </span>
            <p className="text-lg font-semibold">Hasri &amp; Ramli</p>
          </div>

          {auth ? (
            <Card className="gap-6">
              <CardHeader className="text-center">
                <span className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-success/15 text-success">
                  <Smartphone className="size-6" aria-hidden />
                </span>
                <CardTitle className="text-xl tracking-tight">Perangkat sudah terpasang</CardTitle>
                <CardDescription>
                  Terdaftar sebagai <b className="text-foreground">{auth.deviceName}</b>.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {error && <Alert tone="error">{error}</Alert>}
                <Button
                  className="h-11 w-full md:h-10"
                  onClick={() => void navigate({ to: "/scan" })}
                >
                  <ScanLine aria-hidden /> Buka scanner
                </Button>
                {confirming ? (
                  <div className="grid gap-3 rounded-lg border border-destructive/40 p-3">
                    <p className="text-sm">
                      Data tamu dan riwayat di perangkat ini akan dihapus, dan perangkat harus
                      dipasangkan ulang dengan kode baru.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="h-11 md:h-10"
                        onClick={() => setConfirming(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-11 md:h-10"
                        onClick={() => void release()}
                      >
                        Ya, lepas
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="h-11 w-full text-destructive hover:text-destructive md:h-10"
                    onClick={() => setConfirming(true)}
                  >
                    <Unlink aria-hidden /> Lepas perangkat ini
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="gap-6">
              <CardHeader className="text-center">
                <CardTitle className="text-xl tracking-tight">Pasang scanner</CardTitle>
                <CardDescription>
                  Masukkan kode pairing 8 karakter dari admin. Cukup sekali, saat internet menyala.
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
                        autoCapitalize="characters"
                        spellCheck={false}
                        inputMode="text"
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

                <ol className="mt-6 grid gap-2 border-t pt-4 text-sm text-muted-foreground">
                  {[
                    "Admin membuka menu Perangkat, lalu Tambah perangkat.",
                    "Kode 8 karakter muncul di layar admin.",
                    "Ketik kode itu di sini. Kodenya hanya bisa dipakai sekali.",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

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
