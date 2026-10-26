import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "../lib/api.js";
import { meQuery } from "../lib/queries.js";

export function LoginPage() {
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
    <main className="grid h-svh max-w-none items-center justify-center px-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:p-8">
        <div className="mb-4 flex items-center justify-center">
          <span className="me-2 grid size-6 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
            H&amp;R
          </span>
          <h1 className="text-xl font-medium">Hasri &amp; Ramli</h1>
        </div>
        <Card className="px-6 max-w-sm gap-4 self-center">
          <CardHeader>
            <CardTitle className="text-lg tracking-tight">Masuk</CardTitle>
            <CardDescription>
              Masukkan email dan kata sandi Anda untuk membuka panel admin undangan.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Field label="Email">
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
            <Field label="Kata sandi">
              {(id) => (
                <div className="relative rounded-md">
                  <Input
                    id={id}
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute end-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground"
                  >
                    {show ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
              )}
            </Field>
            {login.error && <Alert tone="error">{login.error.message}</Alert>}
            <Button type="submit" disabled={login.isPending} className="mt-2">
              {login.isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
              Masuk
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
