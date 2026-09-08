import { fetchDuplicateCandidates } from "./duplicates";
import { fetchOverview } from "./dashboard";
import { fetchRiskQueue } from "./risk";
import type {
  ApiResult,
  CandidateDuplicatePair,
  NationalOverviewResponse,
  WorkRecord,
} from "@/lib/types";
import type { ScopeParams } from "./dashboard";

/**
 * The backend has no dedicated aggregation endpoint for analytics. Analytics
 * are derived from (a) the national overview aggregates and (b) a bounded
 * sample of the prioritized queue — the top-ranked works only. Every
 * analytics view labels this basis explicitly.
 */
export const ANALYTICS_SAMPLE_SIZE = 100;

export interface AnalyticsSample {
  overview: NationalOverviewResponse;
  works: WorkRecord[];
  worksTotal: number;
  duplicates: CandidateDuplicatePair[];
  duplicatesTotal: number;
}

export async function fetchAnalyticsSample(scope: ScopeParams): Promise<ApiResult<AnalyticsSample>> {
  const [overview, queue, duplicates] = await Promise.all([
    fetchOverview(scope),
    fetchRiskQueue({ ...scope, limit: ANALYTICS_SAMPLE_SIZE, page: 1 }),
    fetchDuplicateCandidates({ ...scope, limit: ANALYTICS_SAMPLE_SIZE, page: 1 }),
  ]);

  const source =
    overview.source === "dev-fallback" || queue.source === "dev-fallback" || duplicates.source === "dev-fallback"
      ? "dev-fallback"
      : "api";

  return {
    source,
    data: {
      overview: overview.data,
      works: queue.data.records,
      worksTotal: queue.data.total,
      duplicates: duplicates.data.records,
      duplicatesTotal: duplicates.data.total,
    },
  };
}
