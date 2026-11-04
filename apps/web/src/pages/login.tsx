import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, ScanLine } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/context/theme-provider";
import { api } from "../lib/api.js";
import { meQuery } from "../lib/queries.js";

/** Halaman masuk admin: satu kartu formulir di tengah layar, tema mengikuti pilihan di admin. */
export function LoginPage() {
  return (
    <ThemeProvider>
      <LoginForm />
    </ThemeProvider>
  );
}

function LoginForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: async (data) => {
      queryClient.setQueryData(meQuery.queryKey, data);
      await navigate({ to: "/admin" });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex w-full max-w-sm flex-col gap-6 py-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            H&amp;R
          </span>
          <p className="text-lg font-semibold">Hasri &amp; Ramli</p>
        </div>

        <Card className="gap-6">
          <CardHeader className="text-center">
            <CardTitle className="text-xl tracking-tight">Masuk</CardTitle>
            <CardDescription>Masukkan email dan kata sandi akun admin Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <Field label="Email">
                {(id) => (
                  <Input
                    id={id}
                    type="email"
                    autoComplete="username"
                    autoFocus
                    required
                    placeholder="nama@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 text-base md:h-10 md:text-sm"
                  />
                )}
              </Field>
              <Field label="Kata sandi">
                {(id) => (
                  <div className="relative">
                    <Input
                      id={id}
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pe-11 text-base md:h-10 md:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((value) => !value)}
                      aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      aria-pressed={show}
                      className="absolute end-0 top-0 grid size-11 place-items-center rounded-e-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:size-10"
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                )}
              </Field>
              {login.error && <Alert tone="error">{login.error.message}</Alert>}
              <Button type="submit" disabled={login.isPending} className="mt-1 h-11 w-full md:h-10">
                {login.isPending && <Loader2 className="animate-spin" aria-hidden />}
                {login.isPending ? "Memeriksa…" : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Penjaga pintu tidak punya akun: scanner dipasangkan dengan kode dari admin. */}
        <div className="grid gap-2">
          <Button variant="outline" asChild className="h-11 w-full bg-background md:h-10">
            <Link to="/scan">
              <ScanLine aria-hidden /> Masuk ke scanner pintu
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Untuk penjaga pintu, memakai kode pairing dari admin.
          </p>
        </div>
      </div>
    </main>
  );
}
