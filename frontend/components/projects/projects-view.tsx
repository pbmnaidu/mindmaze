"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceNotice } from "@/components/shared/data-source-notice";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { FilterBar } from "@/components/risk/filter-bar";
import { RiskTable } from "@/components/risk/risk-table";
import { useFilterOptions } from "@/hooks/use-risk-monitor";
import { useProjects } from "@/hooks/use-projects";
import { useQueueFilters } from "@/hooks/use-queue-filters";
import { formatNumber } from "@/lib/utils/format";
import { ProjectCard } from "./project-card";

const PAGE_SIZE = 24;

export function ProjectsView() {
  const { filters, queryParams, apply, reset, activeCount } = useQueueFilters(PAGE_SIZE);
  const options = useFilterOptions();
  const projects = useProjects(queryParams);
  const [layout, setLayout] = useState<"cards" | "table">("cards");

  const data = projects.data?.data;
  const totalPages = data?.total_pages ?? Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Projects"
        description="Searchable directory of MPLADS works with location, financial, and risk metadata. Open any work for its full investigation view."
        actions={
          <div role="group" aria-label="Layout" className="flex rounded-md border bg-card p-0.5">
            <Button variant={layout === "cards" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setLayout("cards")} aria-pressed={layout === "cards"}>
              <LayoutGrid className="size-3.5" aria-hidden="true" /> Cards
            </Button>
            <Button variant={layout === "table" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setLayout("table")} aria-pressed={layout === "table"}>
              <Rows3 className="size-3.5" aria-hidden="true" /> Table
            </Button>
          </div>
        }
      />

      <DataSourceNotice source={projects.data?.source} />

      <FilterBar filters={filters} options={options.data?.data} onApply={apply} onReset={reset} activeCount={activeCount} />

      {projects.isError ? (
        <ErrorState title="Unable to load projects." onRetry={() => projects.refetch()} retrying={projects.isFetching} />
      ) : layout === "table" ? (
        <RiskTable
          records={data?.records ?? []}
          total={data?.total ?? 0}
          page={data?.page ?? filters.page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          isLoading={projects.isPending}
          isFetching={projects.isFetching}
          onPageChange={(page) => apply({ page })}
          onReset={reset}
          defaultHidden={{ financial: false, vendor: false, duplicate: false, compliance: false }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground tabular" aria-live="polite">
            {projects.isPending ? "Loading…" : <><span className="font-medium text-foreground">{formatNumber(data?.total ?? 0)}</span> works match</>}
            {projects.isFetching && !projects.isPending && <span className="ml-2">Updating…</span>}
          </p>
          {projects.isPending ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
            </div>
          ) : (data?.records.length ?? 0) === 0 ? (
            <EmptyState
              title="No works match the selected filters."
              description="Adjust or reset the filters to widen the search."
              action={<Button variant="outline" size="sm" onClick={reset}>Reset filters</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data!.records.map((work) => <ProjectCard key={work.work_id} work={work} />)}
            </div>
          )}
          <Card className="rounded-md py-0 shadow-none">
            <PaginationControls
              page={data?.page ?? filters.page}
              totalPages={totalPages}
              total={data?.total ?? 0}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => apply({ page })}
              disabled={projects.isPending}
              itemLabel="works"
              bordered={false}
            />
          </Card>
        </div>
      )}
    </>
  );
}
