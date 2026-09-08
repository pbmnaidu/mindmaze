"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/shared/chart-card";
import { StatCard } from "@/components/shared/stat-card";
import { BucketBarChart } from "@/components/charts/bucket-bar-chart";
import { SimilarityCard } from "@/components/duplicates/similarity-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/states";
import type { AnalyticsSample } from "@/lib/api/analytics";
import { similarityBuckets } from "@/lib/utils/analytics";
import { formatNumber, formatScore } from "@/lib/utils/format";

export function DuplicateSection({ data }: { data: AnalyticsSample }) {
  const { duplicates, duplicatesTotal, works } = data;
  const buckets = similarityBuckets(duplicates);
  const top = [...duplicates].sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 3);
  const highDupWorks = works.filter((w) => (w.duplicate_risk_score ?? 0) >= 70).length;
  const maxSim = duplicates.reduce((m, d) => Math.max(m, d.similarity_score), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Candidate pairs" value={formatNumber(duplicatesTotal)} hint="Identified by the risk engine" />
        <StatCard label="Highest similarity" value={duplicates.length ? formatScore(maxSim) : "—"} hint="Among returned pairs" />
        <StatCard label="Prioritized works with duplicate score ≥ 70" value={formatNumber(highDupWorks)} hint={`Among top ${formatNumber(works.length)} prioritized works`} />
      </div>
      <ChartCard question="How similar are the candidate pairs?" title="Similarity score distribution" description={`Cosine similarity scores for ${formatNumber(duplicates.length)} returned candidate pairs. Higher scores warrant earlier verification.`}>
        <BucketBarChart data={buckets} colors={["var(--chart-3)", "var(--risk-medium)", "var(--risk-high)", "var(--risk-critical)"]} emptyMessage="No potential duplicate candidates found." />
      </ChartCard>
      <section className="flex flex-col gap-3">
        <SectionHeading
          as="h3"
          title="Highest-similarity candidates"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/duplicate-inspector">Open Duplicate Inspector <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </Button>
          }
        />
        {top.length === 0 ? (
          <EmptyState title="No potential duplicate candidates found." />
        ) : (
          <div className="flex flex-col gap-3">
            {top.map((pair) => <SimilarityCard key={`${pair.work_id_1}-${pair.work_id_2}`} pair={pair} />)}
          </div>
        )}
      </section>
    </div>
  );
}
