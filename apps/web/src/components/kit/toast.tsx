import { CheckCircle2, CircleAlert } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; message: string; tone: "success" | "error"; at: number };

const SHOW_MS = 2_500;
let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

/** Pesan singkat di bawah layar, mis. "Tersimpan". Hilang sendiri setelah 2,5 detik (bawaan). */
export function toast(message: string, tone: Toast["tone"] = "success", showMs = SHOW_MS) {
  const item = { id: nextId++, message, tone, at: Date.now() };
  // Satu pesan saja yang tampil: simpan beruntun tidak menumpuk.
  toasts = [item];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== item.id);
    emit();
  }, showMs);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Dipasang sekali di AppLayout. */
export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] flex justify-center px-4"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full border bg-popover px-4 py-2.5 text-sm font-medium text-popover-foreground shadow-lg duration-200 animate-in fade-in slide-in-from-bottom-2",
          )}
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="size-4 text-success" aria-hidden />
          ) : (
            <CircleAlert className="size-4 text-destructive" aria-hidden />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
