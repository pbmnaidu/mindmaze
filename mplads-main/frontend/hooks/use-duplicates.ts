"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchDuplicateCandidates } from "@/lib/api/duplicates";
import type { DuplicateQueryParams } from "@/lib/types";

export function useDuplicates(params: DuplicateQueryParams) {
  return useQuery({
    queryKey: ["duplicate-candidates", params],
    queryFn: () => fetchDuplicateCandidates(params),
    placeholderData: keepPreviousData,
  });
}
