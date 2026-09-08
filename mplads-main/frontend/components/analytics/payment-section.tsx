"use client";

import { Info } from "lucide-react";
import { ChartCard } from "@/components/shared/chart-card";
import { BucketBarChart } from "@/components/charts/bucket-bar-chart";
import { StatCard } from "@/components/shared/stat-card";
import type { AnalyticsSample } from "@/lib/api/analytics";
import { disbursalBuckets } from "@/lib/utils/analytics";
import { formatInr, formatNumber, formatPercent } from "@/lib/utils/format";
import { WorksList } from "./works-list";

export function PaymentSection({ data }: { data: AnalyticsSample }) {
  const { works, overview } = data;
  const buckets = disbursalBuckets(works);
  const nationalRate = overview.summary.total_sanctioned_amount > 0
    ? overview.summary.total_disbursed_amount / overview.summary.total_sanctioned_amount
    : undefined;
  const rapid = [...works]
    .filter((w) => w.sanction_amount > 0 && !w.completion_date)
    .map((w) => ({ w, r: (w.effective_expenditure ?? 0) / w.sanction_amount }))
    .filter(({ r }) => r >= 0.75)
    .sort((a, b) => b.r - a.r)
    .slice(0, 6)
    .map(({ w }) => w);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>
          The service does not expose individual transaction records. Payment analysis is limited to the
          expenditure-to-sanction relationship available per work. Transaction-level frequency will appear here when the API provides it.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="National disbursal rate" value={formatPercent(nationalRate, 1)} hint="Disbursed ÷ sanctioned, all works" />
        <StatCard label="Total allocated" value={formatInr(overview.summary.total_allocated_funds)} hint="National aggregate" />
        <StatCard label="Works with high disbursal, not completed" value={formatNumber(rapid.length)} hint={`≥ 75% disbursed; among top ${formatNumber(works.length)} prioritized works`} />
      </div>
      <ChartCard question="How far along is disbursal?" title="Expenditure as a share of sanction" description={`Distribution of expenditure ÷ sanction amount across the top ${formatNumber(works.length)} prioritized works.`}>
        <BucketBarChart data={buckets} emptyMessage="No expenditure data available." />
      </ChartCard>
      <WorksList
        title="Rapid disbursal indicators"
        description="Works with a high share of sanction disbursed but no completion date on record. Requires verification of milestone documentation."
        works={rapid}
        metric={(w) => ({ label: "Disbursed", value: formatPercent(w.sanction_amount ? (w.effective_expenditure ?? 0) / w.sanction_amount : undefined) })}
        level={(w) => w.overall_risk_level}
        emptyMessage="No rapid disbursal indicators in the current sample."
      />
    </div>
  );
}
