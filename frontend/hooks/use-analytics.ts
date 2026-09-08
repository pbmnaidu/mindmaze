"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsSample } from "@/lib/api/analytics";
import { useRoleScope } from "@/components/providers/role-scope-provider";

export function useAnalytics() {
  const { apiScope } = useRoleScope();
  return useQuery({
    queryKey: ["analytics-sample", apiScope],
    queryFn: () => fetchAnalyticsSample(apiScope!),
    enabled: Boolean(apiScope),
  });
}
