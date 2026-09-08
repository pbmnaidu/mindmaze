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

export function RiskMonitorView() {
  const { apiScope, role, label } = useRoleScope();
  const { filters, queryParams, apply, reset, activeCount } = useQueueFilters(DEFAULT_PAGE_SIZE);
  const options = useFilterOptions(apiScope ?? {});
  const queue = useRiskMonitor({ ...queryParams, ...(apiScope ?? {}) });

  const data = queue.data?.data;

  if (!apiScope) return <MonitoringRequired />;
  return (
    <>
      <PageHeader
        title="Risk Monitor"
        description={`Prioritized works requiring further review within ${label}. Filtering, sorting, and pagination are performed by the risk intelligence service.`}
      />

      <DataSourceNotice source={queue.data?.source} />

      <FilterBar
        filters={filters}
        options={options.data?.data}
        onApply={apply}
        onReset={reset}
        activeCount={activeCount}
        lockedScope={role === "NATIONAL" ? undefined : { state: apiScope.state, constituency: apiScope.constituency }}
      />

      {queue.isError ? (
        <ErrorState
          title="Unable to load risk data."
          description="The prioritized queue could not be retrieved. Please try again."
          onRetry={() => queue.refetch()}
          retrying={queue.isFetching}
        />
      ) : (
        <RiskTable
          records={data?.records ?? []}
          total={data?.total ?? 0}
          page={data?.page ?? filters.page}
          totalPages={data?.total_pages ?? Math.max(1, Math.ceil((data?.total ?? 0) / DEFAULT_PAGE_SIZE))}
          pageSize={DEFAULT_PAGE_SIZE}
          isLoading={queue.isPending}
          isFetching={queue.isFetching}
          onPageChange={(page) => apply({ page })}
          onReset={reset}
          defaultHidden={{ expenditure: false }}
        />
      )}
    </>
  );
}
