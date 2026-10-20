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
    if (open && !element.open) element.showModal();
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
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl border border-hairline bg-paper p-0 text-ink shadow-subtle backdrop:bg-ink/40 ${wide ? "max-w-2xl" : "max-w-md"}`}
    >
      {open && (
        <div className="flex flex-col gap-4 p-5">
          <header className="flex flex-col gap-1">
            <h2 className="text-subheading font-semibold">{title}</h2>
            {description && <p className="text-mid-gray">{description}</p>}
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
