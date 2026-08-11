import { cn } from "@/src/lib/utils";

export function FilmGrain({ className }: { className?: string }) {
  return <div aria-hidden className={cn("inv-grain", className)} />;
}
