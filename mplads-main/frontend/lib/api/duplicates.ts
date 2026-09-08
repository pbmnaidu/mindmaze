import { apiGet, buildQuery } from "./client";
import { SAMPLE_DUPLICATE_PAIRS } from "./dev-sample-data";
import type { CandidateDuplicatePair, DuplicateQueryParams, PaginatedResponse } from "@/lib/types";

export const DUPLICATE_PAGE_SIZE = 20;

function sampleDuplicates(params: DuplicateQueryParams): PaginatedResponse<CandidateDuplicatePair> {
  let records = SAMPLE_DUPLICATE_PAIRS;
  if (params.state) records = records.filter((d) => d.state === params.state);
  if (params.min_similarity) records = records.filter((d) => d.similarity_score >= params.min_similarity!);
  return { total: records.length, page: 1, limit: DUPLICATE_PAGE_SIZE, total_pages: 1, records };
}

export function fetchDuplicateCandidates(params: DuplicateQueryParams) {
  const query = buildQuery({
    state: params.state,
    constituency: params.constituency,
    min_similarity: params.min_similarity,
    page: params.page,
    limit: params.limit ?? DUPLICATE_PAGE_SIZE,
  });
  return apiGet<PaginatedResponse<CandidateDuplicatePair>>(
    `/duplicate-candidates${query}`,
    () => sampleDuplicates(params),
  );
}
