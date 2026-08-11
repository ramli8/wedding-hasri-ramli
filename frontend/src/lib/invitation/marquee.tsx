import { cn } from "@/src/lib/utils";

type MarqueeProps = {
  items: string[];
  className?: string;
};

export function Marquee({ items, className }: MarqueeProps) {
  const text = items.join("  ✦  ");

  return (
    <div
      aria-hidden
      className={cn(
        "inv-marquee overflow-hidden whitespace-nowrap border-y border-[var(--inv-hairline)] py-4",
        className,
      )}
    >
      <div className="inv-marquee-track flex w-max">
        <span className="inv-label px-8 text-sm tracking-[0.3em]">{text}</span>
        <span className="inv-label px-8 text-sm tracking-[0.3em]">{text}</span>
      </div>
    </div>
  );
}
