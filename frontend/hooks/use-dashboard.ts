"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOverview } from "@/lib/api/dashboard";
import { fetchRiskQueue } from "@/lib/api/risk";
import { useRoleScope } from "@/components/providers/role-scope-provider";

export const OVERVIEW_QUEUE_SIZE = 10;

export function useOverview() {
  const { apiScope } = useRoleScope();
  return useQuery({
    queryKey: ["overview", apiScope],
    queryFn: () => fetchOverview(apiScope!),
    enabled: Boolean(apiScope),
  });
}

/** Top prioritized works for the Overview page (first page of the ranked queue). */
export function usePrioritizedWorks() {
  const { apiScope } = useRoleScope();
  return useQuery({
    queryKey: ["risk-queue", apiScope, { page: 1, limit: OVERVIEW_QUEUE_SIZE }],
    queryFn: () => fetchRiskQueue({ ...apiScope!, page: 1, limit: OVERVIEW_QUEUE_SIZE }),
    enabled: Boolean(apiScope),
  });
}
