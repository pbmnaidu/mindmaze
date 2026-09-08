"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RiskQueueParams } from "@/lib/types";

export interface QueueFilterState {
  search: string;
  state: string;
  constituency: string;
  category: string;
  severity: string;
  page: number;
}

export const EMPTY_FILTERS: QueueFilterState = {
  search: "",
  state: "",
  constituency: "",
  category: "",
  severity: "",
  page: 1,
};

/**
 * Filter state lives in the URL so every Risk Monitor / Projects view is
 * shareable and survives refresh. Changing any filter resets to page 1.
 */
export function useQueueFilters(pageSize: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<QueueFilterState>(() => {
    const page = Number(searchParams.get("page") ?? "1");
    return {
      search: searchParams.get("search") ?? "",
      state: searchParams.get("state") ?? "",
      constituency: searchParams.get("constituency") ?? "",
      category: searchParams.get("category") ?? "",
      severity: searchParams.get("severity") ?? "",
      page: Number.isFinite(page) && page > 0 ? page : 1,
    };
  }, [searchParams]);

  const apply = useCallback(
    (next: Partial<QueueFilterState>) => {
      const merged = { ...filters, ...next };
      if (!("page" in next)) merged.page = 1;
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        if (key === "page") {
          if (merged.page > 1) params.set("page", String(merged.page));
        } else if (value) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  const queryParams = useMemo<RiskQueueParams>(
    () => ({
      search: filters.search || undefined,
      state: filters.state || undefined,
      constituency: filters.constituency || undefined,
      category: filters.category || undefined,
      severity: filters.severity || undefined,
      page: filters.page,
      limit: pageSize,
    }),
    [filters, pageSize],
  );

  const activeCount = [filters.search, filters.state, filters.constituency, filters.category, filters.severity].filter(Boolean).length;

  return { filters, queryParams, apply, reset, activeCount };
}
