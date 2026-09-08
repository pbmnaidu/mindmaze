import { apiGet, ApiError, buildQuery, DEV_FALLBACK_ENABLED } from "./client";
import { SAMPLE_DUPLICATE_PAIRS, SAMPLE_WORKS } from "./dev-sample-data";
import type { ApiResult, WorkDetailResponse } from "@/lib/types";

function sampleWorkDetail(workId: string): WorkDetailResponse | undefined {
  const work = SAMPLE_WORKS.find((w) => w.work_id === workId);
  if (!work) return undefined;
  return {
    work,
    candidate_duplicates: SAMPLE_DUPLICATE_PAIRS.filter(
      (d) => d.work_id_1 === workId || d.work_id_2 === workId,
    ),
  };
}

/**
 * The backend exposes work detail as `/work-detail?work_id=` with a
 * path-parameter form as a secondary route. Both are attempted before failing.
 */
export async function fetchWorkDetail(workId: string): Promise<ApiResult<WorkDetailResponse>> {
  const routes = [
    `/work-detail${buildQuery({ work_id: workId })}`,
    `/work-detail/${encodeURIComponent(workId)}`,
  ];

  let lastError: unknown = new ApiError("The requested record was not found.", 404);
  for (const route of routes) {
    try {
      const result = await apiGet<WorkDetailResponse>(route);
      if (result.data?.work) return result;
    } catch (error) {
      lastError = error;
    }
  }

  if (DEV_FALLBACK_ENABLED) {
    const sample = sampleWorkDetail(workId);
    if (sample) return { data: sample, source: "dev-fallback" };
  }

  throw lastError;
}
