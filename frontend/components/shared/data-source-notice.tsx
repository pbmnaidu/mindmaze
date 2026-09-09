import { FlaskConical } from "lucide-react";
import type { DataSource } from "@/lib/types";

/**
 * Rendered whenever a screen is showing development sample data because the
 * backend was unreachable in a non-production build. Never shown for API data.
 */
export function DataSourceNotice({ source }: { source: DataSource | undefined }) {
  if (source !== "dev-fallback") return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-risk-medium/40 bg-risk-medium-muted px-3 py-2 text-xs text-foreground"
    >
      <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-risk-medium" aria-hidden="true" />
      <p>
        <span className="font-semibold">Development sample data.</span> The FastAPI backend was not
        reachable, so this view is showing local development fixtures. These are not live MPLADS figures.
        Configure <code className="font-mono">API_PROXY_TARGET</code> on the Vercel deployment to connect the service.
      </p>
    </div>
  );
}
