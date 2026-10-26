import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowAction =
  | "separator"
  | {
      label: string;
      icon?: ReactNode;
      onSelect: () => void;
      destructive?: boolean;
      disabled?: boolean;
    };

/** Menu "…" di ujung baris (DataTableRowActions shadcn-admin). */
export function DataTableRowActions({ actions }: { actions: RowAction[] }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Buka menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {actions.map((action, index) =>
          action === "separator" ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: pemisah tidak punya identitas
            <DropdownMenuSeparator key={`sep-${index}`} />
          ) : (
            <DropdownMenuItem
              key={action.label}
              variant={action.destructive ? "destructive" : "default"}
              disabled={action.disabled}
              onClick={action.onSelect}
            >
              {action.label}
              {action.icon && <span className="ms-auto [&_svg]:size-4">{action.icon}</span>}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
