"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/risk/risk-badge";
import { RiskScore } from "@/components/risk/risk-score";
import { WorkId } from "@/components/risk/work-id";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/states";
import { getPrimaryRiskFactor } from "@/lib/constants/risk";
import type { WorkRecord } from "@/lib/types";
import { toTitleCase } from "@/lib/utils/format";

export function PrioritizedWorks({ works, isLoading, title = "Prioritized works" }: { works: WorkRecord[] | undefined; isLoading: boolean; title?: string }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="prioritized-heading">
      <SectionHeading
        title={title}
        description="Which works should be reviewed first? Ranked by composite risk score."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/risk-monitor">
              Open Risk Monitor
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <Card className="overflow-hidden rounded-md py-0 shadow-none">
        <div className="overflow-x-auto">
          <Table className="min-w-max text-xs">
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Work ID</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">State</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Constituency</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Category</TableHead>
                <TableHead className="h-9 text-right text-[11px] uppercase tracking-wide">Risk score</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Risk level</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Primary risk factor</TableHead>
                <TableHead className="h-9 text-right text-[11px] uppercase tracking-wide">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j} className="py-3"><Skeleton className="h-3.5 w-full max-w-28" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !works || works.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="p-4">
                    <EmptyState title="No prioritized works available." description="The risk engine did not return any ranked works." className="border-0 py-6" />
                  </TableCell>
                </TableRow>
              ) : (
                works.map((work) => {
                  const primary = getPrimaryRiskFactor(work);
                  return (
                    <TableRow key={work.work_id} className="hover:bg-accent/40">
                      <TableCell className="py-2.5"><WorkId id={work.work_id} /></TableCell>
                      <TableCell className="py-2.5">{toTitleCase(work.State ?? work.state)}</TableCell>
                      <TableCell className="py-2.5">{toTitleCase(work.Constituency ?? work.constituency)}</TableCell>
                      <TableCell className="py-2.5 max-w-44 truncate">{work.main_sector || work.work_domain || work.effective_work_category}</TableCell>
                      <TableCell className="py-2.5 text-right"><RiskScore score={work.composite_risk_score} level={work.overall_risk_level} /></TableCell>
                      <TableCell className="py-2.5"><RiskBadge level={work.overall_risk_level} /></TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-foreground">{primary.label}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link href={`/projects/${encodeURIComponent(work.work_id)}`}>View details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </section>
  );
}
