import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type Table as TanstackTable,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { type ReactNode, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./pagination";
import { DataTableToolbar } from "./toolbar";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  /** Kolom yang disaring oleh kotak cari; tanpa ini kotak cari menyaring semua kolom. */
  searchKey?: string;
  filters?: React.ComponentProps<typeof DataTableToolbar<TData>>["filters"];
  getRowId?: (row: TData) => string;
  emptyText?: string;
  /** Tampil di bawah bilah alat saat ada baris terpilih (mis. DataTableBulkActions). */
  bulkActions?: (table: TanstackTable<TData>) => ReactNode;
  /** Opsi tambahan useReactTable, mis. mode server: manualPagination, pageCount, state, onXChange. */
  options?: Partial<TableOptions<TData>>;
  /** Ganti bilah alat bawaan (mis. filter yang berjalan di server). */
  renderToolbar?: (table: TanstackTable<TData>) => ReactNode;
  /** Sembunyikan bilah alat (kotak cari dan filter). */
  hideToolbar?: boolean;
  /** Isi tambahan di sebelah kanan bilah alat. */
  toolbarEnd?: ReactNode;
  className?: string;
};

/**
 * Tabel data persis pola UsersTable shadcn-admin: bilah alat (cari, filter faset, Tampilan),
 * tabel dalam `rounded-md border`, paginasi, dan aksi massal untuk baris terpilih.
 */
export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder,
  searchKey,
  filters,
  getRowId,
  emptyText = "Tidak ada hasil.",
  bulkActions,
  options,
  renderToolbar,
  hideToolbar,
  toolbarEnd,
  className,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, onColumnFiltersChange] = useState<ColumnFiltersState>([]);
  const [globalFilter, onGlobalFilterChange] = useState<string>("");
  const [pagination, onPaginationChange] = useState({ pageIndex: 0, pageSize: 10 });

  const { state: extraState, ...restOptions } = options ?? {};

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      globalFilter,
      columnVisibility,
      ...extraState,
    },
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    ...restOptions,
  });

  return (
    <div
      className={cn('flex flex-1 flex-col gap-4 max-sm:has-[div[role="toolbar"]]:mb-16', className)}
    >
      {!hideToolbar && renderToolbar?.(table)}
      {!hideToolbar && !renderToolbar && (
        <DataTableToolbar
          table={table}
          searchPlaceholder={searchPlaceholder}
          searchKey={searchKey}
          filters={filters}
        />
      )}
      {toolbarEnd}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group/row">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group/row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className="mt-auto" />
      {bulkActions?.(table)}
    </div>
  );
}
