"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DataSourceNotice } from "@/components/shared/data-source-notice";
import { ErrorState } from "@/components/shared/states";
import { ChartCardSkeleton } from "@/components/shared/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOverview, usePrioritizedWorks } from "@/hooks/use-dashboard";
import { APP_TAGLINE } from "@/lib/constants/navigation";
import { KpiRow, KpiRowSkeleton } from "./kpi-row";
import { RiskDistribution } from "./risk-distribution";
import { StateRiskChart } from "./state-risk-chart";
import { CategoryRiskChart } from "./category-risk-chart";
import { PrioritizedWorks } from "./prioritized-works";

export function OverviewView() {
  const overview = useOverview();
  const queue = usePrioritizedWorks();

  return (
    <>
      <PageHeader
        title="Overview"
        description="MPLADS implementation monitoring and risk intelligence. What is happening, where attention is required, and which works should be reviewed first."
        eyebrow={<p className="text-xs font-medium text-primary">{APP_TAGLINE}</p>}
      />

      <DataSourceNotice source={overview.data?.source ?? queue.data?.source} />

      {overview.isPending ? (
        <>
          <KpiRowSkeleton />
          <Skeleton className="h-44 w-full" />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        </>
      ) : overview.isError ? (
        <ErrorState
          title="Unable to load the national overview."
          description="Summary statistics could not be retrieved from the risk intelligence service."
          onRetry={() => overview.refetch()}
          retrying={overview.isFetching}
        />
      ) : (
        <>
          <KpiRow overview={overview.data.data} />
          <RiskDistribution distribution={overview.data.data.risk_distribution} />
          <div className="grid gap-4 lg:grid-cols-2">
            <StateRiskChart states={overview.data.data.top_states} />
            <CategoryRiskChart categories={overview.data.data.category_distribution} />
          </div>
        </>
      )}

      {queue.isError ? (
        <ErrorState
          title="Unable to load prioritized works."
          onRetry={() => queue.refetch()}
          retrying={queue.isFetching}
        />
      ) : (
        <PrioritizedWorks works={queue.data?.data.records} isLoading={queue.isPending} />
      )}
    </>
  );
}
