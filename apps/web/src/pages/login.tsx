import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert } from "../components/ui/alert.js";
import { Button } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Field } from "../components/ui/field.js";
import { Input } from "../components/ui/input.js";
import { api } from "../lib/api.js";
import { meQuery } from "../lib/queries.js";

export function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <Card shadow="lg" className="p-0">
        <header className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <span className="tag grid size-12 place-items-center border-2 border-ink bg-acid">
            H&amp;R
          </span>
          <h1 className="font-display text-3xl font-bold tracking-h1 uppercase">Masuk admin</h1>
          <p className="max-w-xs text-ink-soft">
            Khusus pengelola undangan Hasri &amp; Ramli. Masuk dengan email dan kata sandi Anda.
          </p>
        </header>
        <form onSubmit={onSubmit} className="flex flex-col gap-5 border-t-2 border-ink p-6">
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
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          {login.error && <Alert tone="error">{login.error.message}</Alert>}
          <Button type="submit" disabled={login.isPending} className="w-full">
            {login.isPending ? (
              "Memproses…"
            ) : (
              <>
                Masuk <ArrowRight className="size-4" aria-hidden />
              </>
            )}
          </Button>
        </form>
      </Card>
    </main>
  );
}
