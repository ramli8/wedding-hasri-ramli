import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
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
 * Baris tombol di dasar dialog (Batal lalu aksi utama). Di HP tetap satu baris supaya lembar tidak
 * banyak tertutup: tombol terakhir (aksi utama) melebar, Batal selebar isinya. Menempel di dasar
 * lembar dan memberi bayangan selama masih ada isian di bawahnya (lihat styles.css).
 */
export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div data-form-footer className="flex gap-2 sm:justify-end">
      {children}
    </div>
  );
}

/** Berapa lama setelah Simpan ditekan pesan galat yang muncul masih dianggap hasil Simpan itu. */
const SUBMIT_ERROR_WINDOW_MS = 15_000;

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
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const submittedAt = useRef(0);

  // Tanda "masih ada isian di bawah": `data-more` selama isi dialog belum digulir sampai dasar.
  const updateMore = useCallback(() => {
    if (!content) return;
    const more = content.scrollTop + content.clientHeight < content.scrollHeight - 4;
    content.toggleAttribute("data-more", more);
  }, [content]);

  useEffect(() => {
    if (!content) return;
    updateMore();
    content.addEventListener("scroll", updateMore, { passive: true });
    const resize = new ResizeObserver(updateMore);
    resize.observe(content);
    for (const child of content.children) resize.observe(child);

    // Simpan ditekan tapi ada isian bermasalah: gulir ke pesan galat pertama yang baru muncul dan
    // fokuskan kolomnya, supaya tidak tersembunyi di bawah baris tombol yang menempel.
    let seen = new Set(content.querySelectorAll("[data-form-error]"));
    const mutations = new MutationObserver(() => {
      updateMore();
      const errors = [...content.querySelectorAll<HTMLElement>("[data-form-error]")];
      const fresh = errors.find((el) => !seen.has(el));
      seen = new Set(errors);
      if (!fresh || Date.now() - submittedAt.current > SUBMIT_ERROR_WINDOW_MS) return;
      submittedAt.current = 0;
      revealError(fresh);
    });
    mutations.observe(content, { childList: true, subtree: true, characterData: true });
    return () => {
      content.removeEventListener("scroll", updateMore);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [content, updateMore]);

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
          ref={setContent}
          onSubmitCapture={() => {
            submittedAt.current = Date.now();
          }}
          // Kolom `required` yang kosong: peramban menolak kirim dan menggulir sendiri, tapi bisa
          // berhenti di balik baris tombol. Arahkan ke tengah lembar.
          onInvalidCapture={(event) => {
            const field = event.target as HTMLElement;
            requestAnimationFrame(() => field.scrollIntoView({ block: "center" }));
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

/** Menggulir pesan galat (dan kolomnya) ke tengah lembar, lalu memfokuskan isiannya bila ada. */
function revealError(error: HTMLElement) {
  const field = error.closest<HTMLElement>("[data-field]") ?? error;
  field.scrollIntoView({ block: "center", behavior: "smooth" });
  const input = field.querySelector<HTMLElement>(
    "input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled)",
  );
  input?.focus({ preventScroll: true });
}
