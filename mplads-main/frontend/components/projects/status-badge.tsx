import type { WorkRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export type WorkStatus = "COMPLETED" | "ONGOING" | "SANCTIONED" | "RECOMMENDED" | "UNKNOWN";

const LABEL: Record<WorkStatus, string> = {
  COMPLETED: "Completed",
  ONGOING: "Ongoing",
  SANCTIONED: "Sanctioned",
  RECOMMENDED: "Recommended",
  UNKNOWN: "Status unavailable",
};

/**
 * The API does not return an explicit status field. Status is derived from the
 * lifecycle dates that are present: completion → sanction → recommendation.
 */
export function deriveStatus(work: WorkRecord): WorkStatus {
  if (work.completion_date) return "COMPLETED";
  if (work.sanction_date && (work.effective_expenditure ?? 0) > 0) return "ONGOING";
  if (work.sanction_date) return "SANCTIONED";
  if (work.recommended_date) return "RECOMMENDED";
  return "UNKNOWN";
}

export function StatusBadge({ status, className }: { status: WorkStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium",
        status === "UNKNOWN" ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {LABEL[status]}
    </span>
  );
}
