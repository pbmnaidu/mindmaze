import { RISK_LEVEL_STYLES, normalizeRiskLevel } from "@/lib/constants/risk";
import { formatScore } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface RiskScoreProps {
  score: number | null | undefined;
  level?: string | null;
  /** Show a thin 0–100 bar under the number. */
  withBar?: boolean;
  className?: string;
}

/**
 * Numeric 0–100 score. When a level is provided the number is tinted to match,
 * otherwise it stays neutral (e.g. the duplicate component has no level).
 */
export function RiskScore({ score, level, withBar = false, className }: RiskScoreProps) {
  const normalized = normalizeRiskLevel(level);
  const styles = normalized ? RISK_LEVEL_STYLES[normalized] : null;
  const clamped = Math.max(0, Math.min(100, score ?? 0));

  return (
    <span className={cn("inline-flex flex-col gap-1", className)}>
      <span className={cn("font-mono text-sm font-semibold tabular", styles?.text ?? "text-foreground")}>
        {formatScore(score)}
      </span>
      {withBar && (
        <span className="h-1 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span className={cn("block h-full rounded-full", styles?.bar ?? "bg-muted-foreground/60")} style={{ width: `${clamped}%` }} />
        </span>
      )}
    </span>
  );
}
