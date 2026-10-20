import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useId, useState } from "react";
import { Button } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import { api } from "../lib/api.js";
import { meQuery } from "../lib/queries.js";

export function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const id = useId();
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
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-heading-sm font-semibold">Masuk admin</h1>
        <p className="text-mid-gray">Hasri &amp; Ramli</p>
      </header>
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-email`} className="text-body font-medium">
              Email
            </label>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-password`} className="text-body font-medium">
              Kata sandi
            </label>
            <Input
              id={`${id}-password`}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {login.error && (
            <p role="alert" className="text-body text-ember">
              {login.error.message}
            </p>
          )}
          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? "Memproses…" : "Masuk"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
