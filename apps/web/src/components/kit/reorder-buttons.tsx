import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Tombol naik/turun kecil di sisi kiri kartu daftar yang bisa diurutkan. */
export function ReorderButtons({
  index,
  count,
  busy,
  onMove,
}: {
  index: number;
  count: number;
  busy?: boolean;
  onMove: (index: number, delta: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Naikkan"
        onClick={() => onMove(index, -1)}
        disabled={index === 0 || busy}
      >
        <ArrowUp aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Turunkan"
        onClick={() => onMove(index, 1)}
        disabled={index === count - 1 || busy}
      >
        <ArrowDown aria-hidden />
      </Button>
    </div>
  );
}
