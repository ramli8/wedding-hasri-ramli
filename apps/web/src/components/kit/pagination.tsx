import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { type ReactNode, useState } from "react";
import { Select } from "@/components/kit/select";
import { Button } from "@/components/ui/button";
import { cn, getPageNumbers } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  pageSize?: number;
  onPageSize?: (size: number) => void;
  sizes?: number[];
  className?: string;
};

/**
 * Bilah bawah tabel: salinan DataTablePagination shadcn-admin untuk daftar yang dipotong di luar
 * TanStack Table (server atau `Paged`). Tabel TanStack memakai `DataTablePagination` langsung.
 */
export function Pagination({
  page,
  pageCount,
  onPage,
  pageSize,
  onPageSize,
  sizes = [10, 20, 30, 40, 50],
  className,
}: PaginationProps) {
  const pageNumbers = getPageNumbers(page, pageCount);
  return (
    <div
      className={cn(
        "flex items-center justify-between overflow-clip px-2 max-lg:flex-col-reverse max-lg:gap-4",
        className,
      )}
      style={{ overflowClipMargin: 1 }}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex w-32 items-center justify-center text-sm font-medium whitespace-nowrap lg:hidden">
          Halaman {page} dari {pageCount}
        </div>
        {pageSize !== undefined && onPageSize ? (
          <div className="flex items-center gap-2 max-lg:flex-row-reverse">
            <Select
              compact
              className="w-17.5"
              aria-label="Baris per halaman"
              value={pageSize}
              onChange={(event) => onPageSize(Number(event.target.value))}
            >
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
            <p className="hidden text-sm font-medium whitespace-nowrap sm:block">
              Baris per halaman
            </p>
          </div>
        ) : (
          <span />
        )}
      </div>
      <div className="flex items-center sm:space-x-6 lg:space-x-8">
        <div className="flex w-32 items-center justify-center text-sm font-medium whitespace-nowrap max-lg:hidden">
          Halaman {page} dari {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="size-8 p-0 max-md:hidden"
            onClick={() => onPage(1)}
            disabled={page <= 1}
          >
            <span className="sr-only">Halaman pertama</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
          >
            <span className="sr-only">Sebelumnya</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          {pageNumbers.map((pageNumber, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: urutan nomor halaman tetap, "..." bisa muncul dua kali
            <div key={`${pageNumber}-${index}`} className="flex items-center">
              {pageNumber === "..." ? (
                <span className="px-1 text-sm text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={page === pageNumber ? "default" : "outline"}
                  className="h-8 min-w-8 px-2 max-sm:hidden"
                  onClick={() => onPage(pageNumber as number)}
                >
                  <span className="sr-only">Ke halaman {pageNumber}</span>
                  {pageNumber}
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount}
          >
            <span className="sr-only">Berikutnya</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0 max-md:hidden"
            onClick={() => onPage(pageCount)}
            disabled={page >= pageCount}
          >
            <span className="sr-only">Halaman terakhir</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Memotong daftar di sisi klien lalu menampilkan `Pagination`; tersembunyi bila muat satu halaman. */
export function Paged<T>({
  items,
  initialSize = 10,
  children,
}: {
  items: T[];
  initialSize?: number;
  children: (rows: T[]) => ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = items.slice((current - 1) * pageSize, current * pageSize);
  return (
    <>
      {children(rows)}
      {items.length > initialSize && (
        <Pagination
          page={current}
          pageCount={pageCount}
          onPage={setPage}
          pageSize={pageSize}
          onPageSize={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </>
  );
}
