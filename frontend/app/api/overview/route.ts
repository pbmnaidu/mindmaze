import { NextResponse } from "next/server";
import { SAMPLE_OVERVIEW } from "@/lib/api/dev-sample-data";

export async function GET() {
  return NextResponse.json(SAMPLE_OVERVIEW);
}
