"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  isLoading?: boolean;
  /** Rendered inside the table body when there are no rows. */
  emptyState?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
}

/**
 * Presentation-only table driven by a TanStack Table instance. Sorting header
 * buttons are rendered for columns with `enableSorting` (client-side, within
 * the current server page). Column visibility is controlled by the caller.
 */
export function DataTable<TData>({ table, isLoading, emptyState, skeletonRows = 8, className }: DataTableProps<TData>) {
  const columnCount = table.getVisibleLeafColumns().length;
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <Table className="min-w-max text-xs">
        <TableHeader className="bg-muted/60">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const align = (header.column.columnDef.meta as { align?: string } | undefined)?.align;
                return (
                  <TableHead
                    key={header.id}
                    className={cn("h-9 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", align === "right" && "text-right", align === "center" && "text-center")}
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : canSort ? "none" : undefined}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn("inline-flex items-center gap-1 rounded uppercase tracking-wide hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring", align === "right" && "flex-row-reverse")}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="size-3" aria-hidden="true" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="size-3" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-50" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((__, j) => (
                  <TableCell key={j} className="py-3">
                    <Skeleton className="h-3.5 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="p-4">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-accent/40">
                {row.getVisibleCells().map((cell) => {
                  const align = (cell.column.columnDef.meta as { align?: string } | undefined)?.align;
                  return (
                    <TableCell key={cell.id} className={cn("py-2.5 align-middle", align === "right" && "text-right", align === "center" && "text-center")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
