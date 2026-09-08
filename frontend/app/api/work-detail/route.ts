import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_WORKS, SAMPLE_DUPLICATE_PAIRS } from "@/lib/api/dev-sample-data";

export async function GET(request: NextRequest) {
  const workId = request.nextUrl.searchParams.get("work_id");
  if (!workId) {
    return NextResponse.json({ error: "work_id parameter is required" }, { status: 400 });
  }

  const found = SAMPLE_WORKS.find((w) => w.work_id === workId) || SAMPLE_WORKS[0];
  const candidate_duplicates = SAMPLE_DUPLICATE_PAIRS.filter(
    (d) => d.work_id_1 === workId || d.work_id_2 === workId
  );

  return NextResponse.json({
    work: {
      ...found,
      work_id: workId
    },
    candidate_duplicates
  });
}
