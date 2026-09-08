"use client";

import { ChartCard } from "@/components/shared/chart-card";
import { StatCard } from "@/components/shared/stat-card";
import { LevelBarChart } from "@/components/charts/level-bar-chart";
import { BucketBarChart } from "@/components/charts/bucket-bar-chart";
import type { AnalyticsSample } from "@/lib/api/analytics";
import { complianceIndicators, countByLevel } from "@/lib/utils/analytics";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { WorksList } from "./works-list";

export function ComplianceSection({ data }: { data: AnalyticsSample }) {
  const { works } = data;
  const levels = countByLevel(works, (w) => w.compliance_risk_level);
  const ind = complianceIndicators(works);
  const known = ind.withEvidence + ind.missingEvidence;
  const flagged = [...works]
    .filter((w) => (w.compliance_risk_score ?? 0) >= 50)
    .sort((a, b) => b.compliance_risk_score - a.compliance_risk_score)
    .slice(0, 6);

  const categories = [
    { label: "Evidence image missing", count: ind.missingEvidence },
    { label: "Completed without evidence", count: ind.completedWithoutEvidence },
    { label: "Completion before sanction", count: ind.completedBeforeSanction },
    { label: "Expenditure above sanction", count: ind.expenditureAboveSanction },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Evidence image on record" value={known ? formatPercent(ind.withEvidence / known, 1) : "—"} hint={`${formatNumber(ind.withEvidence)} of ${formatNumber(known)} works with a known evidence status`} />
        <StatCard label="Evidence status unknown" value={formatNumber(ind.evidenceUnknown)} hint="Field not present in record" />
        <StatCard label="Compliance score ≥ 50" value={formatNumber(flagged.length)} hint={`Among top ${formatNumber(works.length)} prioritized works`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard question="How severe are compliance indicators?" title="Compliance risk level distribution" description={`Compliance risk level across the top ${formatNumber(works.length)} prioritized works.`}>
          <LevelBarChart counts={levels} />
        </ChartCard>
        <ChartCard question="Which rules are triggering?" title="Compliance warning categories" description="Rule-based consistency checks evaluated from the record fields. A work may appear in more than one category.">
          <BucketBarChart data={categories} layout="vertical" emptyMessage="No compliance indicators available." />
        </ChartCard>
      </div>
      <WorksList
        title="Works with compliance warnings"
        description="Highest compliance risk scores in the prioritized sample, with the warning recorded by the rule engine."
        works={flagged}
        metric={(w) => ({ label: "Compliance score", value: formatNumber(Math.round(w.compliance_risk_score)) })}
        level={(w) => w.compliance_risk_level}
        detail={(w) => w.compliance_explanation}
        emptyMessage="No compliance indicators available."
      />
    </div>
  );
}
