"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchRiskQueue } from "@/lib/api/risk";
import { fetchWorkDetail } from "@/lib/api/projects";
import type { RiskQueueParams } from "@/lib/types";

/** The work directory is served by the same ranked, filterable endpoint as the queue. */
export function useProjects(params: RiskQueueParams) {
  return useQuery({
    queryKey: ["risk-queue", params],
    queryFn: () => fetchRiskQueue(params),
    placeholderData: keepPreviousData,
  });
}

export function useProject(workId: string) {
  return useQuery({
    queryKey: ["work-detail", workId],
    queryFn: () => fetchWorkDetail(workId),
    enabled: Boolean(workId),
  });
}
