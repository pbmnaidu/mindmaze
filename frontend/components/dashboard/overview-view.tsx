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
import { RoleSelector } from "@/components/layout/role-selector";
import { useRoleScope } from "@/components/providers/role-scope-provider";

export function OverviewView() {
  const { role, label, isReady } = useRoleScope();
  const overview = useOverview();
  const queue = usePrioritizedWorks();

  if (!isReady || !role) {
    return <>
      <PageHeader title="Welcome to NIRIKSHAN AI" description="Select a monitoring role to activate scoped monitoring across the NIRIKSHAN platform." eyebrow={<p className="text-xs font-medium text-primary">{APP_TAGLINE}</p>} />
      <RoleSelector />
      <p className="text-xs text-muted-foreground">NIRIKSHAN is a decision-support prototype. Role selection sets a demonstration monitoring context; it is not government authentication or authorization.</p>
    </>;
  }

  const title = role === "NATIONAL" ? "National Monitoring Overview" : role === "STATE" ? "State Monitoring Overview" : "Constituency Monitoring Overview";
  const designation = role === "NATIONAL" ? "MoSPI Core Audit Team" : role === "STATE" ? "State Nodal Department Secretary / Chief Secretary" : "Member of Parliament";
  const queueTitle = role === "NATIONAL" ? "National high-priority queue" : role === "STATE" ? "State high-priority queue" : "Constituency work review queue";

  return (
    <>
      <PageHeader
        title={title}
        description={`${designation} · Scope: ${label}. What is happening, where attention is required, and which works should be reviewed first.`}
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
          title={`Unable to load ${label} monitoring data.`}
          description="Summary statistics could not be retrieved from the risk intelligence service."
          onRetry={() => overview.refetch()}
          retrying={overview.isFetching}
        />
      ) : (
        <>
          <KpiRow overview={overview.data.data} role={role} />
          <RiskDistribution distribution={overview.data.data.risk_distribution} />
          <div className="grid gap-4 lg:grid-cols-2">
            <StateRiskChart states={overview.data.data.top_states} level={overview.data.data.ranking_label ?? "State"} />
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
        <PrioritizedWorks works={queue.data?.data.records} isLoading={queue.isPending} title={queueTitle} />
      )}
    </>
  );
}
