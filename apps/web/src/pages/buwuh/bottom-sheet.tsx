import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

/**
 * Tinggi keyboard layar dan tinggi area yang masih terlihat. Chrome Android dan Safari iOS tidak
 * mengecilkan layar saat keyboard muncul, jadi elemen `fixed bottom-0` tertutup keyboard; dengan
 * visualViewport lembar diangkat tepat di atas keyboard sehingga tombol Simpan tetap terlihat.
 */
function useKeyboardInset() {
  const [state, setState] = useState({ inset: 0, height: 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () =>
      setState({
        inset: Math.max(0, window.innerHeight - vv.height - vv.offsetTop),
        height: vv.height,
      });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return state;
}

/**
 * Lembar dari bawah layar untuk HP meja buwuh (nama pemberi, jumlah barang). Radix Dialog menjaga
 * fokus di dalam lembar dan menutup dengan Esc atau ketuk di luar.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  const { inset, height } = useKeyboardInset();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(28_25_23/0.45)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          style={{
            bottom: inset,
            maxHeight: height ? `${Math.round(height * 0.94)}px` : undefined,
          }}
          className="buwuh fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92svh] w-full max-w-lg flex-col gap-3 overflow-y-auto overscroll-contain rounded-t-3xl !bg-[var(--bw-surface)] px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom"
        >
          <div className="h-1.5 w-10 shrink-0 self-center rounded-full bg-[var(--bw-line-strong)]" />
          <div className="flex items-center justify-between gap-3">
            <DialogPrimitive.Title className="min-w-0 text-xl font-extrabold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Tutup"
              className="bw-press grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--bw-bg)]"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
