"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchFilterOptions, fetchRiskQueue } from "@/lib/api/risk";
import type { RiskQueueParams } from "@/lib/types";

export function useRiskMonitor(params: RiskQueueParams) {
  return useQuery({
    queryKey: ["risk-queue", params],
    queryFn: () => fetchRiskQueue(params),
    placeholderData: keepPreviousData,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
    staleTime: 60 * 60 * 1000,
  });
}
