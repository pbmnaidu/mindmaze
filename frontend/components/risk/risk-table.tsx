"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ColumnVisibility } from "@/components/shared/column-visibility";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/states";
import type { WorkRecord } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format";
import { riskTableColumns } from "./risk-table-columns";

interface RiskTableProps {
  records: WorkRecord[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onReset: () => void;
  defaultHidden?: VisibilityState;
}

export function RiskTable({
  records,
  total,
  page,
  totalPages,
  pageSize,
  isLoading,
  isFetching,
  onPageChange,
  onReset,
  defaultHidden = {},
}: RiskTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultHidden);

  const table = useReactTable({
    data: records,
    columns: riskTableColumns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <Card className="overflow-hidden rounded-md py-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <p className="text-xs text-muted-foreground tabular" aria-live="polite">
          {isLoading ? "Loading…" : (
            <>
              <span className="font-medium text-foreground">{formatNumber(total)}</span> works match
              {isFetching && <span className="ml-2 text-muted-foreground/70">Updating…</span>}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {sorting.length > 0 && (
            <span className="text-[11px] text-muted-foreground">Sorted within this page</span>
          )}
          <ColumnVisibility table={table} />
        </div>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No works match the selected filters."
            description="Adjust or reset the filters to widen the search. Results are filtered on the server across the full dataset."
            className="border-0 py-6"
            action={
              <button type="button" onClick={onReset} className="text-xs font-medium text-primary underline-offset-2 hover:underline">
                Reset filters
              </button>
            }
          />
        }
        onRowClick={(row) => router.push(`/projects/${encodeURIComponent(row.original.work_id)}`)}
      />
      <PaginationControls
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
        disabled={isLoading}
        itemLabel="works"
      />
    </Card>
  );
}
