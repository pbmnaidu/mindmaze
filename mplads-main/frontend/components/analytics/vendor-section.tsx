"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartCard } from "@/components/shared/chart-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/states";
import { LevelBarChart } from "@/components/charts/level-bar-chart";
import { BucketBarChart } from "@/components/charts/bucket-bar-chart";
import type { AnalyticsSample } from "@/lib/api/analytics";
import { aggregateVendors, countByLevel, vendorShareBuckets } from "@/lib/utils/analytics";
import { formatInr, formatNumber, formatPercent } from "@/lib/utils/format";

export function VendorSection({ data }: { data: AnalyticsSample }) {
  const { works } = data;
  const levels = countByLevel(works, (w) => w.vendor_risk_level);
  const shares = vendorShareBuckets(works);
  const vendors = aggregateVendors(works);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard question="How severe are vendor indicators?" title="Vendor risk level distribution" description={`Vendor risk level across the top ${formatNumber(works.length)} prioritized works.`}>
          <LevelBarChart counts={levels} />
        </ChartCard>
        <ChartCard question="How concentrated is procurement?" title="Top-vendor share of constituency sanctions" description="Share of a work's constituency sanctions held by its leading vendor. A 100% share indicates a single vendor.">
          <BucketBarChart data={shares} colors={["var(--risk-low)", "var(--risk-medium)", "var(--risk-high)", "var(--risk-critical)"]} emptyMessage="Vendor share data is not available for these works." />
        </ChartCard>
      </div>

      <section className="flex flex-col gap-3">
        <SectionHeading as="h3" title="Vendor concentration" description="Vendors by total sanctioned value across the prioritized works, with work count and highest observed constituency share." />
        <Card className="overflow-hidden rounded-md py-0 shadow-none">
          {vendors.length === 0 ? (
            <EmptyState title="No vendor data available." className="border-0" />
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-max text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 text-[11px] uppercase tracking-wide">Vendor</TableHead>
                    <TableHead className="h-9 text-right text-[11px] uppercase tracking-wide">Works</TableHead>
                    <TableHead className="h-9 text-right text-[11px] uppercase tracking-wide">Sanctioned</TableHead>
                    <TableHead className="h-9 text-right text-[11px] uppercase tracking-wide">Max share</TableHead>
                    <TableHead className="h-9 text-right text-[11px] uppercase tracking-wide">High/critical vendor risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => (
                    <TableRow key={v.vendor} className="hover:bg-accent/40">
                      <TableCell className="max-w-72 truncate py-2.5 font-medium" title={v.vendor}>{v.vendor}</TableCell>
                      <TableCell className="py-2.5 text-right font-mono tabular">{formatNumber(v.works)}</TableCell>
                      <TableCell className="py-2.5 text-right font-mono tabular">{formatInr(v.sanctioned)}</TableCell>
                      <TableCell className="py-2.5 text-right font-mono tabular">{formatPercent(v.maxShare)}</TableCell>
                      <TableCell className="py-2.5 text-right font-mono tabular">{formatNumber(v.highRiskWorks)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
