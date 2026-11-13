import type { ReactNode } from "react";
import { Alert } from "@/components/kit/alert";
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

/** Konfirmasi sebelum aksi yang tidak bisa dibatalkan (hapus, lepas HP, mulai hitungan baru). */
export function ConfirmDialog({
  open,
  title,
  description,
  action,
  destructive,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  action: string;
  destructive?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="buwuh !bg-[var(--bw-surface)]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--bw-muted)]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <Alert tone="error">{error}</Alert>}
        <AlertDialogFooter>
          <AlertDialogCancel className="h-12">Batal</AlertDialogCancel>
          <AlertDialogAction
            className={`h-12 ${destructive ? "bg-[var(--bw-danger)] hover:bg-[var(--bw-danger)]" : "bg-[var(--bw-accent)] hover:bg-[var(--bw-accent-hover)]"} text-[var(--bw-on-accent)]`}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
          >
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
