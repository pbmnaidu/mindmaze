"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DataSourceNotice } from "@/components/shared/data-source-notice";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { useProject } from "@/hooks/use-projects";
import { ApiError } from "@/lib/api/client";
import { ProjectHeader, ProjectHeaderSkeleton } from "./project-header";
import { RiskSummary, RiskSummarySkeleton } from "./risk-summary";
import { RiskFactorList } from "./risk-factor-list";
import { ProjectInfoGrid } from "./project-info-grid";
import { SimilarWorks } from "./similar-works";
import { useRoleScope } from "@/components/providers/role-scope-provider";
import { MonitoringRequired } from "@/components/shared/monitoring-required";

export function ProjectDetailView({ workId }: { workId: string }) {
  const { apiScope, label } = useRoleScope();
  const project = useProject(workId);

  const notFound = project.isError && project.error instanceof ApiError && project.error.status === 404;

  if (!apiScope) return <MonitoringRequired />;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs items={[{ label: "Projects", href: "/projects" }, { label }, { label: workId }]} />
        <Button asChild variant="ghost" size="sm" className="h-8">
          <Link href="/risk-monitor">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Risk Monitor
          </Link>
        </Button>
      </div>

      <DataSourceNotice source={project.data?.source} />

      {project.isPending ? (
        <>
          <ProjectHeaderSkeleton />
          <RiskSummarySkeleton />
          <Skeleton className="h-64 w-full" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </>
      ) : notFound ? (
        <EmptyState
          title="Work record not found."
          description={`No record with ID ${workId} was returned by the risk intelligence service.`}
          action={<Button asChild variant="outline" size="sm"><Link href="/projects">Browse projects</Link></Button>}
        />
      ) : project.isError ? (
        <ErrorState
          title="Unable to load this work record."
          description="The investigation view could not be retrieved. Please try again."
          onRetry={() => project.refetch()}
          retrying={project.isFetching}
        />
      ) : (
        <>
          <ProjectHeader work={project.data.data.work} />
          <RiskSummary work={project.data.data.work} />
          <RiskFactorList work={project.data.data.work} />
          <ProjectInfoGrid work={project.data.data.work} />
          <SimilarWorks workId={project.data.data.work.work_id} pairs={project.data.data.candidate_duplicates ?? []} />
        </>
      )}
    </>
  );
}
