import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/risk/risk-badge";
import { StatusBadge, deriveStatus } from "./status-badge";
import type { WorkRecord } from "@/lib/types";
import { formatScore, textOrDash, toTitleCase } from "@/lib/utils/format";

export function ProjectHeader({ work }: { work: WorkRecord }) {
  return (
    <Card className="gap-0 rounded-md p-0 shadow-none">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-all rounded-sm border bg-muted px-2 py-1 font-mono text-xs text-foreground">{work.work_id}</span>
            <StatusBadge status={deriveStatus(work)} />
          </div>
          <h1 className="text-lg font-semibold leading-snug tracking-tight text-foreground text-pretty sm:text-xl">
            {textOrDash(work.description)}
          </h1>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">State</dt>
              <dd className="font-medium">{toTitleCase(work.State ?? work.state)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Constituency</dt>
              <dd className="font-medium">{toTitleCase(work.Constituency ?? work.constituency)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium">{textOrDash(work.work_category)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Member of Parliament</dt>
              <dd className="font-medium">{textOrDash(work.mp_name)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 items-center gap-5 rounded-md border bg-muted/50 px-5 py-4 lg:flex-col lg:items-end lg:gap-1">
          <div className="flex flex-col lg:items-end">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Composite risk score</span>
            <span className="font-mono text-3xl font-semibold tabular leading-none">
              {formatScore(work.composite_risk_score)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
            </span>
          </div>
          <RiskBadge level={work.overall_risk_level} size="md" />
        </div>
      </div>
    </Card>
  );
}

export function ProjectHeaderSkeleton() {
  return (
    <Card className="gap-4 rounded-md p-5 shadow-none">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-6 w-3/4" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    </Card>
  );
}
