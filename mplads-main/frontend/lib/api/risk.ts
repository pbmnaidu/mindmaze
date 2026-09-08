import { apiGet, buildQuery } from "./client";
import { SAMPLE_FILTERS, SAMPLE_WORKS } from "./dev-sample-data";
import type { FilterOptions, PaginatedResponse, RiskQueueParams, WorkRecord } from "@/lib/types";

export const DEFAULT_PAGE_SIZE = 25;

function sampleRiskQueue(params: RiskQueueParams): PaginatedResponse<WorkRecord> {
  let records = SAMPLE_WORKS;
  if (params.severity) records = records.filter((w) => w.overall_risk_level === params.severity);
  if (params.state) records = records.filter((w) => w.State === params.state);
  if (params.category) records = records.filter((w) => w.work_category === params.category);
  if (params.constituency) {
    const c = params.constituency.toLowerCase();
    records = records.filter((w) => w.Constituency.toLowerCase().includes(c));
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    records = records.filter(
      (w) =>
        w.work_id.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        (w.mp_name ?? "").toLowerCase().includes(q),
    );
  }
  const limit = params.limit ?? DEFAULT_PAGE_SIZE;
  const page = params.page ?? 1;
  return {
    total: records.length,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(records.length / limit)),
    records: records.slice((page - 1) * limit, page * limit),
  };
}

/** Server-side filtered + paginated queue. The backend returns works ranked by composite risk. */
export function fetchRiskQueue(params: RiskQueueParams) {
  const query = buildQuery({
    state: params.state,
    constituency: params.constituency,
    category: params.category,
    severity: params.severity,
    search: params.search,
    page: params.page,
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
  });
  return apiGet<PaginatedResponse<WorkRecord>>(`/risk-monitor${query}`, () => sampleRiskQueue(params));
}

export function fetchFilterOptions() {
  return apiGet<FilterOptions>("/filters", () => SAMPLE_FILTERS);
}
