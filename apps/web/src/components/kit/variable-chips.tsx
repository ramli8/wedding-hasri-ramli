import { useRef } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Chip variabel template yang disisipkan di posisi kursor (bukan di akhir teks). Posisi kursor
 * terakhir diingat lewat `trackCaret`, karena mengetuk chip di HP membuat textarea kehilangan fokus.
 */
export function useCaretInsert(value: string, onChange: (next: string) => void) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<{ start: number; end: number } | null>(null);
  const trackCaret = () => {
    const el = ref.current;
    if (el) caret.current = { start: el.selectionStart, end: el.selectionEnd };
  };
  const insert = (text: string) => {
    const { start, end } = caret.current ?? { start: value.length, end: value.length };
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    const position = start + text.length;
    caret.current = { start: position, end: position };
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(position, position);
    });
  };
  return { ref, trackCaret, insert };
}

export function VariableChips({
  variables,
  onInsert,
}: {
  variables: readonly { name: string; description: string }[];
  onInsert: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {variables.map((variable) => (
        <button
          key={variable.name}
          type="button"
          title={variable.description}
          aria-label={`Sisipkan ${variable.name} (${variable.description})`}
          // Mencegah textarea kehilangan fokus di desktop, agar posisi kursor tetap.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(variable.name)}
          className="rounded-md"
        >
          <Badge
            variant="outline"
            className="h-8 px-2.5 font-mono hover:bg-accent max-md:h-11 max-md:px-3"
          >
            {variable.name}
          </Badge>
        </button>
      ))}
    </div>
  );
}
