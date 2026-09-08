"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsSample } from "@/lib/api/analytics";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics-sample"],
    queryFn: fetchAnalyticsSample,
  });
}
