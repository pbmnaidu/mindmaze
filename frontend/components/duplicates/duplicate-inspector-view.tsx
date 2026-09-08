"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceNotice } from "@/components/shared/data-source-notice";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { useDuplicates } from "@/hooks/use-duplicates";
import { useFilterOptions } from "@/hooks/use-risk-monitor";
import { DUPLICATE_PAGE_SIZE } from "@/lib/api/duplicates";
import { formatNumber, toTitleCase } from "@/lib/utils/format";
import { SimilarityCard } from "./similarity-card";
import { useRoleScope } from "@/components/providers/role-scope-provider";
import { MonitoringRequired } from "@/components/shared/monitoring-required";

const ALL = "__all__";
const SIMILARITY_OPTIONS = [70, 80, 90, 95];

export function DuplicateInspectorView() {
  const { apiScope, role, label } = useRoleScope();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = searchParams.get("state") ?? "";
  const minSimilarity = Number(searchParams.get("min_similarity") ?? "") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const update = useCallback(
    (next: { state?: string; min_similarity?: number | undefined; page?: number }) => {
      const params = new URLSearchParams();
      const merged = { state, min_similarity: minSimilarity, page: 1, ...next };
      if (merged.state) params.set("state", merged.state);
      if (merged.min_similarity) params.set("min_similarity", String(merged.min_similarity));
      if (merged.page > 1) params.set("page", String(merged.page));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [state, minSimilarity, pathname, router],
  );

  const params = useMemo(
    () => ({ ...(apiScope ?? {}), state: (apiScope?.state ?? state) || undefined, constituency: apiScope?.constituency, min_similarity: minSimilarity, page, limit: DUPLICATE_PAGE_SIZE }),
    [apiScope, state, minSimilarity, page],
  );

  const options = useFilterOptions(apiScope ?? {});
  const duplicates = useDuplicates(params);
  const data = duplicates.data?.data;
  const totalPages = data?.total_pages ?? Math.max(1, Math.ceil((data?.total ?? 0) / DUPLICATE_PAGE_SIZE));
  const hasFilters = Boolean(state || minSimilarity);

  if (!apiScope) return <MonitoringRequired />;
  const stateLocked = role !== "NATIONAL";
  return (
    <>
      <PageHeader
        title="Duplicate Inspector"
        description={`Potentially similar works within ${label}. Similarity is computed with TF-IDF and cosine similarity; a high score indicates a candidate for verification, not a confirmed duplicate.`}
      />

      <DataSourceNotice source={duplicates.data?.source} />

      <div className="flex flex-wrap items-end gap-3 rounded-md border bg-card p-3">
        <div className="flex min-w-44 flex-col gap-1.5">
          <Label htmlFor="dup-state" className="text-xs">State</Label>
          <Select value={(apiScope.state ?? state) || ALL} disabled={stateLocked} onValueChange={(v) => update({ state: v === ALL ? "" : v })}>
            <SelectTrigger id="dup-state" className="h-9 w-full text-xs" size="sm">
              <SelectValue placeholder="All states" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All states</SelectItem>
              {options.data?.data.states.map((s) => <SelectItem key={s} value={s}>{toTitleCase(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-44 flex-col gap-1.5">
          <Label htmlFor="dup-similarity" className="text-xs">Minimum similarity</Label>
          <Select value={minSimilarity ? String(minSimilarity) : ALL} onValueChange={(v) => update({ min_similarity: v === ALL ? undefined : Number(v) })}>
            <SelectTrigger id="dup-similarity" className="h-9 w-full text-xs" size="sm">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any similarity</SelectItem>
              {SIMILARITY_OPTIONS.map((v) => <SelectItem key={v} value={String(v)}>≥ {v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9" onClick={() => router.replace(pathname, { scroll: false })}>Reset</Button>
        )}
        <p className="ml-auto text-xs text-muted-foreground tabular" aria-live="polite">
          {duplicates.isPending ? "Loading…" : <><span className="font-medium text-foreground">{formatNumber(data?.total ?? 0)}</span> candidate pairs</>}
        </p>
      </div>

      {duplicates.isError ? (
        <ErrorState title="Unable to load duplicate candidates." onRetry={() => duplicates.refetch()} retrying={duplicates.isFetching} />
      ) : duplicates.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (data?.records.length ?? 0) === 0 ? (
        <EmptyState
          title="No potential duplicate candidates found."
          description={hasFilters ? "No candidate pairs match the selected filters." : "The risk engine did not identify any description pairs above the similarity threshold."}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data!.records.map((pair) => <SimilarityCard key={`${pair.work_id_1}-${pair.work_id_2}`} pair={pair} />)}
          <Card className="rounded-md py-0 shadow-none">
            <PaginationControls
              page={data?.page ?? page}
              totalPages={totalPages}
              total={data?.total ?? 0}
              pageSize={DUPLICATE_PAGE_SIZE}
              onPageChange={(p) => update({ page: p })}
              itemLabel="pairs"
              bordered={false}
            />
          </Card>
        </div>
      )}
    </>
  );
}
