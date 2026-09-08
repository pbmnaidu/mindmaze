import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/risk/risk-badge";
import { RiskScore } from "@/components/risk/risk-score";
import { SectionHeading } from "@/components/shared/section-heading";
import { getRiskComponents } from "@/lib/constants/risk";
import type { WorkRecord } from "@/lib/types";

export function RiskSummary({ work }: { work: WorkRecord }) {
  const components = getRiskComponents(work);
  return (
    <section className="flex flex-col gap-3" aria-labelledby="risk-summary-heading">
      <SectionHeading title="Risk summary" description="Each component is scored independently on a 0–100 scale before being combined into the composite score." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {components.map((c) => (
          <Card key={c.key} className="gap-2 rounded-md p-4 shadow-none">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <RiskScore score={c.score} level={c.level} withBar className="[&>span:first-child]:text-2xl" />
            {c.level ? (
              <RiskBadge level={c.level} />
            ) : (
              <span className="text-[11px] text-muted-foreground">Similarity-derived score; no level assigned</span>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

export function RiskSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
    </div>
  );
}
