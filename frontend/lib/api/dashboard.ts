import { apiGet } from "./client";
import { SAMPLE_OVERVIEW } from "./dev-sample-data";
import type { HealthResponse, NationalOverviewResponse } from "@/lib/types";

export function fetchOverview() {
  return apiGet<NationalOverviewResponse>("/overview", () => SAMPLE_OVERVIEW);
}

export function fetchHealth() {
  return apiGet<HealthResponse>("/health");
}
