import { NextRequest, NextResponse } from "next/server";

const CONFIGURED_BACKEND_URL = (
  process.env.NIRIKSHAN_API_URL ||
  process.env.BACKEND_API_URL ||
  process.env.API_PROXY_TARGET ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

const BACKEND_URL = CONFIGURED_BACKEND_URL.replace(/\/api\/?$/, "");

/** Same-origin Next route adapter for the FastAPI risk engine. No sample data is served here. */
export async function proxyBackendGet(request: NextRequest, endpoint: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}${request.nextUrl.search}`, { cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Risk intelligence service unavailable" }, { status: 503 });
  }
}
