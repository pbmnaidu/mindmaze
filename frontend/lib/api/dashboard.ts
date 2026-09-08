import { apiGet, buildQuery } from "./client";
import { SAMPLE_OVERVIEW } from "./dev-sample-data";
import type { HealthResponse, NationalOverviewResponse } from "@/lib/types";

export interface ScopeParams { role: "national" | "state" | "constituency"; state?: string; constituency?: string }

export function fetchOverview(scope: ScopeParams) {
  return apiGet<NationalOverviewResponse>(`/overview${buildQuery({ ...scope })}`, () => SAMPLE_OVERVIEW);
}

export function fetchHealth() {
  return apiGet<HealthResponse>("/health");
}
