import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_WORKS } from "@/lib/api/dev-sample-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get("state");
  const category = searchParams.get("category");
  const severity = searchParams.get("severity");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  let records = SAMPLE_WORKS;
  if (severity) records = records.filter((w) => w.overall_risk_level === severity);
  if (state) records = records.filter((w) => w.State === state || w.state === state);
  if (category) records = records.filter((w) => w.work_category === category);
  if (search) {
    const q = search.toLowerCase();
    records = records.filter(
      (w) =>
        w.work_id.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        (w.mp_name ?? "").toLowerCase().includes(q)
    );
  }

  const total = records.length;
  const paginated = records.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    total,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(total / limit)),
    records: paginated
  });
}
