import { type ReactNode, useEffect, useRef, useState } from "react";
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
 * Di HP berubah menjadi lembar yang menempel di bawah; baris tombol formulir menempel di dasar
 * lembar (lihat styles.css).
 *
 * Isian yang sudah diketik tidak hilang tanpa sengaja: menutup lewat ketuk di luar, Esc, atau
 * tombol X menanyakan "Buang perubahan?" bila ada isian yang berubah. Tombol Batal dan simpan yang
 * berhasil menutup langsung (pemanggil memanggil `onClose` sendiri).
 */
export function Dialog({ open, onClose, title, description, wide, children }: DialogProps) {
  const dirty = useRef(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open) dirty.current = false;
    else setConfirming(false);
  }, [open]);

  const requestClose = () => {
    if (dirty.current) setConfirming(true);
    else onClose();
  };

  return (
    <>
      <ShadcnDialog open={open} onOpenChange={(next) => !next && requestClose()}>
        <DialogContent
          onInputCapture={() => {
            dirty.current = true;
          }}
          onChangeCapture={() => {
            dirty.current = true;
          }}
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

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buang perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Isian di “{title}” belum disimpan dan akan hilang bila ditutup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lanjut mengisi</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setConfirming(false);
                onClose();
              }}
            >
              Buang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
