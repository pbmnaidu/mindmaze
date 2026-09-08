import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_DUPLICATE_PAIRS } from "@/lib/api/dev-sample-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get("state");
  const minSimStr = searchParams.get("min_similarity");
  const minSim = minSimStr ? parseFloat(minSimStr) : 70;

  let records = SAMPLE_DUPLICATE_PAIRS;
  if (state) records = records.filter((d) => d.state === state);
  if (minSim) records = records.filter((d) => d.similarity_score >= minSim);

  return NextResponse.json({
    total: records.length,
    page: 1,
    limit: 20,
    total_pages: 1,
    records
  });
}
