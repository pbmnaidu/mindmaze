import { AlertOctagon, AlertTriangle, ClipboardList, Layers } from "lucide-react";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { RiskBadge } from "@/components/risk/risk-badge";
import type { NationalOverviewResponse } from "@/lib/types";
import { formatInr, formatNumber } from "@/lib/utils/format";

export function KpiRow({ overview }: { overview: NationalOverviewResponse }) {
  const { summary, risk_distribution } = overview;
  const underReview = risk_distribution.MEDIUM + risk_distribution.HIGH + risk_distribution.CRITICAL;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total works"
        value={formatNumber(summary.total_works)}
        hint={`${formatNumber(summary.completed_works)} completed · ${formatInr(summary.total_sanctioned_amount)} sanctioned`}
        icon={<Layers />}
      />
      <StatCard
        label="Works under review"
        value={formatNumber(underReview)}
        hint="Medium, high, and critical risk indicators combined"
        icon={<ClipboardList />}
      />
      <StatCard
        label="High risk works"
        value={formatNumber(summary.high_risk_works)}
        hint="Review recommended"
        icon={<AlertTriangle />}
        accent={<RiskBadge level="HIGH" showIcon={false} />}
      />
      <StatCard
        label="Critical risk works"
        value={formatNumber(summary.critical_works)}
        hint="Investigation priority"
        icon={<AlertOctagon />}
        accent={<RiskBadge level="CRITICAL" showIcon={false} />}
      />
    </div>
  );
}

export function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
