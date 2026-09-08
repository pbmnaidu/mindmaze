import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils/format";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  itemLabel?: string;
  bordered?: boolean;
}

export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled,
  itemLabel = "records",
  bordered = true,
}: PaginationControlsProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className={`flex flex-col gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between ${bordered ? "border-t" : ""}`}>
      <p className="tabular">
        Showing <span className="font-medium text-foreground">{formatNumber(start)}–{formatNumber(end)}</span> of{" "}
        <span className="font-medium text-foreground">{formatNumber(total)}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <span className="tabular">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1} aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= totalPages} aria-label="Next page">
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
