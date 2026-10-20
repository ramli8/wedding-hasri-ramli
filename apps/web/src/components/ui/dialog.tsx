import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

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
 * Modal memakai elemen <dialog> bawaan browser (fokus terkurung, Esc menutup).
 * Isinya baru dirender saat terbuka, jadi state formulir selalu bersih.
 */
export function Dialog({ open, onClose, title, description, wide, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // showModal() memfokuskan kontrol pertama (tombol tutup); pindahkan ke isi dialog.
      element.querySelector<HTMLElement>("[data-dialog-body]")?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onPointerDown={(event) => {
        // menekan latar (backdrop) menutup; target di dalam konten tidak
        if (event.target === ref.current) onClose();
      }}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto border-2 border-ink bg-paper p-0 text-ink shadow-hard-lg backdrop:bg-ink/60 ${wide ? "max-w-2xl" : "max-w-md"}`}
    >
      {open && (
        <div data-dialog-body tabIndex={-1} className="flex flex-col gap-4 p-5 outline-none">
          <header className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold tracking-h2 uppercase">{title}</h2>
              {description && <p className="text-ink-soft">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="grid size-9 shrink-0 place-items-center border-2 border-ink bg-paper hover:bg-acid"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
