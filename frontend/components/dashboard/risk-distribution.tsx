import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk/risk-badge";
import { RISK_LEVELS, RISK_LEVEL_STYLES } from "@/lib/constants/risk";
import type { RiskDistribution as RiskDistributionData } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function RiskDistribution({ distribution }: { distribution: RiskDistributionData }) {
  const total = RISK_LEVELS.reduce((sum, level) => sum + (distribution[level] ?? 0), 0);

  return (
    <Card className="gap-4 rounded-md shadow-none">
      <CardHeader className="gap-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Where is attention required?</p>
        <CardTitle className="text-sm font-semibold">Risk distribution</CardTitle>
        <CardDescription className="text-xs">
          All {formatNumber(total)} works by composite risk level. Levels are indicators for review, not findings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-3 w-full overflow-hidden rounded-sm bg-muted" role="img" aria-label="Stacked bar of works by risk level">
          {RISK_LEVELS.map((level) => {
            const count = distribution[level] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <span
                key={level}
                className={cn("h-full", RISK_LEVEL_STYLES[level].bar)}
                style={{ width: `${pct}%`, minWidth: count > 0 ? 3 : 0 }}
                title={`${level}: ${formatNumber(count)}`}
              />
            );
          })}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RISK_LEVELS.map((level) => {
            const count = distribution[level] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={level} className="flex flex-col gap-1 rounded-md border p-3">
                <dt>
                  <RiskBadge level={level} />
                </dt>
                <dd className="font-mono text-lg font-semibold tabular">{formatNumber(count)}</dd>
                <dd className="text-[11px] text-muted-foreground tabular">{pct < 0.1 && count > 0 ? "<0.1" : pct.toFixed(1)}% of works</dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
