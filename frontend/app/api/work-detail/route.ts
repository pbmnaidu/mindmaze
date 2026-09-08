import { NextRequest } from "next/server";
import { proxyBackendGet } from "@/lib/api/backend-proxy";

export async function GET(request: NextRequest) {
  return proxyBackendGet(request, "work-detail");
}
