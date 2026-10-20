import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { api } from "../lib/api.js";
import { meQuery } from "../lib/queries.js";

export function AdminHomePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(meQuery);

  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.setQueryData(meQuery.queryKey, null);
      await navigate({ to: "/admin/masuk" });
    },
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-heading-sm font-semibold">Halo, {data?.admin.name}</h1>
        <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
          Keluar
        </Button>
      </header>
      <Card>
        <p className="text-mid-gray">
          Fondasi siap. Menu tamu dan scanner menyusul di fase berikutnya.
        </p>
      </Card>
    </main>
  );
}
