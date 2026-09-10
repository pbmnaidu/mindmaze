"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DataSourceNotice } from "@/components/shared/data-source-notice";
import { ErrorState } from "@/components/shared/states";
import { useFilterOptions, useRiskMonitor } from "@/hooks/use-risk-monitor";
import { useQueueFilters } from "@/hooks/use-queue-filters";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/risk";
import { FilterBar } from "./filter-bar";
import { RiskTable } from "./risk-table";
import { useRoleScope } from "@/components/providers/role-scope-provider";
import { MonitoringRequired } from "@/components/shared/monitoring-required";
import { SectionHeading } from "@/components/shared/section-heading";

export function RiskMonitorView() {
  const { apiScope, role, label } = useRoleScope();
  const { filters, queryParams, apply, reset, activeCount } = useQueueFilters(DEFAULT_PAGE_SIZE);
  const options = useFilterOptions(apiScope ?? {});
  const baseParams = {
    ...queryParams,
    role: apiScope?.role ?? queryParams.role,
    state: apiScope?.state || queryParams.state,
    constituency: apiScope?.constituency || queryParams.constituency,
    search: queryParams.constituency || queryParams.search,
  };
  const staleQueue = useRiskMonitor({ ...baseParams, monitoring_group: "stale_one_year" });
  const priorityQueue = useRiskMonitor({ ...baseParams, monitoring_group: "high_critical" });

  const staleData = staleQueue.data?.data;
  const priorityData = priorityQueue.data?.data;

  if (!apiScope) return <MonitoringRequired />;
  return (
    <>
      <PageHeader
        title="Risk Monitor"
        description={`Highest-priority works are shown first within ${label}. Start at the top and review downward.`}
      />

      <DataSourceNotice source={staleQueue.data?.source ?? priorityQueue.data?.source} />

      <FilterBar
        filters={filters}
        options={options.data?.data}
        onApply={apply}
        onReset={reset}
        activeCount={activeCount}
        lockedScope={role === "NATIONAL" ? undefined : { state: apiScope.state, constituency: apiScope.constituency }}
      />

      {staleQueue.isError || priorityQueue.isError ? (
        <ErrorState
          title="Unable to load risk data."
          description="The monitoring queues could not be retrieved. Please try again."
          onRetry={() => { staleQueue.refetch(); priorityQueue.refetch(); }}
          retrying={staleQueue.isFetching || priorityQueue.isFetching}
        />
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3" aria-labelledby="stale-monitoring-heading">
            <SectionHeading title="Works needing a one-year progress update" description="Early warning queue" />
            <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground sm:grid-cols-3">
              <p><span className="font-semibold text-foreground">What is shown:</span> Works 35 days before or after one year from sanction.</p>
              <p><span className="font-semibold text-foreground">Why it matters:</span> No completion, progress status, or recorded spending update is present.</p>
              <p><span className="font-semibold text-foreground">What to do:</span> Ask for the latest site status and update the official record.</p>
            </div>
            <RiskTable records={staleData?.records ?? []} total={staleData?.total ?? 0} page={staleData?.page ?? 1} totalPages={staleData?.total_pages ?? 1} pageSize={DEFAULT_PAGE_SIZE} isLoading={staleQueue.isPending} isFetching={staleQueue.isFetching} onPageChange={() => undefined} onReset={reset} defaultHidden={{ expenditure: false }} />
          </section>
          <section className="flex flex-col gap-3" aria-labelledby="priority-monitoring-heading">
            <SectionHeading title="High and critical works to review" description="Priority review queue" />
            <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground sm:grid-cols-3">
              <p><span className="font-semibold text-foreground">What is shown:</span> Works with a HIGH or CRITICAL final risk level.</p>
              <p><span className="font-semibold text-foreground">Why it matters:</span> One or more financial, duplicate, or compliance checks need attention.</p>
              <p><span className="font-semibold text-foreground">What to do:</span> Click a row, read the numbered reasons, and verify the source records.</p>
            </div>
            <RiskTable records={priorityData?.records ?? []} total={priorityData?.total ?? 0} page={priorityData?.page ?? 1} totalPages={priorityData?.total_pages ?? 1} pageSize={DEFAULT_PAGE_SIZE} isLoading={priorityQueue.isPending} isFetching={priorityQueue.isFetching} onPageChange={() => undefined} onReset={reset} defaultHidden={{ expenditure: false }} />
          </section>
        </div>
      )}
    </>
  );
}
