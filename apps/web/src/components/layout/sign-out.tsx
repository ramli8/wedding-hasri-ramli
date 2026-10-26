import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { meQuery } from "@/lib/queries";

/** Konfirmasi keluar (SignOutDialog shadcn-admin). `ask` membuka dialog, `dialog` dirender di mana saja. */
export function useSignOut() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(meQuery.queryKey, null);
      await navigate({ to: "/admin/masuk" });
    },
  });

  const dialog = (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin ingin keluar? Anda perlu masuk lagi untuk membuka panel admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={() => logout.mutate()} disabled={logout.isPending}>
            Keluar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { ask: () => setOpen(true), dialog };
}
