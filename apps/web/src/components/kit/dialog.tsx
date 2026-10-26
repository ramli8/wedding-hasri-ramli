import type { ReactNode } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Dialog as ShadcnDialog,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Lebar lebih besar untuk formulir panjang. */
  wide?: boolean;
  children: ReactNode;
};

/**
 * Dialog Radix shadcn-admin (DialogContent/Header/Title/Description) dengan API lama.
 * Di HP berubah menjadi lembar yang menempel di bawah.
 */
export function Dialog({ open, onClose, title, description, wide, children }: DialogProps) {
  return (
    <ShadcnDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[calc(100dvh-2rem)] overflow-y-auto",
          wide && "sm:max-w-2xl",
          "max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:max-h-[92dvh] max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? undefined : "sr-only"}>
            {description ?? title}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </ShadcnDialog>
  );
}
