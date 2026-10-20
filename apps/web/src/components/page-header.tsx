import type { ReactNode } from "react";
import { Badge } from "./ui/badge.js";

export function PageHeader({
  tag,
  title,
  description,
  actions,
}: {
  /** Label acid di atas judul, mis. "Tamu". */
  tag?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-6">
      <div className="flex flex-col gap-3">
        {tag && (
          <Badge variant="tag" className="w-fit">
            {tag}
          </Badge>
        )}
        <h1 className="font-display text-3xl font-bold tracking-h1 uppercase md:text-4xl">
          {title}
        </h1>
        {description && <p className="max-w-prose text-base text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
