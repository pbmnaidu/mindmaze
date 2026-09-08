"use client";

import { ChartCard } from "@/components/shared/chart-card";
import { LevelBarChart } from "@/components/charts/level-bar-chart";
import { BucketBarChart } from "@/components/charts/bucket-bar-chart";
import { StatCard } from "@/components/shared/stat-card";
import type { AnalyticsSample } from "@/lib/api/analytics";
import { countByLevel, peerRatioBuckets } from "@/lib/utils/analytics";
import { formatInr, formatNumber, formatRatio } from "@/lib/utils/format";
import { WorksList } from "./works-list";

export function FinancialSection({ data }: { data: AnalyticsSample }) {
  const { works, overview } = data;
  const levels = countByLevel(works, (w) => w.financial_risk_level);
  const ratios = peerRatioBuckets(works);
  const withRatio = works.filter((w) => typeof w.amount_to_peer_ratio === "number");
  const maxRatio = withRatio.reduce((m, w) => Math.max(m, w.amount_to_peer_ratio!), 0);
  const outliers = [...withRatio].sort((a, b) => b.amount_to_peer_ratio! - a.amount_to_peer_ratio!).slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total sanctioned" value={formatInr(overview.summary.total_sanctioned_amount)} hint="National aggregate" />
        <StatCard label="Total disbursed" value={formatInr(overview.summary.total_disbursed_amount)} hint="National aggregate" />
        <StatCard label="Highest peer ratio" value={withRatio.length ? formatRatio(maxRatio) : "—"} hint={`Among top ${formatNumber(works.length)} prioritized works`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard question="How severe are financial indicators?" title="Financial risk level distribution" description={`Financial risk level assigned to each of the top ${formatNumber(works.length)} prioritized works.`}>
          <LevelBarChart counts={levels} />
        </ChartCard>
        <ChartCard question="How far do sanction amounts sit from peers?" title="Sanction amount relative to category median" description="Peer ratio = sanction amount ÷ median for the same category and state. Works above 3× are statistical upper-tail outliers.">
          <BucketBarChart data={ratios} colors={["var(--risk-low)", "var(--risk-medium)", "var(--risk-high)", "var(--risk-critical)"]} emptyMessage="Peer ratio data is not available for these works." />
        </ChartCard>
      </div>
      <WorksList
        title="Unusual expenditure indicators"
        description="Works with the highest sanction-to-peer-median ratios. Review recommended; a high ratio is not itself evidence of irregularity."
        works={outliers}
        metric={(w) => ({ label: "Peer ratio", value: formatRatio(w.amount_to_peer_ratio) })}
        level={(w) => w.financial_risk_level}
        emptyMessage="No peer ratio data available."
      />
    </div>
  );
}
