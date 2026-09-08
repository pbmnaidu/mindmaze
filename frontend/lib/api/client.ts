import type { ApiResult } from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "/api";

/**
 * Development-only fallback. Sample data is only ever served when the backend is
 * unreachable AND the app is not a production build (or the fallback is explicitly
 * opted into). Production always reflects the real API, including its failures.
 */
/** Sample fixtures are opt-in for isolated UI development and never a default data source. */
export const DEV_FALLBACK_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEV_SAMPLE_DATA === "true";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === null) continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

async function fetchJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new ApiError("The risk intelligence service could not be reached.");
  }

  if (!res.ok) {
    throw new ApiError(
      res.status === 404
        ? "The requested record was not found."
        : "The risk intelligence service returned an error.",
      res.status,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError("The service returned an unexpected response.", res.status);
  }

  return (await res.json()) as T;
}

/**
 * Fetches from the API. If the request fails and a dev fallback is supplied
 * (and allowed), returns the fallback tagged with `source: "dev-fallback"`
 * so the UI can label it explicitly. Never silently in production.
 */
export async function apiGet<T>(
  path: string,
  devFallback?: () => T | undefined,
): Promise<ApiResult<T>> {
  try {
    const data = await fetchJson<T>(path);
    return { data, source: "api" };
  } catch (error) {
    if (DEV_FALLBACK_ENABLED && devFallback) {
      const fallback = devFallback();
      if (fallback !== undefined) return { data: fallback, source: "dev-fallback" };
    }
    throw error;
  }
}
