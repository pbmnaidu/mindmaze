"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOverview } from "@/lib/api/dashboard";
import { fetchRiskQueue } from "@/lib/api/risk";

export const OVERVIEW_QUEUE_SIZE = 10;

export function useOverview() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
  });
}

/** Top prioritized works for the Overview page (first page of the ranked queue). */
export function usePrioritizedWorks() {
  return useQuery({
    queryKey: ["risk-queue", { page: 1, limit: OVERVIEW_QUEUE_SIZE }],
    queryFn: () => fetchRiskQueue({ page: 1, limit: OVERVIEW_QUEUE_SIZE }),
  });
}
